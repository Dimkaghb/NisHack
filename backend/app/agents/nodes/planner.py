import time

import structlog
from google.genai import types

from app.agents.state import PipelineState
from app.services.llm import call_gemini_with_tools

log = structlog.get_logger()

SYSTEM_PROMPT = """\
Ты — эксперт-аналитик по коммерческой недвижимости в Алматы, Казахстан.

Твоя задача: на основе ВСЕЙ информации от пользователя (тип бизнеса, название, описание, \
район, бюджет, площадь, толерантность к конкурентам) составить КОМПЛЕКСНЫЙ поисковый запрос \
для системы поиска коммерческих помещений.

Ты ДОЛЖЕН извлечь максимум полезной информации из описания бизнеса пользователя:
- Определи целевую аудиторию
- Определи формат бизнеса (навынос, с посадкой, самообслуживание и т.д.)
- Определи, нужна ли высокая проходимость, парковка, витрина на улицу
- Определи, какие конкуренты релевантны
- Определи предпочтительные зоны и зоны, которых стоит избегать

Вызови функцию create_search_query с полным набором параметров.

## Знания об Алматы

Районы и их характеристики:
- Алмалы (Almaly) — центр города, ул. Жибек Жолы, максимальный пешеходный трафик, высокая аренда
- Медеу (Medeu) — пр. Достык, ТРЦ Mega, премиальный район
- Бостандык (Bostandyk) — Розыбакиева, активный жилой+торговый район
- Алатау (Alatau) — новый жилой район, растущий трафик
- Ауезов (Auezov) — базары, местная торговля, средний трафик
- Жетысу (Zhetysu) — спальный район, средний трафик
- Турксиб (Turksib) — промзоны, низкий трафик
- Наурызбай (Nauryzbai) — окраина, низкий трафик

Транспортные коридоры (высокий трафик): Аль-Фараби, Достык, Сейфуллина, Розыбакиева
Метро: 1 линия, 11 станций (Бауыржан Момышұлы → Райымбек батыр)

## Правила по типам бизнеса

**Кафе/Ресторан (cafe):**
- ТОЛЬКО первый этаж, витрина на улицу
- Площадь 60-150 м²
- Исключить: офисы, склады, помещения в БЦ выше 1 этажа
- Важны: парки, ТЦ, университеты (пешеходный трафик)
- Конкуренты: кафе, рестораны, кофейни в радиусе 400м

**Фастфуд (fastfood):**
- ТОЛЬКО первый этаж, высокий пешеходный трафик обязателен
- Площадь 40-100 м²
- Исключить: офисы, помещения выше 1 этажа
- Важны: остановки, ТЦ, учебные заведения
- Конкуренты: фастфуд, столовые в радиусе 300м

**Офис (office):**
- Этаж не критичен, БЦ предпочтительны
- Площадь 50-300 м²
- Важны: метро, парковка, транспорт
- Конкуренты: бизнес-центры в радиусе 1000м

**Розничная торговля (retail):**
- ТОЛЬКО первый этаж, витрина обязательна
- Площадь 30-100 м²
- Важны: жилые массивы, остановки, перекрестки
- Конкуренты: магазины аналогичного типа в радиусе 500м

**Аптека (pharmacy):**
- Первый этаж обязателен
- Площадь 30-80 м²
- Важны: поликлиники, жилые дома, остановки
- Конкуренты: аптеки в радиусе 500м
"""

