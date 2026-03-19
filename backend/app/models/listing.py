from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Listing(BaseModel):
    """Raw listing as stored in the listings table."""

    id: str | None = None
    source: str  # "krisha" | "olx"
    external_id: str
    title: str
    address: str
    district: str | None = None
    lat: float | None = None
    lng: float | None = None
    price_tenge: int | None = None
    price_per_sqm: int | None = None
    area_sqm: float | None = None
    property_type: str | None = None  # "office" | "retail" | "cafe" | "pharmacy" | "free"
    description: str | None = None
    url: str
    photo_urls: list[str] = []
    raw_data: dict = {}
    scraped_at: datetime | None = None

    model_config = {"str_strip_whitespace": True}


class ListingUpsert(BaseModel):
    """Data shape for upserting a listing into Supabase."""

    source: str
    external_id: str
    title: str
    address: str
    district: str | None = None
    lat: float | None = None
    lng: float | None = None
    price_tenge: int | None = None
    price_per_sqm: int | None = None
    area_sqm: float | None = None
    property_type: str | None = None
    description: str | None = None
    url: str
    photo_urls: list[str] = []
    raw_data: dict = {}

    model_config = {"str_strip_whitespace": True}


class BusinessType(str, Enum):
    fastfood = "fastfood"
    cafe = "cafe"
    office = "office"
    retail = "retail"
    pharmacy = "pharmacy"


class SearchRequest(BaseModel):
    """Request body for POST /api/v1/search."""

    business_type: BusinessType
    district: str | None = None
    budget_tenge: int | None = Field(None, gt=0)
    area_sqm_min: int | None = Field(None, gt=0)
    competitor_tolerance: int = Field(5, ge=0, le=10)

    model_config = {"str_strip_whitespace": True}


class ScoreBreakdown(BaseModel):
    footfall: float
    competitor: float
    transit: float
    price: float
    area: float


class ScoredListingResponse(BaseModel):
    listing_id: str
    rank: int
    title: str
    address: str
    district: str | None = None
    price_tenge: int | None = None
    area_sqm: float | None = None
    url: str
    lat: float | None = None
    lng: float | None = None
    total_score: float
    score_breakdown: ScoreBreakdown
    competitor_count: int
    bus_stops_nearby: int
    metro_distance_m: float | None = None
    nearest_metro_name: str | None = None


class SearchResponse(BaseModel):
    """Response for POST /api/v1/search."""

    business_type: str
    district: str | None = None
    budget_tenge: int | None = None
    competitor_tolerance: int
    total_evaluated: int
    results: list[ScoredListingResponse]
    explanation: str = ""


class SearchSessionCreated(BaseModel):
    """Response for POST /api/v1/search (async mode)."""

    session_id: str
    status: str = "pending"
    message: str = "Search started. Poll GET /api/v1/search/{session_id} for results."


class SearchSessionStatus(BaseModel):
    """Response for GET /api/v1/search/{session_id}."""

    session_id: str
    status: str  # pending | running | complete | failed
    business_type: str
    district: str | None = None
    budget_tenge: int | None = None
    total_evaluated: int = 0
    explanation: str = ""
    error_message: str | None = None
    results: list[ScoredListingResponse] = []


class ListingsResponse(BaseModel):
    """Response for GET /api/v1/listings."""

    total: int
    showing: int
    listings: list[Listing]
