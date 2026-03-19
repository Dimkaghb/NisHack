"""Tests for the scoring engine — all pure logic, no external calls."""

import math

import pytest

from app.services.scoring import (
    WEIGHTS,
    compute_area_score,
    compute_competitor_score,
    compute_price_score,
    compute_total_score,
    compute_transit_score,
    haversine_distance,
    is_on_transit_corridor,
    nearest_metro_distance,
    normalize_footfall_batch,
    score_listings,
)


# --- compute_competitor_score ---


def test_zero_competitors_gives_max_score() -> None:
    score = compute_competitor_score(0, tolerance=5)
    assert score > 95  # very close to 100


def test_tolerance_competitors_gives_about_50() -> None:
    score = compute_competitor_score(5, tolerance=5)
    assert 45 < score < 55


def test_double_tolerance_gives_near_zero() -> None:
    score = compute_competitor_score(10, tolerance=5)
    assert score < 10


def test_competitor_score_custom_tolerance() -> None:
    score_low = compute_competitor_score(3, tolerance=10)
    score_high = compute_competitor_score(3, tolerance=3)
    assert score_low > score_high  # more tolerant = higher score at same count


# --- compute_transit_score ---


def test_transit_max_bus_stops() -> None:
    score = compute_transit_score(10, metro_distance_m=None, address="")
    assert score == 100.0


def test_transit_with_metro_bonus() -> None:
    score = compute_transit_score(5, metro_distance_m=500, address="")
    # 5 stops = 50, metro within 800m = +15 → 65
    assert score == 65.0


def test_transit_with_corridor_bonus() -> None:
    score = compute_transit_score(5, metro_distance_m=None, address="ул. Достык 5")
    # 5 stops = 50, corridor bonus = +10 → 60
    assert score == 60.0


def test_transit_capped_at_100() -> None:
    # 10 stops (100) + metro (15) + corridor (10) = 125 → capped at 100
    score = compute_transit_score(10, metro_distance_m=200, address="ул. Достык 5")
    assert score == 100.0


def test_transit_metro_too_far_no_bonus() -> None:
    score = compute_transit_score(5, metro_distance_m=1500, address="")
    assert score == 50.0  # no metro bonus


# --- compute_price_score ---


def test_price_under_budget() -> None:
    score = compute_price_score(300_000, budget_tenge=500_000)
    assert score == 40.0  # (500k - 300k) / 500k * 100 = 40


def test_price_at_budget() -> None:
    score = compute_price_score(500_000, budget_tenge=500_000)
    assert score == 0.0  # no savings


def test_price_over_budget_clamped() -> None:
    score = compute_price_score(700_000, budget_tenge=500_000)
    assert score == 0.0  # clamped


def test_price_no_budget_uses_district_median() -> None:
    # Almaly median = 800_000, price = 400_000 → (800k - 400k) / 800k * 100 = 50
    score = compute_price_score(400_000, budget_tenge=None, district="Almaly")
    assert score == 50.0


def test_price_unknown_returns_neutral() -> None:
    score = compute_price_score(None, budget_tenge=500_000)
    assert score == 50.0


# --- compute_area_score ---


def test_area_perfect_fit() -> None:
    score = compute_area_score(80.0, "fastfood")  # ideal = 80
    assert score == 100.0


def test_area_double_ideal() -> None:
    score = compute_area_score(160.0, "fastfood")  # 100% deviation
    assert score == 0.0


def test_area_half_ideal() -> None:
    score = compute_area_score(40.0, "fastfood")  # 50% deviation
    assert score == 50.0


def test_area_unknown_returns_neutral() -> None:
    score = compute_area_score(None, "fastfood")
    assert score == 50.0


# --- normalize_footfall_batch ---


def test_footfall_normalization_spread() -> None:
    listings = [
        {"footfall_raw": 40},
        {"footfall_raw": 95},
        {"footfall_raw": 60},
    ]
    result = normalize_footfall_batch(listings)
    assert result[0]["footfall_score"] == 0.0     # min
    assert result[1]["footfall_score"] == 100.0   # max
    # middle: (60-40)/(95-40)*100 ≈ 36.36
    assert 36 < result[2]["footfall_score"] < 37


