import re
import time

import structlog

from app.agents.state import PipelineState

log = structlog.get_logger()

# Pattern to extract area from title like "· 106 м²"
_AREA_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*м²")

# Pattern to extract floor number from title/description like "4 этаж", "4-й этаж"
_FLOOR_RE = re.compile(r"(\d+)[\s-]*й?\s*этаж", re.IGNORECASE)


def _parse_area_from_title(title: str | None) -> float | None:
    """Extract area in sqm from listing title if not already set."""
    if not title:
        return None
    m = _AREA_RE.search(title)
    if m:
        return float(m.group(1).replace(",", "."))
    return None


def _parse_floor_from_text(title: str | None, description: str | None) -> int | None:
    """Extract floor number from listing title or description."""
    for text in (title, description):
        if not text:
            continue
        m = _FLOOR_RE.search(text)
        if m:
            return int(m.group(1))
    return None


def _apply_plan_filters(listings: list[dict], search_plan: dict) -> list[dict]:
    """Apply SearchPlan property_filters to raw listings.

    Filters are intentionally lenient: listings with missing data are kept
    (they'll score poorly rather than being silently excluded).
    """
    pf = search_plan.get("property_filters", {})
    exclude_types: list[str] = [t.lower() for t in (pf.get("exclude_types") or [])]
    prefer_floor: str | None = pf.get("prefer_floor")
    area_range: list[int] | None = pf.get("area_range")

    filtered: list[dict] = []
    for listing in listings:
        # --- Property type exclusion (hard filter) ---
        prop_type = (listing.get("property_type") or "").lower()
        title_lower = (listing.get("title") or "").lower()

        if exclude_types and prop_type:
            if any(ex in prop_type for ex in exclude_types):
                log.debug(
                    "fetcher_excluded_type",
                    listing_id=listing.get("id"),
                    property_type=prop_type,
                )
                continue

        # --- Floor filter (hard filter for prefer_floor='ground') ---
        if prefer_floor == "ground":
            floor = listing.get("floor") or _parse_floor_from_text(
                listing.get("title"), listing.get("description")
            )
            if floor is not None and floor > 1:
                # Check if title suggests ground floor explicitly
                if "1 этаж" not in title_lower and "первый этаж" not in title_lower:
                    log.debug(
                        "fetcher_excluded_floor",
                        listing_id=listing.get("id"),
                        floor=floor,
                    )
                    continue
        elif prefer_floor == "low":
            floor = listing.get("floor") or _parse_floor_from_text(
                listing.get("title"), listing.get("description")
            )
            if floor is not None and floor > 3:
                log.debug(
                    "fetcher_excluded_floor_low",
                    listing_id=listing.get("id"),
                    floor=floor,
                )
                continue

        # --- Area range filter (soft: keep if area unknown) ---
        if area_range and len(area_range) == 2:
            area = listing.get("area_sqm")
            if area is not None:
                if area < area_range[0] * 0.5 or area > area_range[1] * 2.0:
                    # Only exclude if severely outside range (2× tolerance)
                    log.debug(
                        "fetcher_excluded_area",
                        listing_id=listing.get("id"),
                        area=area,
                        range=area_range,
                    )
                    continue

        filtered.append(listing)

    return filtered


async def fetcher_node(state: PipelineState) -> dict:
    """Fetch listings from the DB that match the search criteria.

    Reads from the `listings` table (already populated by the scraper).
    Applies SearchPlan filters if a planner ran before this node.
    Returns raw_listings for downstream enrichment nodes.
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        from app.db.client import get_db

        db = await get_db()
        query = db.table("listings").select("*")

        if state.get("district"):
            query = query.eq("district", state["district"])

        # Budget is a soft preference handled by scoring — not a hard filter.
        result = await query.limit(200).execute()
        raw_listings = result.data or []

        # Post-process: parse area_sqm from title if missing
        for listing in raw_listings:
            if listing.get("area_sqm") is None:
                listing["area_sqm"] = _parse_area_from_title(listing.get("title"))

        # User-specified area minimum (soft — keep listings with no area data)
        area_min = state.get("area_sqm_min")
        if area_min:
            raw_listings = [
                lst for lst in raw_listings
                if lst.get("area_sqm") is None or lst["area_sqm"] >= area_min
            ]

        # Apply SearchPlan filters from planner node
        search_plan = state.get("search_plan")
        before_plan = len(raw_listings)
        if search_plan:
            raw_listings = _apply_plan_filters(raw_listings, search_plan)
            log.debug(
                "fetcher_plan_filters_applied",
                before=before_plan,
                after=len(raw_listings),
                excluded=before_plan - len(raw_listings),
            )

        # Cap at 50 for enrichment speed
        raw_listings = raw_listings[:50]

    except Exception as e:
        errors.append(f"fetcher_node: DB query failed — {e}")
        raw_listings = []

    log.debug(
        "fetcher_node_done",
        listings=len(raw_listings),
        district=state.get("district"),
        has_plan=bool(state.get("search_plan")),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "raw_listings": raw_listings,
        "errors": errors,
    }
