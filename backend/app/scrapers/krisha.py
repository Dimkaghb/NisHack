import json
import re
import time

import structlog
from bs4 import BeautifulSoup

from app.models.listing import ListingUpsert
from app.scrapers.base import BaseScraper

log = structlog.get_logger()

# Krisha.kz commercial property type filter values (das[com.use_case])
PROPERTY_TYPE_MAP: dict[int, str] = {
    1: "free",       # Свободное назначение
    2: "office",     # Офисы
    3: "retail",     # Магазины и бутики
    6: "cafe",       # Общепит (кафе, рестораны)
    11: "pharmacy",  # Медцентры и аптеки
}

# Almaty district name normalization (from Russian to canonical)
DISTRICT_ALIASES: dict[str, str] = {
    "Алмалинский": "Almaly",
    "Алмалы": "Almaly",
    "Медеуский": "Medeu",
    "Медеу": "Medeu",
    "Бостандыкский": "Bostandyk",
    "Бостандык": "Bostandyk",
    "Алатауский": "Alatau",
    "Алатау": "Alatau",
    "Ауэзовский": "Auezov",
    "Ауэзов": "Auezov",
    "Жетысуский": "Zhetysu",
    "Жетысу": "Zhetysu",
    "Турксибский": "Turksib",
    "Турксиб": "Turksib",
    "Наурызбайский": "Nauryzbai",
    "Наурызбай": "Nauryzbai",
}

BASE_URL = "https://krisha.kz"
COMMERCIAL_RENT_URL = f"{BASE_URL}/arenda/kommercheskaya-nedvizhimost/almaty/"


