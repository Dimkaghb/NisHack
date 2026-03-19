import asyncio
import re
import time

import structlog

from app.agents.state import PipelineState

log = structlog.get_logger()

# Map business types to relevant Krisha property type IDs
# "free" (1) is always included — can be used for any business
BUSINESS_TO_KRISHA_TYPES: dict[str, list[int]] = {
    "fastfood": [6, 1],    # Общепит + Свободное назначение
    "cafe": [6, 1],        # Общепит + Свободное назначение
    "office": [2, 1],      # Офисы + Свободное назначение
    "retail": [3, 1],      # Магазины + Свободное назначение
    "pharmacy": [11, 1],   # Медцентры/аптеки + Свободное назначение
}

# Max pages to scrape per type during on-demand search (balance speed vs coverage)
MAX_PAGES_PER_TYPE = 3

# Max detail page fetches for coordinates (avoid long waits)
MAX_COORD_FETCHES = 20

# Pattern to extract area from title like "· 106 м²"
_AREA_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*м²")

# Pattern to extract floor number from title/description like "4 этаж", "4-й этаж"
_FLOOR_RE = re.compile(r"(\d+)[\s-]*й?\s*этаж", re.IGNORECASE)


def _parse_area_from_title(title: str | None) -> float | None:
    if not title:
        return None
    m = _AREA_RE.search(title)
    if m:
        return float(m.group(1).replace(",", "."))
    return None


def _parse_floor_from_text(title: str | None, description: str | None) -> int | None:
    for text in (title, description):
        if not text:
            continue
        m = _FLOOR_RE.search(text)
        if m:
            return int(m.group(1))
    return None


def _apply_search_query_filters(listings: list[dict], search_query: dict) -> list[dict]:
    """Apply SearchQuery location_requirements to listings.

    Lenient: listings with missing data are kept (they'll score poorly).
    """
    lr = search_query.get("location_requirements", {})
    bp = search_query.get("business_profile", {})

    exclude_types: list[str] = []
    if bp.get("type") != "office":
        exclude_types = ["office", "склад"]

    prefer_floor: str | None = lr.get("floor")
    area_min = lr.get("min_area_sqm")
    area_max = lr.get("max_area_sqm")
    area_range: list[int] | None = [area_min, area_max] if area_min and area_max else None

    max_budget = lr.get("max_budget_tenge")

    filtered: list[dict] = []
    for listing in listings:
        prop_type = (listing.get("property_type") or "").lower()
        title_lower = (listing.get("title") or "").lower()

        # --- Property type exclusion ---
        if exclude_types and prop_type:
            if any(ex in prop_type for ex in exclude_types):
                continue

        # --- Floor filter ---
        if prefer_floor == "ground":
            floor = listing.get("floor") or _parse_floor_from_text(
                listing.get("title"), listing.get("description")
            )
            if floor is not None and floor > 1:
                if "1 этаж" not in title_lower and "первый этаж" not in title_lower:
                    continue
        elif prefer_floor == "low":
            floor = listing.get("floor") or _parse_floor_from_text(
                listing.get("title"), listing.get("description")
            )
            if floor is not None and floor > 3:
                continue

        # --- Area range filter (soft: keep if area unknown) ---
        if area_range and len(area_range) == 2:
            area = listing.get("area_sqm")
            if area is not None:
                if area < area_range[0] * 0.5 or area > area_range[1] * 2.0:
                    continue

        # --- Budget filter (soft: exclude only if WAY over budget) ---
        if max_budget:
            price = listing.get("price_tenge")
            if price is not None and price > max_budget * 1.5:
                continue

        filtered.append(listing)

    return filtered


async def _scrape_on_demand(
    business_type: str,
    district: str | None,
    max_pages: int = MAX_PAGES_PER_TYPE,
) -> list[dict]:
    """On-demand scrape of Krisha.kz for relevant property types."""
    from app.scrapers.krisha import KrishaScraper, PROPERTY_TYPE_MAP

    type_ids = BUSINESS_TO_KRISHA_TYPES.get(business_type, [1])
    scraper = KrishaScraper()
    all_listings: list[dict] = []

    for type_id in type_ids:
        type_name = PROPERTY_TYPE_MAP.get(type_id, "free")
        try:
            listings = await scraper._fetch_type(type_id, type_name, max_pages=max_pages)
            all_listings.extend(listings)
            log.info(
                "searcher_scraped_type",
                type_id=type_id,
                type_name=type_name,
                count=len(listings),
            )
        except Exception as e:
            log.error(
                "searcher_scrape_type_failed",
                type_id=type_id,
                type_name=type_name,
                error=str(e),
            )

    return all_listings


