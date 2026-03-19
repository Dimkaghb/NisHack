import time

import structlog

from app.agents.state import PipelineState
from app.services.scoring import score_listings

log = structlog.get_logger()


def _merge_enrichments(state: PipelineState) -> list[dict]:
    """Merge raw listings with all enrichment results by listing_id."""
    # Index enrichment results by listing_id for O(1) lookups
    footfall_map: dict[str, dict] = {
        r["listing_id"]: r for r in state.get("footfall_results", [])
    }
    competitor_map: dict[str, dict] = {
        r["listing_id"]: r for r in state.get("competitor_results", [])
    }
    transit_map: dict[str, dict] = {
        r["listing_id"]: r for r in state.get("transit_results", [])
    }

    merged: list[dict] = []
    for listing in state["raw_listings"]:
        lid = listing.get("id")
        ff = footfall_map.get(lid, {})
        comp = competitor_map.get(lid, {})
        tr = transit_map.get(lid, {})

        merged.append({
            **listing,
            "footfall_raw": ff.get("footfall_raw", 50),
            "competitor_count": comp.get("competitor_count", 0),
            "bus_stops_nearby": tr.get("bus_stops_nearby", 0),
            "metro_distance_m": tr.get("metro_distance_m"),
            "nearest_metro_name": tr.get("nearest_metro_name"),
        })

    return merged


async def scoring_node(state: PipelineState) -> dict:
    """Merge enrichment results and compute weighted scores.

    Returns scored_listings (all) and top_listings (top 5).
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        merged = _merge_enrichments(state)

        scored = score_listings(
            merged,
            business_type=state["business_type"],
            budget_tenge=state.get("budget_tenge"),
            competitor_tolerance=state.get("competitor_tolerance", 5),
            weights_override=state.get("weights_override"),
            top_n=len(merged),  # score all, slice later
        )

        top = scored[:5]

    except Exception as e:
        errors.append(f"scoring_node: {e}")
        scored = []
        top = []

    log.debug(
        "scoring_node_done",
        total_scored=len(scored),
        top=len(top),
        top_score=top[0]["total_score"] if top else 0,
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "scored_listings": scored,
        "top_listings": top,
        "errors": errors,
    }
