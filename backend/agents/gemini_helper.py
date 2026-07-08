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


def _is_billing_exhausted_error(error: Exception) -> bool:
    """
    Distinguishes a PERMANENT billing wall (prepayment credits depleted / no
    quota on this plan) from a TRANSIENT per-minute rate limit. Google returns
    429 RESOURCE_EXHAUSTED for both, but only the transient case is worth an
    exponential-backoff retry — retrying a depleted-credits error just burns
    ~75s per call (5+10+20+40) for a request that can never succeed until the
    account is topped up. Detected once per process and cached so every
    subsequent agent call in the same run skips retries immediately instead
    of re-discovering the same permanent failure one at a time.
    """
    err_str = str(error).lower()
    return any(phrase in err_str for phrase in (
        "prepayment credits are depleted",
        "exceeded your current quota",
        "check your plan and billing",
    ))


# Set once a billing-exhausted error is seen — every other agent call in this
# process then skips the retry ladder immediately instead of independently
# rediscovering the same permanent failure through a full 75s backoff each.
_billing_exhausted_seen = False


def _generate_with_retry(prompt: str, generation_config, attempt_label: str = "") -> str:
    """
    Internal helper: calls Gemini with automatic exponential-backoff retry
    on transient 429 rate-limit errors. Returns the raw text response.

    Does NOT retry a billing/quota-exhausted 429 (depleted prepayment credits,
    plan quota exceeded) — that's a permanent wall, not a transient limit, so
    retrying it just burns ~75s per call for a request that can never succeed
    until the account is topped up. Fails fast to mock fallback instead.
    """
    global _billing_exhausted_seen
    last_err = None
    max_attempts = 1 if _billing_exhausted_seen else MAX_RETRIES + 1
    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=generation_config,
            )
            return response.text.strip()
        except Exception as e:
            last_err = e
            if _is_billing_exhausted_error(e):
                if not _billing_exhausted_seen:
                    logger.error(
                        f"[Gemini] Billing/quota exhausted — will skip retries for the "
                        f"rest of this run. Add credits at https://ai.studio/projects. Error: {e}"
                    )
                _billing_exhausted_seen = True
                raise
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