# Gemini function declaration for the comprehensive SearchQuery output
SEARCH_QUERY_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="create_search_query",
            description="Create a comprehensive search query for commercial real estate",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "business_profile": types.Schema(
                        type="OBJECT",
                        description="AI-extracted business profile",
                        properties={
                            "type": types.Schema(
                                type="STRING",
                                description="Business type: fastfood, cafe, office, retail, pharmacy",
                            ),
                            "name": types.Schema(
                                type="STRING",
                                description="Business name if provided",
                                nullable=True,
                            ),
                            "concept": types.Schema(
                                type="STRING",
                                description="One-line business concept in Russian",
                            ),
                            "target_audience": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="Target customer segments in Russian",
                            ),
                            "format_details": types.Schema(
                                type="STRING",
                                description="Business format specifics in Russian",
                            ),
                            "needs_high_footfall": types.Schema(
                                type="BOOLEAN",
                                description="Whether business depends on walk-in traffic",
                            ),
                            "needs_street_visibility": types.Schema(
                                type="BOOLEAN",
                                description="Whether street-facing entrance is important",
                            ),
                            "needs_parking": types.Schema(
                                type="BOOLEAN",
                                description="Whether customer parking is important",
                            ),
                        },
                    ),
                    "location_requirements": types.Schema(
                        type="OBJECT",
                        description="Location requirements for property search",
                        properties={
                            "district": types.Schema(
                                type="STRING",
                                description="Preferred district in English (Almaly, Medeu, etc.) or null",
                                nullable=True,
                            ),
                            "preferred_zones": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="Preferred zone types in Russian",
                            ),
                            "avoid_zones": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="Zones to avoid in Russian",
                            ),
                            "floor": types.Schema(
                                type="STRING",
                                description="Preferred floor: ground, low, any",
                            ),
                            "min_area_sqm": types.Schema(
                                type="INTEGER",
                                description="Minimum area in sqm",
                            ),
                            "max_area_sqm": types.Schema(
                                type="INTEGER",
                                description="Maximum area in sqm",
                            ),
                            "max_budget_tenge": types.Schema(
                                type="INTEGER",
                                description="Maximum monthly rent in KZT",
                                nullable=True,
                            ),
                        },
                    ),
                    "competitive_context": types.Schema(
                        type="OBJECT",
                        description="Competitive analysis parameters",
                        properties={
                            "competitor_search_queries": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="2GIS search queries for competitors in Russian",
                            ),
                            "competitor_radius_m": types.Schema(
                                type="INTEGER",
                                description="Radius for competitor search in meters",
                            ),
                            "max_competitors_nearby": types.Schema(
                                type="INTEGER",
                                description="Acceptable number of nearby competitors",
                            ),
                        },
                    ),
                    "scoring_hints": types.Schema(
                        type="OBJECT",
                        description="Scoring adjustments based on business specifics",
                        properties={
                            "footfall_anchor_pois": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="POI types that drive foot traffic in Russian",
                            ),
                            "prefer_transit_corridors": types.Schema(
                                type="BOOLEAN",
                                description="Whether transit corridor proximity matters",
                            ),
                        },
                    ),
                    "validation_rules": types.Schema(
                        type="ARRAY",
                        description="Rules for post-scoring validation",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "rule": types.Schema(
                                    type="STRING",
                                    description="Human-readable validation rule in Russian",
                                ),
                                "severity": types.Schema(
                                    type="STRING",
                                    description="hard_reject or soft_penalize",
                                ),
                            },
                        ),
                    ),
                    "reasoning": types.Schema(
                        type="STRING",
                        description="Explanation of the search strategy in Russian",
                    ),
                },
            ),
        )
    ]
)


def _build_user_message(state: PipelineState) -> str:
    """Build the user message for the planner from pipeline state."""
    parts = [
        f"Тип бизнеса: {state['business_type']}",
        f"Город: {state.get('city', 'Алматы')}",
    ]

    if state.get("business_name"):
        parts.append(f"Название бизнеса: {state['business_name']}")

    if state.get("business_description"):
        parts.append(f"Описание бизнеса: {state['business_description']}")

    if state.get("district"):
        parts.append(f"Район: {state['district']}")

    if state.get("budget_tenge"):
        parts.append(f"Бюджет: {state['budget_tenge']} ₸/мес")

    if state.get("area_sqm_min"):
        parts.append(f"Минимальная площадь: {state['area_sqm_min']} м²")

    if state.get("competitor_tolerance") is not None:
        parts.append(f"Толерантность к конкурентам: {state['competitor_tolerance']}/10")

    return (
        "Проанализируй ВСЮ информацию и составь комплексный поисковый запрос.\n"
        "Извлеки максимум полезных деталей из описания бизнеса.\n\n"
        + "\n".join(parts)
        + "\n\nВызови функцию create_search_query."
    )


