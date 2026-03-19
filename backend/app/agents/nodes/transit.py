import time

import structlog

from app.agents.state import PipelineState
from app.services.scoring import nearest_metro_distance

log = structlog.get_logger()


async def transit_node(state: PipelineState) -> dict:
    """Count bus stops and compute metro proximity for each listing via OSM.

    Returns transit_results: [{listing_id, bus_stops_nearby, metro_distance_m,
                               nearest_metro_name}, ...]
    """
    t0 = time.monotonic()
    errors: list[str] = []
    results: list[dict] = []

    from app.integrations.osm import OSMClient
    from app.services.scoring import METRO_STATIONS, haversine_distance

    async with OSMClient() as client:
        for listing in state["raw_listings"]:
            listing_id = listing.get("id")
            lat = listing.get("lat")
            lng = listing.get("lng")

            if lat is None or lng is None:
                results.append({
                    "listing_id": listing_id,
                    "bus_stops_nearby": 0,
                    "metro_distance_m": None,
                    "nearest_metro_name": None,
                })
                continue

            try:
                bus_stop_count = await client.count_bus_stops(lat, lng, radius=300)

                metro_dist = nearest_metro_distance(lat, lng)
                nearest_name = None
                if metro_dist is not None:
                    min_dist = float("inf")
                    for station in METRO_STATIONS:
                        d = haversine_distance(lat, lng, station["lat"], station["lng"])
                        if d < min_dist:
                            min_dist = d
                            nearest_name = station["name"]

                results.append({
                    "listing_id": listing_id,
                    "bus_stops_nearby": bus_stop_count,
                    "metro_distance_m": round(metro_dist, 1) if metro_dist else None,
                    "nearest_metro_name": nearest_name,
                })
            except Exception as e:
                errors.append(f"transit_node: {listing_id} — {e}")
                results.append({
                    "listing_id": listing_id,
                    "bus_stops_nearby": 0,
                    "metro_distance_m": None,
                    "nearest_metro_name": None,
                })

    log.debug(
        "transit_node_done",
        listings=len(results),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "transit_results": results,
        "errors": errors,
    }
