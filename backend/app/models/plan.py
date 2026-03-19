from pydantic import BaseModel, Field


class PropertyFilters(BaseModel):
    """Filters to apply when fetching listings from DB."""

    exclude_types: list[str] = Field(
        default_factory=list,
        description="Property types to exclude, e.g. ['office', 'склад']",
    )
    prefer_floor: str | None = Field(
        None,
        description="Preferred floor: 'ground', 'low' (1-3), or None",
    )
    area_range: tuple[int, int] | None = Field(
        None,
        description="Ideal area range in sqm, e.g. (60, 150)",
    )

    model_config = {"str_strip_whitespace": True}


class EnrichmentHints(BaseModel):
    """Hints for enrichment nodes from the planner."""

    competitor_query_override: str | None = Field(
        None,
        description="Custom 2GIS search query for competitors, e.g. 'кафе ресторан кофейня'",
    )
    competitor_radius: int | None = Field(
        None,
        description="Custom competitor search radius in meters",
    )
    footfall_anchor_pois: list[str] = Field(
        default_factory=list,
        description="POI types that drive foot traffic for this business, e.g. ['park', 'торговый центр']",
    )

    model_config = {"str_strip_whitespace": True}


class ValidationRule(BaseModel):
    """A rule the validator should enforce on results."""

    rule: str = Field(description="Human-readable rule, e.g. 'Reject listings above 3rd floor'")
    severity: str = Field(
        description="'hard_reject' removes listing, 'soft_penalize' reduces score by 15 points"
    )

    model_config = {"str_strip_whitespace": True}


class SearchPlan(BaseModel):
    """Full search plan produced by the planner node."""

    property_filters: PropertyFilters = Field(default_factory=PropertyFilters)
    enrichment_hints: EnrichmentHints = Field(default_factory=EnrichmentHints)
    validation_rules: list[ValidationRule] = Field(default_factory=list)

    model_config = {"str_strip_whitespace": True}


# ── SearchQuery: comprehensive AI-generated search specification ──


class BusinessProfile(BaseModel):
    """AI-extracted business profile from all user inputs."""

    type: str = Field(description="Normalized business type: fastfood, cafe, office, retail, pharmacy")
    name: str | None = Field(None, description="Business name if provided by user")
    concept: str = Field(description="One-line business concept, e.g. 'кофе с собой для офисных работников'")
    target_audience: list[str] = Field(
        default_factory=list,
        description="Target customer segments, e.g. ['студенты', 'офисные работники']",
    )
    format_details: str = Field(
        "", description="Business format specifics, e.g. 'навынос', 'ресторан с посадкой'"
    )
    needs_high_footfall: bool = Field(True, description="Whether the business depends on walk-in traffic")
    needs_street_visibility: bool = Field(
        True, description="Whether street-facing entrance/signage is important"
    )
    needs_parking: bool = Field(False, description="Whether customer parking is important")

    model_config = {"str_strip_whitespace": True}


class LocationRequirements(BaseModel):
    """AI-derived location requirements for property search."""

    district: str | None = Field(None, description="Preferred district in English, e.g. 'Almaly'")
    preferred_zones: list[str] = Field(
        default_factory=list,
        description="Preferred zone types, e.g. ['рядом с университетами', 'у метро']",
    )
    avoid_zones: list[str] = Field(
        default_factory=list,
        description="Zones to avoid, e.g. ['промзона', 'спальный район без трафика']",
    )
    floor: str = Field("ground", description="Preferred floor: 'ground', 'low', 'any'")
    min_area_sqm: int = Field(30, description="Minimum area in sqm")
    max_area_sqm: int = Field(200, description="Maximum area in sqm")
    max_budget_tenge: int | None = Field(None, description="Maximum monthly rent in KZT")

    model_config = {"str_strip_whitespace": True}


class CompetitiveContext(BaseModel):
    """AI-derived competitive analysis parameters."""

    competitor_search_queries: list[str] = Field(
        default_factory=list,
        description="2GIS search queries for competitors in Russian, e.g. ['кофейня', 'кофе с собой']",
    )
    competitor_radius_m: int = Field(500, description="Radius for competitor search in meters")
    max_competitors_nearby: int = Field(5, description="Acceptable number of nearby competitors")

    model_config = {"str_strip_whitespace": True}


class ScoringHints(BaseModel):
    """AI-suggested scoring adjustments based on business specifics."""

    footfall_anchor_pois: list[str] = Field(
        default_factory=list,
        description="POI types that drive foot traffic for this business, e.g. ['университет', 'ТЦ']",
    )
    prefer_transit_corridors: bool = Field(
        False, description="Whether proximity to major transit corridors is important"
    )
    custom_weight_adjustments: dict[str, float] = Field(
        default_factory=dict,
        description="Weight multipliers, e.g. {'footfall': 1.2, 'competitor': 0.8}",
    )

    model_config = {"str_strip_whitespace": True}


class SearchQuery(BaseModel):
    """Comprehensive AI-generated search specification.

    Produced by the planner node from ALL user inputs (business type, name,
    description, district, budget, area, competitor tolerance).
    This is the single source of truth that drives the entire pipeline.
    """

    business_profile: BusinessProfile
    location_requirements: LocationRequirements
    competitive_context: CompetitiveContext
    scoring_hints: ScoringHints
    validation_rules: list[ValidationRule] = Field(default_factory=list)
    reasoning: str = Field("", description="AI reasoning about the search strategy in Russian")

    model_config = {"str_strip_whitespace": True}


class ValidationResult(BaseModel):
    """Per-listing validation decision from the validator node."""

    listing_id: str
    decision: str = Field(description="'keep' or 'reject'")
    reason: str = Field(description="Why this decision was made")
    score_adjustment: int = Field(
        0,
        description="Points to add/subtract from total_score (negative = penalize)",
    )

    model_config = {"str_strip_whitespace": True}
