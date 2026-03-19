import time

import structlog

from app.agents.state import PipelineState

log = structlog.get_logger()


async def competitor_node(state: PipelineState) -> dict:
    """Count competitors near each listing via 2GIS API.

    Returns competitor_results: [{listing_id, competitor_count}, ...]
    """
    t0 = time.monotonic()
    errors: list[str] = []
    results: list[dict] = []

    from app.integrations.gis2 import TwoGISClient

    async with TwoGISClient() as client:
        for listing in state["raw_listings"]:
            listing_id = listing.get("id")
            lat = listing.get("lat")
            lng = listing.get("lng")

            if lat is None or lng is None:
                results.append({"listing_id": listing_id, "competitor_count": 0})
                continue

            try:
                count = await client.count_competitors(
                    lat, lng, state["business_type"]
                )
                results.append({
                    "listing_id": listing_id,
                    "competitor_count": count,
                })
            except Exception as e:
                errors.append(f"competitor_node: {listing_id} — {e}")
                results.append({
                    "listing_id": listing_id,
                    "competitor_count": 0,
                })

    log.debug(
        "competitor_node_done",
        listings=len(results),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "competitor_results": results,
        "errors": errors,
    }
