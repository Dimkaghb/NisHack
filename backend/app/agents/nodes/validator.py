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
1. Тип бизнеса
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
    """Apply validation decisions: filter rejected listings, adjust scores for penalized ones.

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
            # No decision made — keep with neutral note
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

        # Apply score adjustment for soft_penalize
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
    """LangGraph node: post-scoring quality gate using Gemini 2.5 Pro.

    Reviews top listings against planner validation rules, rejects semantic
    mismatches (office on 4th floor for a cafe), applies score adjustments,
    and re-ranks results.
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

    # Validate top 10 (more than needed, so we have backup after rejections)
    candidates = scored_listings[:10]

    search_plan = state.get("search_plan") or {}
    validation_rules: list[dict] = search_plan.get("validation_rules", [])
    business_type = state.get("business_type", "")

    try:
        listings_text = _format_listings_for_validation(candidates)
        rules_text = _format_rules(validation_rules)

        user_message = (
            f"Тип бизнеса: {business_type}\n\n"
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

        validated, validation_results = _apply_validation_results(candidates, decisions)

        # Top 5 after validation
        top_listings = validated[:5]

        log.info(
            "validator_node_done",
            candidates=len(candidates),
            kept=len(validated),
            rejected=len(candidates) - len(validated),
            top=len(top_listings),
            duration_ms=round((time.monotonic() - t0) * 1000),
        )

    except Exception as e:
        errors.append(f"validator_node: {e}")
        log.error("validator_node_failed", error=str(e))
        # Fallback: pass scored listings through unchanged
        top_listings = scored_listings[:5]
        validation_results = []

    return {
        "top_listings": top_listings,
        "validation_results": validation_results,
        "errors": errors,
    }