async def _fetch_coordinates(listings: list[dict], max_fetches: int = MAX_COORD_FETCHES) -> None:
    """Fetch coordinates from Krisha detail pages for listings that need them.

    Only fetches up to max_fetches to keep total time reasonable.
    """
    from app.scrapers.krisha import KrishaScraper

    sem = asyncio.Semaphore(5)
    scraper = KrishaScraper()
    updated = 0

    # Only fetch for listings without coords, up to the limit
    needing = [
        lst for lst in listings
        if (lst.get("lat") is None or lst.get("lng") is None) and lst.get("external_id")
    ]
    to_fetch = needing[:max_fetches]

    if not to_fetch:
        return

    async def _fetch_one(listing: dict) -> None:
        nonlocal updated
        async with sem:
            try:
                details = await scraper.fetch_listing_details(listing["external_id"])
                if details:
                    if details.get("lat"):
                        listing["lat"] = details["lat"]
                    if details.get("lng"):
                        listing["lng"] = details["lng"]
                    if details.get("description"):
                        listing["description"] = details["description"]
                    updated += 1
            except Exception as e:
                log.debug(
                    "searcher_detail_fetch_failed",
                    external_id=listing.get("external_id"),
                    error=str(e),
                )

    await asyncio.gather(*[_fetch_one(lst) for lst in to_fetch])
    log.info(
        "searcher_coordinates_fetched",
        needed=len(needing),
        attempted=len(to_fetch),
        updated=updated,
    )


def _deduplicate(listings: list[dict]) -> list[dict]:
    """Deduplicate listings by external_id + source."""
    seen: set[str] = set()
    deduped: list[dict] = []
    for lst in listings:
        key = f"{lst.get('source', '')}:{lst.get('external_id', '')}"
        if key in seen:
            continue
        seen.add(key)
        deduped.append(lst)
    return deduped


async def searcher_node(state: PipelineState) -> dict:
    """LangGraph node: actively searches for listings matching the SearchQuery.

    Flow:
    1. On-demand scrape Krisha.kz for relevant property types
    2. Read existing DB listings as baseline
    3. Merge and deduplicate
    4. Apply SearchQuery filters FIRST (before coord fetch to save time)
    5. Fetch coordinates only for filtered listings (capped at 20)
    6. Upsert new listings to DB

    Returns all matching listings that pass filters.
    """
    t0 = time.monotonic()
    errors: list[str] = []
    business_type = state["business_type"]
    district = state.get("district")
    search_query = state.get("search_query") or {}

    # --- Step 1: On-demand scrape from Krisha ---
    scraped_listings: list[dict] = []
    try:
        scraped_listings = await _scrape_on_demand(business_type, district)
        log.info("searcher_scrape_done", count=len(scraped_listings))
    except Exception as e:
        errors.append(f"searcher_node: scrape failed — {e}")
        log.error("searcher_scrape_failed", error=str(e))

    # --- Step 2: Read existing DB listings as baseline ---
    db_listings: list[dict] = []
    try:
        from app.db.client import get_db

        db = await get_db()
        query = db.table("listings").select("*")
        if district:
            query = query.eq("district", district)

        result = await query.limit(200).execute()
        db_listings = result.data or []
        log.info("searcher_db_read", count=len(db_listings))
    except Exception as e:
        errors.append(f"searcher_node: DB read failed — {e}")
        log.error("searcher_db_failed", error=str(e))

    # --- Step 3: Merge and deduplicate ---
    all_listings = scraped_listings + db_listings
    all_listings = _deduplicate(all_listings)
    log.info(
        "searcher_merged",
        scraped=len(scraped_listings),
        db=len(db_listings),
        deduped=len(all_listings),
    )

    # --- Step 4: Parse area from title if missing ---
    for listing in all_listings:
        if listing.get("area_sqm") is None:
            listing["area_sqm"] = _parse_area_from_title(listing.get("title"))

    # --- Step 5: Apply filters FIRST (before coord fetch) ---
    if search_query:
        before = len(all_listings)
        all_listings = _apply_search_query_filters(all_listings, search_query)
        log.info("searcher_filtered", before=before, after=len(all_listings))

    # Apply user area minimum
    area_min = state.get("area_sqm_min")
    if area_min:
        all_listings = [
            lst for lst in all_listings
            if lst.get("area_sqm") is None or lst["area_sqm"] >= area_min
        ]

    # --- Step 6: Fetch coordinates ONLY for filtered listings (capped) ---
    try:
        await _fetch_coordinates(all_listings, max_fetches=MAX_COORD_FETCHES)
    except Exception as e:
        errors.append(f"searcher_node: coordinate fetch failed — {e}")

    # --- Step 7: Upsert new scraped listings to DB ---
    if scraped_listings:
        try:
            from app.db.client import get_db
            from app.models.listing import ListingUpsert

            db = await get_db()
            upsert_rows = []
            for lst in scraped_listings:
                try:
                    validated = ListingUpsert(**{
                        k: v for k, v in lst.items()
                        if k in ListingUpsert.model_fields
                    })
                    upsert_rows.append(validated.model_dump())
                except Exception:
                    continue

            if upsert_rows:
                await db.table("listings").upsert(
                    upsert_rows, on_conflict="external_id,source"
                ).execute()
                log.info("searcher_upserted", count=len(upsert_rows))
        except Exception as e:
            errors.append(f"searcher_node: DB upsert failed — {e}")

    duration_ms = round((time.monotonic() - t0) * 1000)
    log.info(
        "searcher_node_done",
        total_listings=len(all_listings),
        with_coords=sum(1 for l in all_listings if l.get("lat") and l.get("lng")),
        errors=len(errors),
        duration_ms=duration_ms,
    )

    return {
        "raw_listings": all_listings,
        "errors": errors,
    }
