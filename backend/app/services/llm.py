import json

import structlog
from google import genai
from google.genai import types

from app.config import settings

log = structlog.get_logger()

MODEL = "gemini-2.5-pro"

_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    """Return a singleton Gemini client."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def call_gemini(
    system: str,
    user_message: str,
    model: str = MODEL,
    max_output_tokens: int = 1500,
) -> str:
    """Plain text generation via Gemini."""
    client = get_gemini_client()
    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_output_tokens,
            ),
        )
        return response.text or ""
    except Exception as e:
        log.error("gemini_call_failed", model=model, error=str(e))
        raise


async def call_gemini_with_tools(
    system: str,
    user_message: str,
    tools: list[types.Tool],
    model: str = MODEL,
    max_output_tokens: int = 2000,
) -> dict:
    """Structured output via Gemini function-calling.

    Returns the parsed arguments of the first function call in the response.
    """
    client = get_gemini_client()
    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system,
                tools=tools,
                max_output_tokens=max_output_tokens,
            ),
        )

        # Extract function call from response
        for part in response.candidates[0].content.parts:
            if part.function_call:
                # Convert proto to dict
                args = dict(part.function_call.args)
                log.debug(
                    "gemini_tool_call",
                    function=part.function_call.name,
                    args_keys=list(args.keys()),
                )
                return {"function_name": part.function_call.name, "arguments": args}

        # No function call — return text as fallback
        text = response.text or ""
        log.warning("gemini_no_tool_call", model=model, text_length=len(text))

        # Try to parse as JSON in case model returned JSON text instead of tool call
        try:
            return {"function_name": "text_fallback", "arguments": json.loads(text)}
        except (json.JSONDecodeError, TypeError):
            return {"function_name": "text_fallback", "arguments": {"text": text}}

    except Exception as e:
        log.error("gemini_tool_call_failed", model=model, error=str(e))
        raise
