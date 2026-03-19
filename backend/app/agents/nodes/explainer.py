import time

import structlog
from google import genai
from google.genai import types

from app.config import settings

log = structlog.get_logger()

client = genai.Client(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = (
    "Ты — эксперт по коммерческой недвижимости в Алматы. "
    "Отвечай строго на русском языке. "
    "Используй деловой, но дружелюбный тон. "
    "Объясняй кратко и конкретно — без воды и общих фраз. "
    "Используй конкретные цифры из предоставленных данных: "
    "баллы трафика, количество конкурентов, близость транспорта, цену. "
    "Формат: для каждой локации — 2-3 предложения с ключевыми аргументами. "
    "Цены указывай в тенге с символом ₸."
)


def _format_listings_for_prompt(listings: list[dict], business_type: str) -> str:
    """Format scored listings into a readable prompt for the LLM."""
    lines: list[str] = []
    for i, l in enumerate(listings, 1):
        breakdown = l.get("score_breakdown", {})
        lines.append(
            f"{i}. {l.get('title', 'Без названия')}\n"
            f"   Адрес: {l.get('address', 'Не указан')}\n"
            f"   Район: {l.get('district', 'Не указан')}\n"
            f"   Цена: {l.get('price_tenge', 'Не указана')} ₸/мес\n"
            f"   Площадь: {l.get('area_sqm', 'Не указана')} м²\n"
            f"   Общий балл: {l.get('total_score', 0)}/100\n"
            f"   Трафик: {breakdown.get('footfall', 0)}/100\n"
            f"   Конкуренты рядом: {l.get('competitor_count', 0)} "
            f"(балл: {breakdown.get('competitor', 0)}/100)\n"
            f"   Транспорт: {breakdown.get('transit', 0)}/100 "
            f"(остановок: {l.get('bus_stops_nearby', 0)}, "
            f"метро: {l.get('metro_distance_m', 'далеко')} м — {l.get('nearest_metro_name', '')})\n"
            f"   Цена/бюджет: {breakdown.get('price', 0)}/100\n"
            f"   Площадь: {breakdown.get('area', 0)}/100"
        )
    return "\n\n".join(lines)


async def generate_explanation(
    scored_listings: list[dict],
    business_type: str,
) -> str:
    """Generate a Russian explanation for the top scored listings using Gemini."""
    t0 = time.monotonic()

    formatted = _format_listings_for_prompt(scored_listings, business_type)
    user_prompt = (
        f"Вот топ-{len(scored_listings)} локаций для бизнеса типа «{business_type}» в Алматы.\n"
        f"Объясни для каждой, почему она подходит, используя конкретные цифры из данных.\n\n"
        f"{formatted}"
    )

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=1500,
            ),
        )
        explanation = response.text or ""
    except Exception as e:
        log.error("explainer_failed", error=str(e))
        explanation = "Не удалось сгенерировать объяснение. Попробуйте позже."

    duration_ms = round((time.monotonic() - t0) * 1000)
    log.debug(
        "explainer_done",
        listings=len(scored_listings),
        business_type=business_type,
        duration_ms=duration_ms,
        explanation_length=len(explanation),
    )

    return explanation


async def explainer_node(state: dict) -> dict:
    """LangGraph node: generate Russian explanations for top scored listings.

    Follows the node contract: async def, returns only updated keys, never raises.
    """
    t0 = time.monotonic()
    errors: list[str] = []

    top = state.get("top_listings", []) or state.get("scored_listings", [])[:5]
    if not top:
        errors.append("explainer_node: no listings to explain")
        return {
            "explanation": "",
            "errors": errors,
        }

    try:
        explanation = await generate_explanation(top, state.get("business_type", ""))
    except Exception as e:
        errors.append(f"explainer_node: {e}")
        explanation = "Не удалось сгенерировать объяснение."

    log.debug(
        "explainer_node_done",
        listings=len(top),
        errors=len(errors),
        duration_ms=round((time.monotonic() - t0) * 1000),
    )

    return {
        "explanation": explanation,
        "errors": errors,
    }
