"""Enrichment runner — iterates listings, calls 2GIS + OSM, writes to enriched_listings.

Usage: python -m scripts.run_enrichment
"""

import asyncio
import time

import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ],
)

log = structlog.get_logger()


async def enrich_listing(
    listing: dict,
    gis_client,
    osm_client,
) -> dict:
    """Enrich a single listing with competitor, transit, and footfall data."""
    from app.services.scoring import (
        DISTRICT_FOOTFALL,
        compute_competitor_score,
        compute_transit_score,
        nearest_metro_distance,
    )

    lat = listing["lat"]
    lng = listing["lng"]
    listing_id = listing["id"]
    business_type = listing.get("property_type", "retail")
    address = listing.get("address", "")
    district = listing.get("district")

    # 1. Competitor count via 2GIS
    competitor_count = await gis_client.count_competitors(lat, lng, business_type)

    # 2. Bus stops via OSM Overpass
    bus_stops = await osm_client.get_bus_stops(lat, lng, radius=300)
    bus_stop_count = len(bus_stops)

    # 3. Metro distance (computed from hardcoded station coords)
    metro_dist = nearest_metro_distance(lat, lng)

    # Find nearest metro station name
    nearest_metro_name = None
    if metro_dist is not None:
        from app.services.scoring import METRO_STATIONS, haversine_distance

        min_dist = float("inf")
        for station in METRO_STATIONS:
            d = haversine_distance(lat, lng, station["lat"], station["lng"])
            if d < min_dist:
                min_dist = d
                nearest_metro_name = station["name"]

    # 4. Footfall raw score — from district baseline
    footfall_raw = DISTRICT_FOOTFALL.get(district, 50) if district else 50

    # 5. Compute sub-scores
    transit_score = compute_transit_score(bus_stop_count, metro_dist, address)
    competitor_score = compute_competitor_score(competitor_count)

    return {
        "listing_id": listing_id,
        "footfall_raw": footfall_raw,
        "footfall_score": float(footfall_raw),  # will be normalized in batch later
        "competitor_count": competitor_count,
        "competitor_score": round(competitor_score, 2),
        "transit_score": round(transit_score, 2),
        "bus_stops_nearby": bus_stop_count,
        "metro_distance_m": round(metro_dist, 1) if metro_dist else None,
        "nearest_metro_name": nearest_metro_name,
        "transit_stops_nearby": bus_stops,
    }


async def main() -> None:
    from app.db.queries import (
        get_enriched_listings_count,
        get_unenriched_listings,
        upsert_enriched_listing,
    )
    from app.integrations.gis2 import TwoGISClient
    from app.integrations.osm import OSMClient

    log.info("enrichment_started")
    t0 = time.monotonic()

    listings = await get_unenriched_listings()
    log.info("unenriched_listings_found", count=len(listings))

    if not listings:
        log.info("no_listings_to_enrich")
        return

    enriched_count = 0
    errors = 0

    async with TwoGISClient() as gis_client, OSMClient() as osm_client:
        for i, listing in enumerate(listings):
            try:
                enrichment = await enrich_listing(listing, gis_client, osm_client)
                await upsert_enriched_listing(enrichment)
                enriched_count += 1
                log.debug(
                    "listing_enriched",
                    listing_id=listing["id"],
                    progress=f"{i + 1}/{len(listings)}",
                    competitor_count=enrichment["competitor_count"],
                    bus_stops=enrichment["bus_stops_nearby"],
                    transit_score=enrichment["transit_score"],
                )
            except Exception as e:
                errors += 1
                log.error(
                    "listing_enrichment_failed",
                    listing_id=listing["id"],
                    error=str(e),
                )

    duration_ms = round((time.monotonic() - t0) * 1000)
    total = await get_enriched_listings_count()

    log.info(
        "enrichment_complete",
        enriched=enriched_count,
        errors=errors,
        duration_ms=duration_ms,
        total_enriched_in_db=total,
    )


if __name__ == "__main__":
    asyncio.run(main())
