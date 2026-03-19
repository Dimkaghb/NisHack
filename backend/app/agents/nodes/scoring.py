import time

import structlog

from app.agents.state import PipelineState
from app.services.scoring import score_listings

log = structlog.get_logger()

# Minimum total_score to be considered a quality result
QUALITY_THRESHOLD = 30.0


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

    Returns ALL scored listings (not just top 5).
    Filters out listings below the quality threshold.
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        merged = _merge_enrichments(state)

        # Use AI-refined competitor tolerance from search_query if available
        search_query = state.get("search_query") or {}
        cc = search_query.get("competitive_context", {})
        competitor_tolerance = cc.get("max_competitors_nearby") or state.get(
            "competitor_tolerance", 5
        )

        # Use AI-suggested weight adjustments if available
        scoring_hints = search_query.get("scoring_hints", {})
        weight_adjustments = scoring_hints.get("custom_weight_adjustments", {})
        weights_override = state.get("weights_override") or weight_adjustments or None

        scored = score_listings(
            merged,
            business_type=state["business_type"],
            budget_tenge=state.get("budget_tenge"),
            competitor_tolerance=competitor_tolerance,
            weights_override=weights_override,
        )

        # Filter out low-quality results
        quality_listings = [s for s in scored if s["total_score"] >= QUALITY_THRESHOLD]

        log.info(
            "scoring_quality_filter",
            total_scored=len(scored),
            above_threshold=len(quality_listings),
            threshold=QUALITY_THRESHOLD,
        )

        scored = quality_listings

    except Exception as e:
        errors.append(f"scoring_node: {e}")
        scored = []

    log.debug(
        "scoring_node_done",
        total_scored=len(scored),
        top_score=scored[0]["total_score"] if scored else 0,
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "scored_listings": scored,
        "errors": errors,
    }
