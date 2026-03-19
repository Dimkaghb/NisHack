import time

import structlog
from google.genai import types

from app.agents.state import PipelineState
from app.services.llm import call_gemini_with_tools

log = structlog.get_logger()

SYSTEM_PROMPT = """\
Ты — строгий эксперт по коммерческой недвижимости в Алматы. \
Твоя задача: проверить, действительно ли каждое помещение подходит для указанного бизнеса.

Ты получишь:
1. Тип бизнеса и его описание
2. Правила валидации от планировщика
3. Список помещений с описаниями и баллами

Для каждого помещения вынеси решение: keep (оставить) или reject (отклонить).

Правила:
- hard_reject правила → если нарушено → decision: "reject"
- soft_penalize правила → если нарушено → decision: "keep" с отрицательным score_adjustment (-10 до -25)
- Если помещение очевидно не подходит по здравому смыслу (офис на 4 этаже для кафе) → reject
- Будь строгим: лучше отклонить сомнительное, чем показать неподходящее
- В reason объясняй кратко и по делу
"""

VALIDATE_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="validate_listings",
            description="Return validation decisions for each listing",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "decisions": types.Schema(
                        type="ARRAY",
                        description="Validation decision for each listing",
                        items=types.Schema(
                            type="OBJECT",
                            properties={
                                "listing_id": types.Schema(
                                    type="STRING",
                                    description="The listing ID",
                                ),
                                "decision": types.Schema(
                                    type="STRING",
                                    description="keep or reject",
                                ),
                                "reason": types.Schema(
                                    type="STRING",
                                    description="Brief reason in Russian",
                                ),
                                "score_adjustment": types.Schema(
                                    type="INTEGER",
                                    description="Score adjustment: 0, or negative for soft_penalize",
                                ),
                            },
                        ),
                    )
                },
            ),
        )
    ]
)

# Max listings to send to Gemini per validation batch
_BATCH_SIZE = 15


def _format_listings_for_validation(listings: list[dict]) -> str:
    """Format listings for the validator prompt."""
    lines: list[str] = []
    for lst in listings:
        lines.append(
            f"ID: {lst.get('listing_id') or lst.get('id')}\n"
            f"  Название: {lst.get('title', 'Без названия')}\n"
            f"  Адрес: {lst.get('address', 'Не указан')}\n"
            f"  Тип помещения: {lst.get('property_type') or 'Не указан'}\n"
            f"  Общий балл: {lst.get('total_score', 0)}/100\n"
            f"  Цена: {lst.get('price_tenge', 'Не указана')} ₸/мес\n"
            f"  Площадь: {lst.get('area_sqm', 'Не указана')} м²"
        )
    return "\n\n".join(lines)


def _format_rules(validation_rules: list[dict]) -> str:
    """Format validation rules for prompt."""
    if not validation_rules:
        return "Используй здравый смысл."
    lines = []
    for rule in validation_rules:
        severity = rule.get("severity", "soft_penalize")
        icon = "❌" if severity == "hard_reject" else "⚠️"
        lines.append(f"{icon} [{severity}] {rule.get('rule', '')}")
    return "\n".join(lines)


def _apply_validation_results(
    scored_listings: list[dict],
    decisions: list[dict],
) -> tuple[list[dict], list[dict]]:
    """Apply validation decisions: filter rejected, adjust penalized scores.

    Returns (validated_listings, validation_results).
    """
    decision_map: dict[str, dict] = {
        d.get("listing_id", ""): d for d in decisions
    }

    validated: list[dict] = []
    validation_results: list[dict] = []

    for lst in scored_listings:
        lid = str(lst.get("listing_id") or lst.get("id") or "")
        decision = decision_map.get(lid)

        if decision is None:
            validated.append(lst)
            validation_results.append({
                "listing_id": lid,
                "decision": "keep",
                "reason": "Не проверялось",
                "score_adjustment": 0,
            })
            continue

        d_result = decision.get("decision", "keep")
        reason = decision.get("reason", "")
        adjustment = int(decision.get("score_adjustment", 0))

        validation_results.append({
            "listing_id": lid,
            "decision": d_result,
            "reason": reason,
            "score_adjustment": adjustment,
        })

        if d_result == "reject":
            log.debug("validator_rejected", listing_id=lid, reason=reason)
            continue

        if adjustment != 0:
            lst = dict(lst)
            lst["total_score"] = max(0.0, lst.get("total_score", 0) + adjustment)
            log.debug("validator_penalized", listing_id=lid, adjustment=adjustment)

        validated.append(lst)

    # Re-rank after adjustments
    validated.sort(key=lambda x: x.get("total_score", 0), reverse=True)
    for rank, item in enumerate(validated, 1):
        item["rank"] = rank

    return validated, validation_results


async def validator_node(state: PipelineState) -> dict:
    """LangGraph node: post-scoring quality gate using Gemini.

    Validates ALL scored listings in batches. Rejects semantic mismatches,
    applies score adjustments, and re-ranks. Returns all validated listings
    as top_listings (not limited to 5).
    """
    t0 = time.monotonic()
    errors: list[str] = []

    scored_listings = state.get("scored_listings", [])
    if not scored_listings:
        return {
            "top_listings": [],
            "validation_results": [],
            "errors": [],
        }

    search_query = state.get("search_query") or {}
    validation_rules: list[dict] = search_query.get("validation_rules", [])
    business_type = state.get("business_type", "")

    # Enrich context with business profile
    bp = search_query.get("business_profile", {})
    business_context = business_type
    if bp.get("concept"):
        business_context = f"{business_type} ({bp['concept']})"

    rules_text = _format_rules(validation_rules)

    all_decisions: list[dict] = []

    try:
        # Validate in batches to handle many listings
        for i in range(0, len(scored_listings), _BATCH_SIZE):
            batch = scored_listings[i : i + _BATCH_SIZE]

            listings_text = _format_listings_for_validation(batch)

            user_message = (
                f"Тип бизнеса: {business_context}\n\n"
                f"Правила валидации:\n{rules_text}\n\n"
                f"Помещения для проверки:\n\n{listings_text}\n\n"
                "Вызови функцию validate_listings с решением для каждого помещения."
            )

            result = await call_gemini_with_tools(
                system=SYSTEM_PROMPT,
                user_message=user_message,
                tools=[VALIDATE_TOOL],
            )

            decisions: list[dict] = result.get("arguments", {}).get("decisions", [])
            all_decisions.extend(decisions)

            log.debug(
                "validator_batch_done",
                batch_start=i,
                batch_size=len(batch),
                decisions=len(decisions),
            )

        validated, validation_results = _apply_validation_results(scored_listings, all_decisions)

        log.info(
            "validator_node_done",
            total_candidates=len(scored_listings),
            kept=len(validated),
            rejected=len(scored_listings) - len(validated),
            duration_ms=round((time.monotonic() - t0) * 1000),
        )

    except Exception as e:
        errors.append(f"validator_node: {e}")
        log.error("validator_node_failed", error=str(e))
        # Fallback: pass scored listings through unchanged
        validated = scored_listings
        validation_results = []

    return {
        "top_listings": validated,
        "validation_results": validation_results,
        "errors": errors,
    }