def test_footfall_normalization_all_same() -> None:
    listings = [{"footfall_raw": 50}, {"footfall_raw": 50}]
    result = normalize_footfall_batch(listings)
    assert result[0]["footfall_score"] == 50.0
    assert result[1]["footfall_score"] == 50.0


# --- compute_total_score ---


def test_fastfood_footfall_dominant() -> None:
    listing = {
        "footfall_score": 90,
        "competitor_score": 20,
        "transit_score": 50,
        "price_score": 70,
        "area_score": 60,
    }
    result = compute_total_score(listing, "fastfood")
    # footfall 40% of 90 = 36, should dominate
    assert result["total_score"] > 55
    assert result["score_breakdown"]["footfall"] == 90


def test_office_transit_dominant() -> None:
    listing = {
        "footfall_score": 20,
        "competitor_score": 20,
        "transit_score": 95,
        "price_score": 50,
        "area_score": 50,
    }
    result = compute_total_score(listing, "office")
    # transit 50% of 95 = 47.5, should dominate
    assert result["total_score"] > 55


def test_weights_override() -> None:
    listing = {
        "footfall_score": 100,
        "competitor_score": 0,
        "transit_score": 0,
        "price_score": 0,
        "area_score": 0,
    }
    custom = {"footfall": 1.0, "competitor": 0, "transit": 0, "price": 0, "area": 0}
    result = compute_total_score(listing, "office", weights_override=custom)
    assert result["total_score"] == 100.0


# --- score_listings (integration) ---


def test_score_listings_ranks_correctly() -> None:
    listings = [
        {
            "id": "a",
            "title": "Bad location",
            "address": "",
            "district": "Nauryzbai",
            "price_tenge": 500_000,
            "area_sqm": 200.0,
            "url": "",
            "footfall_raw": 40,
            "competitor_count": 10,
            "bus_stops_nearby": 1,
            "metro_distance_m": 5000.0,
        },
        {
            "id": "b",
            "title": "Great location",
            "address": "ул. Достык 5",
            "district": "Almaly",
            "price_tenge": 200_000,
            "area_sqm": 85.0,
            "url": "",
            "footfall_raw": 95,
            "competitor_count": 1,
            "bus_stops_nearby": 8,
            "metro_distance_m": 300.0,
        },
    ]
    result = score_listings(listings, "fastfood", budget_tenge=500_000, top_n=5)
    assert len(result) == 2
    assert result[0]["listing_id"] == "b"  # great location ranked first
    assert result[0]["rank"] == 1
    assert result[1]["listing_id"] == "a"
    assert result[0]["total_score"] > result[1]["total_score"]


def test_score_listings_empty() -> None:
    result = score_listings([], "fastfood")
    assert result == []


def test_score_listings_top_n() -> None:
    listings = [
        {
            "id": str(i),
            "title": f"Listing {i}",
            "address": "",
            "district": "Almaly",
            "price_tenge": 300_000,
            "area_sqm": 80.0,
            "url": "",
            "footfall_raw": 50 + i * 5,
            "competitor_count": i,
            "bus_stops_nearby": 5,
            "metro_distance_m": 1000.0,
        }
        for i in range(10)
    ]
    result = score_listings(listings, "fastfood", budget_tenge=500_000, top_n=3)
    assert len(result) == 3
    assert result[0]["rank"] == 1


# --- haversine / metro helpers ---


def test_haversine_same_point() -> None:
    assert haversine_distance(43.25, 76.95, 43.25, 76.95) == 0.0


def test_haversine_known_distance() -> None:
    # Almaly station to Zhibek Zholy ≈ ~950m
    dist = haversine_distance(43.252037, 76.947095, 43.260500, 76.946031)
    assert 900 < dist < 1100


def test_nearest_metro_in_center() -> None:
    # Near Almaly station
    dist = nearest_metro_distance(43.252, 76.947)
    assert dist is not None
    assert dist < 200  # should be very close


def test_transit_corridor_detection() -> None:
    assert is_on_transit_corridor("пр. Достык 120") is True
    assert is_on_transit_corridor("ул. Абая 50") is False
    assert is_on_transit_corridor("Al-Farabi Ave 100") is True
