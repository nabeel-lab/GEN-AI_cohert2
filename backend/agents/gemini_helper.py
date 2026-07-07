import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=_root_env, override=False)

# ── Gemini AI Studio configuration ──────────────────────────────────────────
# Uses Google AI Studio API key — NOT Vertex AI.
# Key is read from GEMINI_API_KEY environment variable.
api_key = os.getenv("GEMINI_API_KEY")

_PLACEHOLDER = "YOUR_GEMINI_API_KEY_HERE"
_key_valid = bool(api_key and api_key.strip() and api_key != _PLACEHOLDER)

if _key_valid:
    genai.configure(api_key=api_key)
    print("Gemini AI Studio API configured successfully.")
else:
    print("WARNING: GEMINI_API_KEY missing or not set. Gemini calls will use mock fallbacks.")


def call_gemini_json(prompt: str, mock_fallback: dict, enable_search: bool = False) -> dict:
    """
    Calls Gemini 1.5 Flash via Google AI Studio and returns a parsed JSON dict.

    If the API key is missing or any error occurs, returns mock_fallback instead.
    Gemini is configured via GEMINI_API_KEY — Vertex AI is not used.

    Args:
        prompt:        The full text prompt to send to Gemini.
        mock_fallback: A dict matching the expected response schema, used on failure.
        enable_search: If True, enables Google Search grounding for real-time data.

    Returns:
        Parsed JSON dict from Gemini, or mock_fallback on any failure.
    """
    if not _key_valid:
        print("Using mock fallback (GEMINI_API_KEY not configured).")
        return mock_fallback

    generation_config = {
        "response_mime_type": "application/json",
        "temperature": 0.2
    }

    def _generate(use_search: bool):
        # Google Search grounding tool — the installed google-generativeai==0.7.2
        # SDK's Tool proto only exposes `function_declarations`/`code_execution`
        # (verified via glm.Tool()); it has no `google_search_retrieval` field,
        # so passing it always raises "Unknown field for FunctionDeclaration".
        # Grounding requires either upgrading to a newer SDK/tool schema, or
        # Vertex AI — out of scope for a same-behavior fix. We still attempt it
        # (in case a future SDK bump adds support) but always have a fallback.
        tools = [{"google_search_retrieval": {}}] if use_search else None
        model = genai.GenerativeModel(model_name="gemini-1.5-flash", tools=tools)
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text.strip()

    try:
        try:
            text_content = _generate(enable_search)
        except Exception as tool_err:
            if enable_search:
                # Grounding tool rejected by this SDK — retry without it so the
                # call still gets a live Gemini answer instead of a full mock.
                print(f"Gemini search-grounding unavailable on this SDK, retrying without it. Reason: {tool_err}")
                text_content = _generate(False)
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
        print(f"Gemini API call failed — using mock fallback. Error: {e}")
        return mock_fallback
