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
