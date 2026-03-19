import asyncio

import structlog

from app.config import settings
from app.tasks.scraping import celery

log = structlog.get_logger()


async def _run_pipeline(search_id: str, initial_state: dict) -> None:
    """Run the LangGraph pipeline and persist results to the DB."""
    from app.agents.graph import pipeline
    from app.db.client import get_db

    db = await get_db()

    # Mark session as running
    await (
        db.table("search_sessions")
        .update({"status": "running"})
        .eq("id", search_id)
        .execute()
    )

    try:
        # Run the full pipeline
        result = await pipeline.ainvoke(initial_state)

        top_listings = result.get("top_listings", [])
        explanation = result.get("explanation", "")
        errors = result.get("errors", [])
        scored_listings = result.get("scored_listings", [])

        # Persist search results
        if top_listings:
            rows = []
            for item in top_listings:
                listing_id = item.get("listing_id")
                if not listing_id:
                    continue
                rows.append({
                    "session_id": search_id,
                    "listing_id": listing_id,
                    "rank": item.get("rank", 0),
                    "total_score": item.get("total_score", 0),
                    "score_breakdown": item.get("score_breakdown", {}),
                    "competitor_count": item.get("competitor_count", 0),
                    "bus_stops_nearby": item.get("bus_stops_nearby", 0),
                    "metro_distance_m": item.get("metro_distance_m"),
                    "nearest_metro_name": item.get("nearest_metro_name"),
                })

            if rows:
                await db.table("search_results").insert(rows).execute()

        # Mark session as complete
        await (
            db.table("search_sessions")
            .update({
                "status": "complete",
                "explanation": explanation,
                "total_evaluated": len(scored_listings),
                "error_message": "; ".join(errors) if errors else None,
            })
            .eq("id", search_id)
            .execute()
        )

        log.info(
            "pipeline_complete",
            search_id=search_id,
            top_listings=len(top_listings),
            total_scored=len(scored_listings),
            errors=len(errors),
        )

    except Exception as e:
        log.error("pipeline_failed", search_id=search_id, error=str(e))
        await (
            db.table("search_sessions")
            .update({
                "status": "failed",
                "error_message": str(e),
            })
            .eq("id", search_id)
            .execute()
        )
        raise


@celery.task(bind=True, max_retries=2)
def run_pipeline_task(self, search_id: str, initial_state: dict) -> None:
    """Celery task: run the full LangGraph search pipeline."""
    log.info("pipeline_task_started", search_id=search_id)
    try:
        asyncio.run(_run_pipeline(search_id, initial_state))
    except Exception as exc:
        log.error("pipeline_task_failed", search_id=search_id, error=str(exc))
        raise self.retry(exc=exc, countdown=5)
