import os
import json
import time
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=_root_env, override=False)

logger = logging.getLogger("launchwise.gemini_helper")

# ── Gemini AI Studio configuration ──────────────────────────────────────────
# Uses Google AI Studio API key — NOT Vertex AI.
# Key is read from GEMINI_API_KEY environment variable.
api_key = os.getenv("GEMINI_API_KEY")

_PLACEHOLDER = "YOUR_GEMINI_API_KEY_HERE"
_key_valid = bool(api_key and api_key.strip() and api_key != _PLACEHOLDER)

if _key_valid:
    client = genai.Client(api_key=api_key)
    print("Gemini AI Studio API configured successfully with google-genai SDK.")
else:
    client = None
    print("WARNING: GEMINI_API_KEY missing or not set. Gemini calls will use mock fallbacks.")

# ── Rate-limit retry configuration ──────────────────────────────────────────
MAX_RETRIES = 4              # Total attempts = 1 original + 4 retries
INITIAL_BACKOFF_SEC = 5      # First retry waits 5s, then 15s, 30s, 60s


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if the exception is a 429 rate-limit / quota-exhausted error."""
    err_str = str(error)
    return "429" in err_str or "RESOURCE_EXHAUSTED" in err_str


def _generate_with_retry(prompt: str, generation_config, attempt_label: str = "") -> str:
    """
    Internal helper: calls Gemini with automatic exponential-backoff retry
    on 429 rate-limit errors. Returns the raw text response.
    """
    last_err = None
    for attempt in range(1, MAX_RETRIES + 2):   # +2 because range is exclusive and we start at 1
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=generation_config,
            )
            return response.text.strip()
        except Exception as e:
            last_err = e
            if _is_rate_limit_error(e) and attempt <= MAX_RETRIES:
                wait = INITIAL_BACKOFF_SEC * (2 ** (attempt - 1))  # 5, 10, 20, 40
                logger.warning(
                    f"[Gemini] Rate-limited (attempt {attempt}/{MAX_RETRIES+1}){attempt_label}. "
                    f"Retrying in {wait}s..."
                )
                time.sleep(wait)
            else:
                raise
    # Should not reach here, but just in case
    raise last_err


def call_gemini_json(prompt: str, mock_fallback: dict, enable_search: bool = False) -> dict:
    """
    Calls Gemini 2.5 Flash via Google AI Studio and returns a parsed JSON dict.

    If the API key is missing or any error occurs, returns mock_fallback instead.
    Gemini is configured via GEMINI_API_KEY — Vertex AI is not used.

    Includes automatic exponential-backoff retry on 429 rate-limit errors so that
    free-tier quota bursts don't immediately fall back to mock data.

    Args:
        prompt:        The full text prompt to send to Gemini.
        mock_fallback: A dict matching the expected response schema, used on failure.
        enable_search: If True, enables Google Search grounding for real-time data.

    Returns:
        Parsed JSON dict from Gemini, or mock_fallback on any failure.
    """
    if not _key_valid or not client:
        print("Using mock fallback (GEMINI_API_KEY not configured).")
        return mock_fallback

    # Configure generation tools (search grounding if requested)
    tools = []
    if enable_search:
        tools.append({"google_search": {}})

    generation_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.2,
        tools=tools if tools else None,
    )

    try:
        try:
            text_content = _generate_with_retry(prompt, generation_config, " [with search]" if enable_search else "")
        except Exception as tool_err:
            if enable_search and not _is_rate_limit_error(tool_err):
                # Grounding tool rejected or failed (not a rate-limit) — retry without it
                logger.info(f"Gemini search-grounding failed, retrying without it. Reason: {tool_err}")
                generation_config.tools = None
                text_content = _generate_with_retry(prompt, generation_config)
            elif enable_search and _is_rate_limit_error(tool_err):
                # Rate-limited even after retries with search — try one last round without search
                logger.info("Rate-limited with search grounding. Retrying without search...")
                generation_config.tools = None
                text_content = _generate_with_retry(prompt, generation_config)
            else:
                raise

        # Strip markdown code fences if the model wrapped the JSON
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        elif text_content.startswith("```"):
            text_content = text_content[3:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]

        return json.loads(text_content.strip())

    except Exception as e:
        logger.error(f"Gemini API call failed after retries — using mock fallback. Error: {e}")
        return mock_fallback
