import time

import structlog
from google.genai import types

from app.agents.state import PipelineState
from app.services.llm import call_gemini_with_tools

log = structlog.get_logger()

SYSTEM_PROMPT = """\
Ты — эксперт-аналитик по коммерческой недвижимости в Алматы, Казахстан.

Твоя задача: на основе типа бизнеса, района и бюджета пользователя составить план поиска \
помещения. Ты должен вызвать функцию create_search_plan с оптимальными параметрами.

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
- ТОЛЬКО первый этаж, идеально — с витриной на улицу
- Площадь 60-150 м²
- Исключить: офисы, склады, помещения в БЦ выше 1 этажа
- Важны: парки, ТЦ, университеты рядом (пешеходный трафик)
- Конкуренты: кафе, рестораны, кофейни в радиусе 400м

**Фастфуд (fastfood):**
- ТОЛЬКО первый этаж, высокий пешеходный трафик обязателен
- Площадь 40-100 м²
- Исключить: офисы, помещения выше 1 этажа
- Важны: остановки транспорта, ТЦ, учебные заведения
- Конкуренты: фастфуд, столовые в радиусе 300м

**Офис (office):**
- Этаж не критичен, БЦ предпочтительны
- Площадь 50-300 м²
- Важны: метро, парковка, транспортная доступность
- Конкуренты: бизнес-центры в радиусе 1000м

**Розничная торговля (retail):**
- ТОЛЬКО первый этаж, витрина обязательна
- Площадь 30-100 м²
- Исключить: офисы, помещения выше 1 этажа
- Важны: жилые массивы, остановки, перекрестки
- Конкуренты: магазины аналогичного типа в радиусе 500м

**Аптека (pharmacy):**
- Первый этаж обязателен
- Площадь 30-80 м²
- Исключить: офисы, помещения выше 1 этажа
- Важны: поликлиники, жилые дома, остановки транспорта
- Конкуренты: аптеки в радиусе 500м
"""

# Gemini function declaration for structured plan output
SEARCH_PLAN_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="create_search_plan",
            description="Create a structured search plan for finding commercial real estate",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "property_filters": types.Schema(
                        type="OBJECT",
                        description="Filters to apply when fetching listings",
                        properties={
                            "exclude_types": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="Property types to exclude, e.g. office, склад",
                            ),
                            "prefer_floor": types.Schema(
                                type="STRING",
                                description="Preferred floor: 'ground', 'low', or empty",
                                nullable=True,
                            ),
                            "area_range_min": types.Schema(
                                type="INTEGER",
                                description="Minimum ideal area in sqm",
                            ),
                            "area_range_max": types.Schema(
                                type="INTEGER",
                                description="Maximum ideal area in sqm",
                            ),
                        },
                    ),
                    "enrichment_hints": types.Schema(
                        type="OBJECT",
                        description="Hints for enrichment nodes",
                        properties={
                            "competitor_query_override": types.Schema(
                                type="STRING",
                                description="Custom 2GIS query for competitor search in Russian",
                                nullable=True,
                            ),
                            "competitor_radius": types.Schema(
                                type="INTEGER",
                                description="Competitor search radius in meters",
                            ),
                            "footfall_anchor_pois": types.Schema(
                                type="ARRAY",
                                items=types.Schema(type="STRING"),
                                description="POI types driving foot traffic: park, mall, university, etc.",
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
                                    description="Human-readable validation rule",
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
                        description="Explanation of the plan in Russian for the user",
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
    if state.get("district"):
        parts.append(f"Район: {state['district']}")
    if state.get("budget_tenge"):
        parts.append(f"Бюджет: {state['budget_tenge']} ₸/мес")
    if state.get("area_sqm_min"):
        parts.append(f"Минимальная площадь: {state['area_sqm_min']} м²")
    if state.get("competitor_tolerance") is not None:
        parts.append(f"Толерантность к конкурентам: {state['competitor_tolerance']}/10")

    return (
        "Составь план поиска коммерческого помещения по следующим параметрам:\n\n"
        + "\n".join(parts)
        + "\n\nВызови функцию create_search_plan с оптимальными параметрами."
    )


def _parse_plan_response(result: dict) -> tuple[dict, str]:
    """Parse Gemini function-call response into (search_plan_dict, reasoning)."""
    args = result.get("arguments", {})

    # Extract reasoning
    reasoning = args.get("reasoning", "")

    # Build search_plan dict matching SearchPlan schema
    pf = args.get("property_filters", {})
    area_min = pf.get("area_range_min")
    area_max = pf.get("area_range_max")
    area_range = None
    if area_min is not None and area_max is not None:
        area_range = [int(area_min), int(area_max)]

    eh = args.get("enrichment_hints", {})
    vr = args.get("validation_rules", [])

    search_plan = {
        "property_filters": {
            "exclude_types": list(pf.get("exclude_types", [])),
            "prefer_floor": pf.get("prefer_floor"),
            "area_range": area_range,
        },
        "enrichment_hints": {
            "competitor_query_override": eh.get("competitor_query_override"),
            "competitor_radius": int(eh["competitor_radius"]) if eh.get("competitor_radius") else None,
            "footfall_anchor_pois": list(eh.get("footfall_anchor_pois", [])),
        },
        "validation_rules": [
            {"rule": r.get("rule", ""), "severity": r.get("severity", "soft_penalize")}
            for r in (vr if isinstance(vr, list) else [])
        ],
    }

    return search_plan, reasoning


async def planner_node(state: PipelineState) -> dict:
    """LangGraph node: LLM-driven intent analysis before data fetching.

    Uses Gemini 2.5 Pro function-calling to produce a SearchPlan that guides
    downstream nodes (fetcher, competitor, footfall, validator).
    """
    t0 = time.monotonic()
    errors: list[str] = []

    try:
        user_message = _build_user_message(state)

        result = await call_gemini_with_tools(
            system=SYSTEM_PROMPT,
            user_message=user_message,
            tools=[SEARCH_PLAN_TOOL],
        )

        search_plan, reasoning = _parse_plan_response(result)

        log.info(
            "planner_node_done",
            business_type=state["business_type"],
            exclude_types=search_plan["property_filters"]["exclude_types"],
            validation_rules_count=len(search_plan["validation_rules"]),
            duration_ms=round((time.monotonic() - t0) * 1000),
        )

    except Exception as e:
        errors.append(f"planner_node: {e}")
        log.error("planner_node_failed", error=str(e))
        # Fallback: empty plan, pipeline continues without planner guidance
        search_plan = {
            "property_filters": {"exclude_types": [], "prefer_floor": None, "area_range": None},
            "enrichment_hints": {
                "competitor_query_override": None,
                "competitor_radius": None,
                "footfall_anchor_pois": [],
            },
            "validation_rules": [],
        }
        reasoning = ""

    return {
        "search_plan": search_plan,
        "planner_reasoning": reasoning,
        "errors": errors,
    }
