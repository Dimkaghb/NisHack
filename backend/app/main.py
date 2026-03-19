from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.config import settings

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB client, Redis pool. Shutdown: close connections."""
    log.info("app_starting")
    yield
    log.info("app_shutting_down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="LocationIQ API",
        description="AI-powered commercial real estate finder for Almaty",
        version="1.0.0",
        lifespan=lifespan,
    )

    @app.get("/api/v1/health", status_code=200)
    async def health() -> dict:
        return {"status": "ok"}

    # --- Dev/test endpoints (Phase 1 & 2) ---

    @app.post(
        "/api/v1/dev/scrape-krisha",
        status_code=200,
        tags=["dev"],
        summary="Run Krisha.kz scraper manually",
    )
    async def dev_scrape_krisha(max_pages_per_type: int = 2) -> dict:
        """Trigger a Krisha scrape. Use small max_pages_per_type for testing."""
        from app.db.queries import get_listings_count, upsert_listings_batch
        from app.models.listing import ListingUpsert
        from app.scrapers.krisha import KrishaScraper

        scraper = KrishaScraper()
        raw = await scraper.fetch_commercial_listings()

        valid: list[ListingUpsert] = []
        for r in raw:
            try:
                valid.append(ListingUpsert(**r))
            except Exception:
                pass

        upserted = 0
        if valid:
            upserted = await upsert_listings_batch(valid)

        total = await get_listings_count()
        return {
            "raw_fetched": len(raw),
            "valid": len(valid),
            "upserted": upserted,
            "total_in_db": total,
        }

    @app.get(
        "/api/v1/dev/listings",
        status_code=200,
        tags=["dev"],
        summary="Browse listings in DB",
    )
    async def dev_list_listings(limit: int = 20) -> dict:
        """View listings currently stored in the database."""
        from app.db.queries import get_all_listings, get_listings_count

        listings = await get_all_listings(limit=limit)
        total = await get_listings_count()
        return {
            "total": total,
            "showing": len(listings),
            "listings": listings,
        }

    @app.post(
        "/api/v1/dev/enrich",
        status_code=200,
        tags=["dev"],
        summary="Run enrichment on unenriched listings",
    )
    async def dev_enrich(limit: int = 10) -> dict:
        """Enrich listings with competitor count, bus stops, metro distance."""
        from app.db.queries import (
            get_enriched_listings_count,
            get_unenriched_listings,
            upsert_enriched_listing,
        )
        from app.integrations.gis2 import TwoGISClient
        from app.integrations.osm import OSMClient
        from scripts.run_enrichment import enrich_listing

        listings = await get_unenriched_listings(limit=limit)
        if not listings:
            total = await get_enriched_listings_count()
            return {"message": "No unenriched listings with coordinates", "total_enriched": total}

        enriched_count = 0
        errors = 0
        results: list[dict] = []

        async with TwoGISClient() as gis, OSMClient() as osm:
            for listing in listings:
                try:
                    data = await enrich_listing(listing, gis, osm)
                    await upsert_enriched_listing(data)
                    enriched_count += 1
                    results.append({
                        "listing_id": listing["id"],
                        "address": listing.get("address", ""),
                        "competitor_count": data["competitor_count"],
                        "bus_stops": data["bus_stops_nearby"],
                        "transit_score": data["transit_score"],
                        "metro_distance_m": data["metro_distance_m"],
                    })
                except Exception as e:
                    errors += 1
                    log.error("dev_enrich_failed", listing_id=listing["id"], error=str(e))

        total = await get_enriched_listings_count()
        return {
            "enriched": enriched_count,
            "errors": errors,
            "total_enriched_in_db": total,
            "results": results,
        }

    @app.get(
        "/api/v1/dev/enriched",
        status_code=200,
        tags=["dev"],
        summary="Browse enriched listings",
    )
    async def dev_list_enriched(limit: int = 20) -> dict:
        """View enriched listings with their scores."""
        from app.db.client import get_db

        db = await get_db()
        result = (
            await db.table("enriched_listings")
            .select("*, listings(*)")
            .limit(limit)
            .execute()
        )
        return {
            "showing": len(result.data or []),
            "enriched_listings": result.data or [],
        }

    return app


app = create_app()
