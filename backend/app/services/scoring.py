import math

import structlog

log = structlog.get_logger()

# Weight matrix — hardcoded per business type
WEIGHTS: dict[str, dict[str, float]] = {
    "fastfood": {"footfall": 0.40, "competitor": 0.25, "transit": 0.10, "price": 0.20, "area": 0.05},
    "cafe": {"footfall": 0.40, "competitor": 0.25, "transit": 0.10, "price": 0.20, "area": 0.05},
    "office": {"footfall": 0.05, "competitor": 0.05, "transit": 0.50, "price": 0.30, "area": 0.10},
    "retail": {"footfall": 0.35, "competitor": 0.20, "transit": 0.15, "price": 0.20, "area": 0.10},
    "pharmacy": {"footfall": 0.30, "competitor": 0.20, "transit": 0.25, "price": 0.15, "area": 0.10},
}

# Almaty district footfall baseline (used when API data is unavailable)
DISTRICT_FOOTFALL: dict[str, int] = {
    "Almaly": 95,     # city center, Zhibek Zholy
    "Medeu": 80,      # Dostyk corridor, Mega mall
    "Bostandyk": 75,  # Rozybakiev, active residential+retail
    "Alatau": 60,
    "Auezov": 55,     # bazaars, local markets
    "Zhetysu": 50,
    "Turksib": 45,
    "Nauryzbai": 40,
}

# Almaty metro stations — Line 1 (11 stations including Bauyrzhan Momyshuly and Saryarka)
METRO_STATIONS: list[dict[str, float | str]] = [
    {"name": "Бауыржан Момышұлы", "lat": 43.216395, "lng": 76.837844},
    {"name": "Сарыарқа", "lat": 43.223685, "lng": 76.858251},
    {"name": "Мәскеу", "lat": 43.230485, "lng": 76.867304},
    {"name": "Сайран", "lat": 43.236621, "lng": 76.876879},
    {"name": "Алатау", "lat": 43.238453, "lng": 76.897551},
    {"name": "Әуезов театры", "lat": 43.240265, "lng": 76.917020},
    {"name": "Байқоңыр", "lat": 43.241238, "lng": 76.928819},
    {"name": "Абай", "lat": 43.242551, "lng": 76.948451},
    {"name": "Алмалы", "lat": 43.252037, "lng": 76.947095},
    {"name": "Жібек Жолы", "lat": 43.260500, "lng": 76.946031},
    {"name": "Райымбек батыр", "lat": 43.271107, "lng": 76.944661},
]

# Key transit corridors in Almaty — listings on these streets get +10 transit bonus
TRANSIT_CORRIDORS: list[str] = [
    "аль-фараби",
    "al-farabi",
    "достык",
    "dostyk",
    "сейфуллин",
    "seifullin",
    "розыбакиев",
    "rozybakiev",
]

# Ideal area (sqm) per business type — used for area fit scoring
IDEAL_AREA: dict[str, float] = {
    "fastfood": 80.0,
    "cafe": 100.0,
    "office": 150.0,
    "retail": 60.0,
    "pharmacy": 50.0,
}

