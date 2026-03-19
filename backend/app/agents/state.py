import operator
from typing import Annotated

from typing_extensions import TypedDict


class PipelineState(TypedDict):
    """Shared state for the LangGraph search pipeline.

    Each enrichment node writes to its own key to avoid parallel merge conflicts.
    The scoring node merges all enrichment results by listing_id.
    The `errors` key uses an add-reducer so parallel nodes can all append.
    """

    # --- Input params (set once at pipeline start) ---
    search_id: str
    business_type: str  # "fastfood" | "office" | "retail" | "cafe" | "pharmacy"
    city: str  # "almaty" — hardcoded for MVP
    district: str | None
    budget_tenge: int | None
    area_sqm_min: int | None
    competitor_tolerance: int  # 0-10
    weights_override: dict | None

    # --- Fetcher output ---
    raw_listings: list[dict]

    # --- Enrichment outputs (separate keys to avoid parallel overwrite) ---
    footfall_results: list[dict]     # [{listing_id, footfall_raw}, ...]
    competitor_results: list[dict]   # [{listing_id, competitor_count}, ...]
    transit_results: list[dict]      # [{listing_id, bus_stops_nearby, metro_distance_m, ...}, ...]

    # --- Scoring output ---
    scored_listings: list[dict]
    top_listings: list[dict]

    # --- Explainer output ---
    explanation: str

    # --- Errors: add-reducer so all parallel nodes can append ---
    errors: Annotated[list[str], operator.add]
