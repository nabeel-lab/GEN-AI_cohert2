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

    try:
        # Google Search grounding — uses legacy SDK tool format for google-generativeai 0.7.x
        tools = [{"google_search_retrieval": {}}] if enable_search else None

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            tools=tools
        )

        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }

        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        text_content = response.text.strip()

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
