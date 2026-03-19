import time

import structlog

from app.agents.state import PipelineState

log = structlog.get_logger()


async def fetcher_node(state: PipelineState) -> dict:
    """Fetch listings from the DB that match the search criteria.

    Reads from the `listings` table (already populated by the scraper).
    Returns raw_listings for downstream enrichment nodes.
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        from app.db.client import get_db

        db = await get_db()
        query = (
            db.table("listings")
            .select("*")
            .not_.is_("lat", "null")
            .not_.is_("lng", "null")
        )

        if state.get("district"):
            query = query.eq("district", state["district"])

        if state.get("area_sqm_min"):
            query = query.gte("area_sqm", state["area_sqm_min"])

        result = await query.limit(500).execute()
        raw_listings = result.data or []

    except Exception as e:
        errors.append(f"fetcher_node: DB query failed — {e}")
        raw_listings = []

    log.debug(
        "fetcher_node_done",
        listings=len(raw_listings),
        district=state.get("district"),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "raw_listings": raw_listings,
        "errors": errors,
    }