# District median price (KZT/month) — fallback when user doesn't specify budget
DISTRICT_MEDIAN_PRICE: dict[str, int] = {
    "Almaly": 800_000,
    "Medeu": 700_000,
    "Bostandyk": 550_000,
    "Alatau": 400_000,
    "Auezov": 350_000,
    "Zhetysu": 300_000,
    "Turksib": 280_000,
    "Nauryzbai": 250_000,
}


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two coordinates using Haversine formula."""
    r = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_metro_distance(lat: float, lng: float) -> float | None:
    """Return distance in meters to the nearest metro station, or None if no coords."""
    if lat is None or lng is None:
        return None
    distances = [
        haversine_distance(lat, lng, s["lat"], s["lng"])
        for s in METRO_STATIONS
    ]
    return min(distances) if distances else None


def is_on_transit_corridor(address: str) -> bool:
    """Check if an address is on a key Almaty transit corridor."""
    addr_lower = address.lower()
    return any(corridor in addr_lower for corridor in TRANSIT_CORRIDORS)


def compute_transit_score(
    bus_stop_count: int,
    metro_distance_m: float | None,
    address: str = "",
) -> float:
    """Compute transit score 0–100.

    - Bus stops within 300m: capped at 10, mapped to 0–100
    - Metro within 800m: +15 flat bonus
    - Transit corridor: +10 flat bonus
    - Capped at 100
    """
    capped_stops = min(bus_stop_count, 10)
    score = (capped_stops / 10) * 100

    if metro_distance_m is not None and metro_distance_m <= 800:
        score += 15

    if is_on_transit_corridor(address):
        score += 10

    return min(score, 100.0)


def compute_competitor_score(competitor_count: int, tolerance: int = 5) -> float:
    """Inverted sigmoid: 0 competitors → 100, tolerance → 50, 2×tolerance → ~0."""
    if tolerance <= 0:
        tolerance = 1
    # Sigmoid centered at tolerance, steepness = 4/tolerance
    k = 4.0 / tolerance
    return 100.0 / (1.0 + math.exp(k * (competitor_count - tolerance)))


def compute_price_score(
    price_tenge: int | None,
    budget_tenge: int | None,
    district: str | None = None,
) -> float:
    """Price efficiency: (budget - ask) / budget × 100, clamped 0–100."""
    if price_tenge is None:
        return 50.0  # neutral if unknown

    budget = budget_tenge
    if budget is None and district:
        budget = DISTRICT_MEDIAN_PRICE.get(district)
    if budget is None:
        budget = 500_000  # fallback

    if budget <= 0:
        return 50.0

    efficiency = (budget - price_tenge) / budget * 100
    return max(0.0, min(100.0, efficiency))


def compute_area_score(area_sqm: float | None, business_type: str) -> float:
    """Penalty for deviation from ideal area, normalized to 0–100."""
    if area_sqm is None:
        return 50.0

    ideal = IDEAL_AREA.get(business_type, 100.0)
    if ideal <= 0:
        return 50.0

    deviation_ratio = abs(area_sqm - ideal) / ideal
    # Score decreases linearly: 0% deviation = 100, 100% deviation = 0
    score = max(0.0, 100.0 * (1.0 - deviation_ratio))
    return score


def normalize_footfall_batch(listings: list[dict]) -> list[dict]:
    """Min-max normalize footfall scores across a batch of listings."""
    scores = [l.get("footfall_raw", 0) for l in listings]
    min_s = min(scores) if scores else 0
    max_s = max(scores) if scores else 0
    spread = max_s - min_s

    for listing in listings:
        raw = listing.get("footfall_raw", 0)
        if spread > 0:
            listing["footfall_score"] = ((raw - min_s) / spread) * 100
        else:
            listing["footfall_score"] = 50.0  # all same → neutral

    return listings


def compute_total_score(
    listing: dict,
    business_type: str,
    weights_override: dict | None = None,
) -> dict:
    """Compute weighted total score for a listing. Returns score_breakdown + total."""
    weights = weights_override or WEIGHTS.get(business_type, WEIGHTS["retail"])

    breakdown = {
        "footfall": listing.get("footfall_score", 50.0),
        "competitor": listing.get("competitor_score", 50.0),
        "transit": listing.get("transit_score", 50.0),
        "price": listing.get("price_score", 50.0),
        "area": listing.get("area_score", 50.0),
    }

    total = sum(breakdown[k] * weights.get(k, 0) for k in breakdown)

    return {
        "total_score": round(total, 2),
        "score_breakdown": {k: round(v, 2) for k, v in breakdown.items()},
        "weights_used": weights,
    }


def score_listings(
    listings_with_enrichment: list[dict],
    business_type: str,
    budget_tenge: int | None = None,
    competitor_tolerance: int = 5,
    weights_override: dict | None = None,
    top_n: int = 5,
) -> list[dict]:
    """Score and rank a batch of enriched listings for a given business type.

    Takes joined listing+enrichment data, computes all sub-scores,
    normalizes footfall across the batch, and returns top_n ranked results.

    Each input dict should have listing fields (price_tenge, area_sqm, district, address)
    plus enrichment fields (footfall_raw, competitor_count, bus_stops_nearby, metro_distance_m).
    """
    if not listings_with_enrichment:
        return []

    # 1. Compute individual sub-scores for each listing
    for item in listings_with_enrichment:
        item["competitor_score"] = compute_competitor_score(
            item.get("competitor_count", 0),
            tolerance=competitor_tolerance,
        )
        item["transit_score"] = compute_transit_score(
            item.get("bus_stops_nearby", 0),
            item.get("metro_distance_m"),
            item.get("address", ""),
        )
        item["price_score"] = compute_price_score(
            item.get("price_tenge"),
            budget_tenge,
            item.get("district"),
        )
        item["area_score"] = compute_area_score(
            item.get("area_sqm"),
            business_type,
        )

    # 2. Normalize footfall across the batch (min-max)
    normalize_footfall_batch(listings_with_enrichment)

    # 3. Compute weighted total score
    scored: list[dict] = []
    for item in listings_with_enrichment:
        result = compute_total_score(item, business_type, weights_override)
        scored.append({
            "listing_id": item.get("id") or item.get("listing_id"),
            "title": item.get("title", ""),
            "address": item.get("address", ""),
            "district": item.get("district"),
            "price_tenge": item.get("price_tenge"),
            "area_sqm": item.get("area_sqm"),
            "url": item.get("url", ""),
            "lat": item.get("lat"),
            "lng": item.get("lng"),
            "total_score": result["total_score"],
            "score_breakdown": result["score_breakdown"],
            "weights_used": result["weights_used"],
            "competitor_count": item.get("competitor_count", 0),
            "bus_stops_nearby": item.get("bus_stops_nearby", 0),
            "metro_distance_m": item.get("metro_distance_m"),
            "nearest_metro_name": item.get("nearest_metro_name"),
        })

    # 4. Sort by total_score descending
    scored.sort(key=lambda x: x["total_score"], reverse=True)

    for rank, item in enumerate(scored, 1):
        item["rank"] = rank

    log.info(
        "listings_scored",
        business_type=business_type,
        total=len(scored),
        top_score=scored[0]["total_score"] if scored else 0,
    )

    # Return top_n if specified, otherwise all scored listings
    if top_n and top_n < len(scored):
        return scored[:top_n]
    return scored
