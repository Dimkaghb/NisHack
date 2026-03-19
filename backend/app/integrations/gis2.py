import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

log = structlog.get_logger()

# 2GIS rubric IDs for competitor search by business type
BUSINESS_RUBRICS: dict[str, list[int]] = {
    "fastfood": [165],       # Фастфуд
    "cafe": [161, 164],      # Кафе, Рестораны
    "office": [13796],       # Бизнес-центры
    "retail": [373],         # Продуктовые магазины / супермаркеты
    "pharmacy": [207],       # Аптеки
}

# Russian query terms as fallback when rubric search returns nothing
BUSINESS_QUERIES: dict[str, str] = {
    "fastfood": "фастфуд",
    "cafe": "кафе",
    "office": "бизнес-центр",
    "retail": "магазин",
    "pharmacy": "аптека",
}


class TwoGISClient:
    """2GIS Places API client for competitor density search in Almaty."""

    BASE_URL = "https://catalog.api.2gis.com/3.0"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.twogis_api_key
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "TwoGISClient":
        self._client = httpx.AsyncClient(timeout=10.0)
        return self

    async def __aexit__(self, *args: object) -> None:
        if self._client:
            await self._client.aclose()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search_nearby(
        self,
        lat: float,
        lng: float,
        query: str,
        radius: int = 500,
    ) -> list[dict]:
        """Search for nearby businesses by text query."""
        resp = await self._client.get(
            f"{self.BASE_URL}/items",
            params={
                "q": query,
                "point": f"{lng},{lat}",  # 2GIS uses lon,lat order
                "radius": radius,
                "key": self.api_key,
                "fields": "items.point,items.rubrics,items.address_name",
                "sort": "distance",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("result", {}).get("items", [])

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def search_by_rubric(
        self,
        lat: float,
        lng: float,
        rubric_ids: list[int],
        radius: int = 500,
    ) -> list[dict]:
        """Search for nearby businesses by rubric (category) IDs."""
        resp = await self._client.get(
            f"{self.BASE_URL}/items",
            params={
                "rubric_id": ",".join(str(r) for r in rubric_ids),
                "point": f"{lng},{lat}",
                "radius": radius,
                "key": self.api_key,
                "fields": "items.point,items.rubrics,items.address_name",
                "sort": "distance",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("result", {}).get("items", [])

    async def count_competitors(
        self,
        lat: float,
        lng: float,
        business_type: str,
        radius: int = 500,
    ) -> int:
        """Count competitor businesses near a location for a given business type.

        First tries rubric-based search (more precise), falls back to text query.
        """
        rubric_ids = BUSINESS_RUBRICS.get(business_type)
        items: list[dict] = []

        if rubric_ids:
            try:
                items = await self.search_by_rubric(lat, lng, rubric_ids, radius)
            except Exception as e:
                log.warning(
                    "gis2_rubric_search_failed",
                    business_type=business_type,
                    error=str(e),
                )

        # Fallback to text query if rubric search returned nothing
        if not items:
            query = BUSINESS_QUERIES.get(business_type, business_type)
            try:
                items = await self.search_nearby(lat, lng, query, radius)
            except Exception as e:
                log.warning(
                    "gis2_text_search_failed",
                    business_type=business_type,
                    error=str(e),
                )
                return 0

        count = len(items)
        log.debug(
            "gis2_competitor_count",
            lat=lat,
            lng=lng,
            business_type=business_type,
            count=count,
        )
        return count