def _parse_search_query(result: dict) -> tuple[dict, str]:
    """Parse Gemini function-call response into (search_query_dict, reasoning)."""
    args = result.get("arguments", {})

    reasoning = args.get("reasoning", "")

    bp = args.get("business_profile", {})
    lr = args.get("location_requirements", {})
    cc = args.get("competitive_context", {})
    sh = args.get("scoring_hints", {})
    vr = args.get("validation_rules", [])

    search_query = {
        "business_profile": {
            "type": bp.get("type", ""),
            "name": bp.get("name"),
            "concept": bp.get("concept", ""),
            "target_audience": list(bp.get("target_audience", [])),
            "format_details": bp.get("format_details", ""),
            "needs_high_footfall": bool(bp.get("needs_high_footfall", True)),
            "needs_street_visibility": bool(bp.get("needs_street_visibility", True)),
            "needs_parking": bool(bp.get("needs_parking", False)),
        },
        "location_requirements": {
            "district": lr.get("district"),
            "preferred_zones": list(lr.get("preferred_zones", [])),
            "avoid_zones": list(lr.get("avoid_zones", [])),
            "floor": lr.get("floor", "ground"),
            "min_area_sqm": int(lr.get("min_area_sqm", 30)),
            "max_area_sqm": int(lr.get("max_area_sqm", 200)),
            "max_budget_tenge": int(lr["max_budget_tenge"]) if lr.get("max_budget_tenge") else None,
        },
        "competitive_context": {
            "competitor_search_queries": list(cc.get("competitor_search_queries", [])),
            "competitor_radius_m": int(cc.get("competitor_radius_m", 500)),
            "max_competitors_nearby": int(cc.get("max_competitors_nearby", 5)),
        },
        "scoring_hints": {
            "footfall_anchor_pois": list(sh.get("footfall_anchor_pois", [])),
            "prefer_transit_corridors": bool(sh.get("prefer_transit_corridors", False)),
            "custom_weight_adjustments": {},
        },
        "validation_rules": [
            {"rule": r.get("rule", ""), "severity": r.get("severity", "soft_penalize")}
            for r in (vr if isinstance(vr, list) else [])
        ],
        "reasoning": reasoning,
    }

    return search_query, reasoning


def _build_fallback_search_query(state: PipelineState) -> dict:
    """Build a minimal SearchQuery from raw state when Gemini fails."""
    btype = state.get("business_type", "cafe")

    floor_map = {"fastfood": "ground", "cafe": "ground", "retail": "ground",
                 "pharmacy": "ground", "office": "any"}
    area_map = {"fastfood": (40, 100), "cafe": (60, 150), "retail": (30, 100),
                "pharmacy": (30, 80), "office": (50, 300)}

    area_min, area_max = area_map.get(btype, (30, 200))
    if state.get("area_sqm_min"):
        area_min = state["area_sqm_min"]

    return {
        "business_profile": {
            "type": btype,
            "name": state.get("business_name"),
            "concept": btype,
            "target_audience": [],
            "format_details": "",
            "needs_high_footfall": btype != "office",
            "needs_street_visibility": btype != "office",
            "needs_parking": btype == "office",
        },
        "location_requirements": {
            "district": state.get("district"),
            "preferred_zones": [],
            "avoid_zones": [],
            "floor": floor_map.get(btype, "ground"),
            "min_area_sqm": area_min,
            "max_area_sqm": area_max,
            "max_budget_tenge": state.get("budget_tenge"),
        },
        "competitive_context": {
            "competitor_search_queries": [],
            "competitor_radius_m": 500,
            "max_competitors_nearby": state.get("competitor_tolerance", 5),
        },
        "scoring_hints": {
            "footfall_anchor_pois": [],
            "prefer_transit_corridors": False,
            "custom_weight_adjustments": {},
        },
        "validation_rules": [],
        "reasoning": "",
    }


async def planner_node(state: PipelineState) -> dict:
    """LangGraph node: AI-driven analysis of ALL user inputs.

    Takes business type, name, description, district, budget, area, and competitor
    tolerance — produces a comprehensive SearchQuery JSON that drives the entire
    downstream pipeline (fetcher, enrichment, scoring, validation, explanation).
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        user_message = _build_user_message(state)

        result = await call_gemini_with_tools(
            system=SYSTEM_PROMPT,
            user_message=user_message,
            tools=[SEARCH_QUERY_TOOL],
        )

        search_query, reasoning = _parse_search_query(result)

        log.info(
            "planner_node_done",
            business_type=state["business_type"],
            business_name=state.get("business_name"),
            has_description=bool(state.get("business_description")),
            concept=search_query["business_profile"].get("concept", ""),
            target_audience=search_query["business_profile"].get("target_audience", []),
            validation_rules_count=len(search_query["validation_rules"]),
            duration_ms=round((time.monotonic() - t0) * 1000),
        )

    except Exception as e:
        errors.append(f"planner_node: {e}")
        log.error("planner_node_failed", error=str(e))
        search_query = _build_fallback_search_query(state)
        reasoning = ""

    return {
        "search_query": search_query,
        "planner_reasoning": reasoning,
        "errors": errors,
    }
