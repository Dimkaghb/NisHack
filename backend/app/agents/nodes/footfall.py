import time

import structlog

from app.agents.state import PipelineState
from app.services.scoring import DISTRICT_FOOTFALL

log = structlog.get_logger()


async def footfall_node(state: PipelineState) -> dict:
    """Compute footfall_raw for each listing based on district baseline.

    Uses the hardcoded DISTRICT_FOOTFALL dict as a proxy.
    Returns footfall_results: [{listing_id, footfall_raw}, ...]
    """
    t0 = time.monotonic()
    errors: list[str] = []
    results: list[dict] = []

    for listing in state["raw_listings"]:
        try:
            listing_id = listing.get("id")
            district = listing.get("district")
            footfall_raw = DISTRICT_FOOTFALL.get(district, 50) if district else 50

            results.append({
                "listing_id": listing_id,
                "footfall_raw": footfall_raw,
            })
        except Exception as e:
            errors.append(f"footfall_node: {listing.get('id')} — {e}")
            results.append({
                "listing_id": listing.get("id"),
                "footfall_raw": 50,  # neutral fallback
            })

    log.debug(
        "footfall_node_done",
        listings=len(results),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "footfall_results": results,
        "errors": errors,
    }
