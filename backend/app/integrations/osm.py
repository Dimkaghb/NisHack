import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

log = structlog.get_logger()

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


class OSMClient:
    """OpenStreetMap Overpass API client for transit data in Almaty."""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "OSMClient":
        self._client = httpx.AsyncClient(timeout=10.0)
        return self

    async def __aexit__(self, *args: object) -> None:
        if self._client:
            await self._client.aclose()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4))
    async def _query(self, overpass_ql: str) -> list[dict]:
        """Execute an Overpass QL query and return elements."""
        resp = await self._client.post(
            OVERPASS_URL,
            data={"data": overpass_ql},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("elements", [])

    async def count_bus_stops(self, lat: float, lng: float, radius: int = 300) -> int:
        """Count bus stops within radius meters of a coordinate."""
        query = f"""
[out:json];
node["highway"="bus_stop"](around:{radius},{lat},{lng});
out body;
"""
        try:
            elements = await self._query(query)
            count = len(elements)
            log.debug("osm_bus_stops", lat=lat, lng=lng, radius=radius, count=count)
            return count
        except Exception as e:
            log.warning("osm_bus_stops_failed", lat=lat, lng=lng, error=str(e))
            return 0

    async def get_bus_stops(
        self, lat: float, lng: float, radius: int = 300
    ) -> list[dict]:
        """Get bus stop details within radius meters of a coordinate."""
        query = f"""
[out:json];
node["highway"="bus_stop"](around:{radius},{lat},{lng});
out body;
"""
        try:
            elements = await self._query(query)
            return [
                {
                    "id": el.get("id"),
                    "lat": el.get("lat"),
                    "lng": el.get("lon"),
                    "name": el.get("tags", {}).get("name", ""),
                }
                for el in elements
            ]
        except Exception as e:
            log.warning("osm_get_bus_stops_failed", lat=lat, lng=lng, error=str(e))
            return []

    async def find_nearby_metro(
        self, lat: float, lng: float, radius: int = 800
    ) -> list[dict]:
        """Find metro/subway stations within radius meters of a coordinate."""
        query = f"""
[out:json];
(
  node["station"="subway"](around:{radius},{lat},{lng});
  node["railway"="station"]["subway"="yes"](around:{radius},{lat},{lng});
);
out body;
"""
        try:
            elements = await self._query(query)
            stations = [
                {
                    "id": el.get("id"),
                    "lat": el.get("lat"),
                    "lng": el.get("lon"),
                    "name": el.get("tags", {}).get("name", ""),
                }
                for el in elements
            ]
            log.debug("osm_metro_nearby", lat=lat, lng=lng, radius=radius, count=len(stations))
            return stations
        except Exception as e:
            log.warning("osm_metro_failed", lat=lat, lng=lng, error=str(e))
            return []