class KrishaScraper(BaseScraper):
    """Scraper for Krisha.kz commercial real estate listings in Almaty."""

    async def fetch_commercial_listings(
        self, district: str | None = None
    ) -> list[dict]:
        """Fetch all commercial listings across relevant property types.

        Returns list of dicts ready for ListingUpsert.
        """
        t0 = time.monotonic()
        all_listings: list[dict] = []

        for type_id, type_name in PROPERTY_TYPE_MAP.items():
            try:
                listings = await self._fetch_type(type_id, type_name)
                all_listings.extend(listings)
                log.info(
                    "krisha_type_fetched",
                    type_id=type_id,
                    type_name=type_name,
                    count=len(listings),
                )
            except Exception as e:
                log.error(
                    "krisha_type_fetch_failed",
                    type_id=type_id,
                    type_name=type_name,
                    error=str(e),
                )

        duration_ms = round((time.monotonic() - t0) * 1000)
        log.info(
            "krisha_scrape_complete",
            total_listings=len(all_listings),
            duration_ms=duration_ms,
        )
        return all_listings

    async def _fetch_type(
        self, type_id: int, type_name: str, max_pages: int = 15
    ) -> list[dict]:
        """Fetch listings for a specific commercial property type."""
        listings: list[dict] = []
        page = 1

        while page <= max_pages:
            params: dict[str, str | int] = {
                "das[com.use_case]": type_id,
                "page": page,
            }
            resp = await self.get(COMMERCIAL_RENT_URL, params=params)
            page_listings = self._parse_index_page(resp.text, type_name)

            if not page_listings:
                break

            listings.extend(page_listings)
            log.debug(
                "krisha_page_fetched",
                type_name=type_name,
                page=page,
                count=len(page_listings),
            )

            # Check if there's a next page
            if not self._has_next_page(resp.text):
                break

            page += 1

        return listings

    def _parse_index_page(self, html: str, type_name: str) -> list[dict]:
        """Parse a Krisha.kz search results page and extract listing data."""
        soup = BeautifulSoup(html, "lxml")
        cards = soup.select("div.a-card[data-product-id]")
        listings: list[dict] = []

        for card in cards:
            try:
                listing = self._parse_card(card, type_name)
                if listing:
                    listings.append(listing)
            except Exception as e:
                card_id = card.get("data-product-id", "unknown")
                log.warning("krisha_card_parse_failed", card_id=card_id, error=str(e))

        return listings

    def _parse_card(self, card: BeautifulSoup, type_name: str) -> dict | None:
        """Parse a single listing card from the search results page."""
        external_id = card.get("data-product-id")
        if not external_id:
            return None

        # Title and URL
        title_el = card.select_one("a.a-card__title")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)
        url = BASE_URL + title_el.get("href", "")

        # Address and district
        address_el = card.select_one("div.a-card__subtitle")
        address = address_el.get_text(strip=True) if address_el else ""
        district = self._extract_district(address)

        # Price
        price_tenge, price_per_sqm = self._parse_price(card)

        # Area from title (e.g., "Офисы . 550 м²")
        area_sqm = self._extract_area_from_title(title)

        # Photo
        photo_urls: list[str] = []
        img_el = card.select_one("img.a-image__img")
        if img_el and img_el.get("src"):
            photo_urls.append(img_el["src"])

        return ListingUpsert(
            source="krisha",
            external_id=str(external_id),
            title=title,
            address=address,
            district=district,
            price_tenge=price_tenge,
            price_per_sqm=price_per_sqm,
            area_sqm=area_sqm,
            property_type=type_name,
            url=url,
            photo_urls=photo_urls,
            raw_data={"title_raw": title, "address_raw": address},
        ).model_dump()

    def _parse_price(self, card: BeautifulSoup) -> tuple[int | None, int | None]:
        """Extract price and price per sqm from a listing card."""
        price_el = card.select_one("div.a-card__price")
        if not price_el:
            return None, None

        price_text = price_el.get_text(" ", strip=True)

        # Main price: digits separated by spaces/nbsp, e.g. "500 000 〒"
        price_tenge: int | None = None
        price_per_sqm: int | None = None

        # Extract all price-like numbers
        price_matches = re.findall(r"([\d\s\xa0]+)\s*[₸〒]", price_text)
        if price_matches:
            # First match is the main price
            price_str = re.sub(r"[\s\xa0]", "", price_matches[0])
            try:
                price_tenge = int(price_str)
            except ValueError:
                pass

        # Price per sqm: "4 545 〒 за м²" pattern
        per_sqm_match = re.search(r"([\d\s\xa0]+)\s*[₸〒]\s*за\s*м", price_text)
        if per_sqm_match:
            sqm_str = re.sub(r"[\s\xa0]", "", per_sqm_match.group(1))
            try:
                price_per_sqm = int(sqm_str)
            except ValueError:
                pass

        return price_tenge, price_per_sqm

    def _extract_area_from_title(self, title: str) -> float | None:
        """Extract area in sqm from title like 'Офисы . 550 м²'."""
        match = re.search(r"([\d.,]+)\s*м[²2]?", title)
        if match:
            try:
                return float(match.group(1).replace(",", "."))
            except ValueError:
                pass
        return None

    def _extract_district(self, address: str) -> str | None:
        """Extract and normalize district name from address string."""
        for alias, canonical in DISTRICT_ALIASES.items():
            if alias.lower() in address.lower():
                return canonical

        # Try to match "X р-н" pattern
        match = re.search(r"(\w+)\s*р-н", address)
        if match:
            district_raw = match.group(1)
            for alias, canonical in DISTRICT_ALIASES.items():
                if alias.lower().startswith(district_raw.lower()):
                    return canonical

        return None

    def _has_next_page(self, html: str) -> bool:
        """Check if there's a next page in pagination."""
        soup = BeautifulSoup(html, "lxml")
        next_btn = soup.select_one("a.paginator__btn--next")
        return next_btn is not None

    async def fetch_listing_details(self, listing_id: str) -> dict | None:
        """Fetch individual listing page to get coordinates and full details."""
        url = f"{BASE_URL}/a/show/{listing_id}"
        try:
            resp = await self.get(url)
            return self._parse_detail_page(resp.text, listing_id)
        except Exception as e:
            log.error("krisha_detail_fetch_failed", listing_id=listing_id, error=str(e))
            return None

    def _parse_detail_page(self, html: str, listing_id: str) -> dict | None:
        """Parse individual listing page for coordinates and extended info."""
        # Extract window.data JSON for coordinates
        match = re.search(r"window\.data\s*=\s*(\{.+?\});\s*</script>", html, re.DOTALL)
        if not match:
            return None

        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            log.warning("krisha_detail_json_parse_failed", listing_id=listing_id)
            return None

        advert = data.get("advert", {})
        map_data = advert.get("map", {})

        result: dict = {}
        if map_data.get("lat") and map_data.get("lon"):
            result["lat"] = float(map_data["lat"])
            result["lng"] = float(map_data["lon"])

        # Full description
        soup = BeautifulSoup(html, "lxml")
        desc_el = soup.select_one("div.js-description.a-text")
        if desc_el:
            result["description"] = desc_el.get_text(strip=True)

        return result if result else None
