import asyncio
import time

import structlog

from app.agents.state import PipelineState
from app.services.scoring import DISTRICT_FOOTFALL

log = structlog.get_logger()

# Max concurrent 2GIS requests for POI density
_SEMAPHORE = asyncio.Semaphore(5)

# Default anchor POI queries when no planner hints provided
_DEFAULT_ANCHOR_POIS = ["парк", "торговый центр", "университет", "школа"]

# Radius for anchor POI density search
_ANCHOR_RADIUS = 300


async def _count_anchor_pois(
    client: object,
    lat: float,
    lng: float,
    anchor_pois: list[str],
) -> int:
    """Count anchor POIs near a location using 2GIS search.

    Searches for each anchor POI type and returns total distinct count.
    """
    total = 0
    seen_ids: set[str] = set()

    for poi_query in anchor_pois[:4]:  # cap at 4 queries per listing
        async with _SEMAPHORE:
            try:
                items = await client.search_nearby(lat, lng, poi_query, _ANCHOR_RADIUS)
                for item in items:
                    item_id = str(item.get("id", "")) or str(item.get("address_name", ""))
                    if item_id and item_id not in seen_ids:
                        seen_ids.add(item_id)
                        total += 1
            except Exception as e:
                log.warning("footfall_poi_search_failed", query=poi_query, error=str(e))

    return total


async def footfall_node(state: PipelineState) -> dict:
    """Compute footfall_raw for each listing.

    Strategy:
    - District baseline (from DISTRICT_FOOTFALL) accounts for 40% of score
    - Anchor POI density within 300m accounts for 60% of score
    - Falls back to district-only when 2GIS unavailable

    Returns footfall_results: [{listing_id, footfall_raw}, ...]
    """
    t0 = time.monotonic()
    errors: list[str] = []
    results: list[dict] = []

    # Read anchor POI hints from planner
    search_plan = state.get("search_plan") or {}
    hints = search_plan.get("enrichment_hints", {})
    anchor_pois: list[str] = hints.get("footfall_anchor_pois") or _DEFAULT_ANCHOR_POIS

    # Separate listings with/without coordinates
    with_coords = [
        lst for lst in state["raw_listings"]
        if lst.get("lat") is not None and lst.get("lng") is not None
    ]
    without_coords = [
        lst for lst in state["raw_listings"]
        if lst.get("lat") is None or lst.get("lng") is None
    ]

    # Listings without coords: use district baseline only
    for listing in without_coords:
        district = listing.get("district")
        footfall_raw = DISTRICT_FOOTFALL.get(district, 50) if district else 50
        results.append({"listing_id": listing.get("id"), "footfall_raw": footfall_raw})

    # Listings with coords: try 2GIS anchor POI density
    if with_coords:
        try:
            from app.integrations.gis2 import TwoGISClient

            async with TwoGISClient() as client:
                async def _compute_one(listing: dict) -> dict:
                    listing_id = listing.get("id")
                    lat = listing["lat"]
                    lng = listing["lng"]
                    district = listing.get("district")

                    district_baseline = DISTRICT_FOOTFALL.get(district, 50) if district else 50

                    try:
                        poi_count = await _count_anchor_pois(client, lat, lng, anchor_pois)
                        # Normalize POI count: 0 POIs → 0, 5+ POIs → 100
                        poi_score = min(poi_count / 5.0, 1.0) * 100
                        # Blend: 40% district baseline + 60% POI density
                        footfall_raw = district_baseline * 0.4 + poi_score * 0.6
                    except Exception as e:
                        errors.append(f"footfall_node: poi density failed for {listing_id} — {e}")
                        footfall_raw = float(district_baseline)

                    return {"listing_id": listing_id, "footfall_raw": round(footfall_raw, 1)}

                tasks = [_compute_one(lst) for lst in with_coords]
                poi_results = await asyncio.gather(*tasks)
                results.extend(poi_results)

        except Exception as e:
            # 2GIS unavailable — fall back to district-only for all with-coord listings
            errors.append(f"footfall_node: 2GIS unavailable — {e}")
            for listing in with_coords:
                district = listing.get("district")
                footfall_raw = DISTRICT_FOOTFALL.get(district, 50) if district else 50
                results.append({"listing_id": listing.get("id"), "footfall_raw": footfall_raw})

    log.debug(
        "footfall_node_done",
        listings=len(results),
        with_coords=len(with_coords),
        without_coords=len(without_coords),
        anchor_pois=anchor_pois,
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "footfall_results": results,
        "errors": errors,
    }
