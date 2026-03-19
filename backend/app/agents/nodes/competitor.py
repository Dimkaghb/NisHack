import asyncio
import time

import structlog

from app.agents.state import PipelineState

log = structlog.get_logger()

# Max concurrent 2GIS API requests
_SEMAPHORE = asyncio.Semaphore(10)


async def competitor_node(state: PipelineState) -> dict:
    """Count competitors near each listing via 2GIS API.

    Runs API calls concurrently (up to 10 at a time) instead of sequentially.
    Uses planner's enrichment_hints for query_override and radius if available.
    Returns competitor_results: [{listing_id, competitor_count}, ...]
    """
    t0 = time.monotonic()
    errors: list[str] = []

    # Read competitive context from search query
    search_query = state.get("search_query") or {}
    cc = search_query.get("competitive_context", {})
    competitor_queries: list[str] = cc.get("competitor_search_queries", [])
    query_override: str | None = " ".join(competitor_queries) if competitor_queries else None
    radius = cc.get("competitor_radius_m") or 500

    from app.integrations.gis2 import TwoGISClient

    async def _fetch_one(
        client: TwoGISClient, listing: dict, business_type: str
    ) -> dict:
        listing_id = listing.get("id")
        lat = listing.get("lat")
        lng = listing.get("lng")

        if lat is None or lng is None:
            return {"listing_id": listing_id, "competitor_count": 0}

        async with _SEMAPHORE:
            try:
                if query_override:
                    # Use planner's custom query override
                    items = await client.search_nearby(lat, lng, query_override, radius)
                    count = len(items)
                    log.debug(
                        "competitor_query_override",
                        listing_id=listing_id,
                        query=query_override,
                        radius=radius,
                        count=count,
                    )
                else:
                    count = await client.count_competitors(lat, lng, business_type, radius)

                return {"listing_id": listing_id, "competitor_count": count}
            except Exception as e:
                errors.append(f"competitor_node: {listing_id} — {e}")
                return {"listing_id": listing_id, "competitor_count": 0}

    async with TwoGISClient() as client:
        tasks = [
            _fetch_one(client, listing, state["business_type"])
            for listing in state["raw_listings"]
        ]
        results = await asyncio.gather(*tasks)

    log.debug(
        "competitor_node_done",
        listings=len(results),
        query_override=bool(query_override),
        radius=radius,
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "competitor_results": list(results),
        "errors": errors,
    }
