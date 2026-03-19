import structlog
from fastapi import APIRouter, HTTPException

from app.models.listing import (
    ScoredListingResponse,
    SearchRequest,
    SearchResponse,
    SearchSessionCreated,
    SearchSessionStatus,
)

log = structlog.get_logger()

router = APIRouter()


@router.post(
    "/search",
    response_model=SearchSessionCreated,
    status_code=202,
    summary="Start an async search for optimal commercial locations",
)
async def create_search(request: SearchRequest) -> SearchSessionCreated:
    """Create a search session and dispatch the LangGraph pipeline via Celery.

    Returns a session_id immediately. Poll GET /search/{session_id} for results.
    """
    from app.db.client import get_db
    from app.tasks.pipeline import run_pipeline_task

    db = await get_db()

    # Create search session in DB
    session_data = {
        "business_type": request.business_type.value,
        "district": request.district,
        "budget_tenge": request.budget_tenge,
        "area_sqm_min": request.area_sqm_min,
        "competitor_tolerance": request.competitor_tolerance,
        "status": "pending",
    }

    result = await db.table("search_sessions").insert(session_data).execute()
    session = result.data[0]
    session_id = session["id"]

    # Build initial pipeline state
    initial_state = {
        "search_id": session_id,
        "business_type": request.business_type.value,
        "business_name": request.business_name,
        "business_description": request.business_description,
        "city": "almaty",
        "district": request.district,
        "budget_tenge": request.budget_tenge,
        "area_sqm_min": request.area_sqm_min,
        "competitor_tolerance": request.competitor_tolerance,
        "weights_override": None,
        # Planner outputs (populated by planner_node)
        "search_query": None,
        "planner_reasoning": "",
        # Fetcher output
        "raw_listings": [],
        # Enrichment outputs
        "footfall_results": [],
        "competitor_results": [],
        "transit_results": [],
        # Scoring output
        "scored_listings": [],
        "top_listings": [],
        # Validator output
        "validation_results": [],
        # Explainer output
        "explanation": "",
        "errors": [],
    }

    # Dispatch Celery task
    run_pipeline_task.delay(session_id, initial_state)

    log.info("search_session_created", session_id=session_id, business_type=request.business_type.value)

    return SearchSessionCreated(session_id=session_id)


@router.get(
    "/search/{session_id}",
    response_model=SearchSessionStatus,
    status_code=200,
    summary="Poll search session status and results",
)
async def get_search_status(session_id: str) -> SearchSessionStatus:
    """Poll a search session. Returns results when status is 'complete'."""
    from app.db.client import get_db

    db = await get_db()

    # Fetch session
    session_result = (
        await db.table("search_sessions")
        .select("*")
        .eq("id", session_id)
        .execute()
    )

    if not session_result.data:
        raise HTTPException(
            status_code=404,
            detail={"code": "SEARCH_NOT_FOUND", "message": "Search session not found"},
        )

    session = session_result.data[0]

    # Fetch results if complete
    results: list[dict] = []
    if session["status"] == "complete":
        results_data = (
            await db.table("search_results")
            .select("*, listings(*)")
            .eq("session_id", session_id)
            .order("rank")
            .execute()
        )

        for row in results_data.data or []:
            listing = row.get("listings", {}) or {}
            results.append({
                "listing_id": row.get("listing_id", ""),
                "rank": row.get("rank", 0),
                "title": listing.get("title", ""),
                "address": listing.get("address", ""),
                "district": listing.get("district"),
                "price_tenge": listing.get("price_tenge"),
                "area_sqm": listing.get("area_sqm"),
                "url": listing.get("url", ""),
                "lat": listing.get("lat"),
                "lng": listing.get("lng"),
                "total_score": row.get("total_score", 0),
                "score_breakdown": row.get("score_breakdown", {}),
                "competitor_count": row.get("competitor_count", 0),
                "bus_stops_nearby": row.get("bus_stops_nearby", 0),
                "metro_distance_m": row.get("metro_distance_m"),
                "nearest_metro_name": row.get("nearest_metro_name"),
            })

    return SearchSessionStatus(
        session_id=session_id,
        status=session["status"],
        business_type=session["business_type"],
        district=session.get("district"),
        budget_tenge=session.get("budget_tenge"),
        total_evaluated=session.get("total_evaluated") or 0,
        explanation=session.get("explanation") or "",
        error_message=session.get("error_message"),
        results=results,
    )


@router.get(
    "/search/{session_id}/listing/{listing_id}",
    response_model=ScoredListingResponse,
    status_code=200,
    summary="Get full detail for one scored listing",
)
async def get_listing_detail(session_id: str, listing_id: str) -> ScoredListingResponse:
    """Get detailed scoring info for a single listing in a search session."""
    from app.db.client import get_db

    db = await get_db()

    result = (
        await db.table("search_results")
        .select("*, listings(*)")
        .eq("session_id", session_id)
        .eq("listing_id", listing_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail={"code": "RESULT_NOT_FOUND", "message": "Listing not found in this search session"},
        )

    row = result.data[0]
    listing = row.get("listings", {}) or {}

    return ScoredListingResponse(
        listing_id=row.get("listing_id", ""),
        rank=row.get("rank", 0),
        title=listing.get("title", ""),
        address=listing.get("address", ""),
        district=listing.get("district"),
        price_tenge=listing.get("price_tenge"),
        area_sqm=listing.get("area_sqm"),
        url=listing.get("url", ""),
        lat=listing.get("lat"),
        lng=listing.get("lng"),
        total_score=row.get("total_score", 0),
        score_breakdown=row.get("score_breakdown", {}),
        competitor_count=row.get("competitor_count", 0),
        bus_stops_nearby=row.get("bus_stops_nearby", 0),
        metro_distance_m=row.get("metro_distance_m"),
        nearest_metro_name=row.get("nearest_metro_name"),
    )
