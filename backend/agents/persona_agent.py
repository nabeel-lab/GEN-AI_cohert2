import logging
from typing import List
from models import CustomerPersona
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.persona_agent")

def get_personas(business_type: str, location: str = "") -> List[CustomerPersona]:
    """
    Uses Gemini to generate realistic target customer personas for the specific business.
    """
    prompt = f"""
    You are a Customer Persona Expert for LaunchWise AI.
    The user wants to open a {business_type} in {location}.

    Create 3 distinct, realistic customer personas that would frequent this business in this specific area.

    For each persona, provide:
    1. name (e.g., "Wired WFH Vikram")
    2. demographics (dict with age, occupation, income)
    3. behaviors (list of 3 strings)
    4. pain_points (list of 3 strings)
    5. needs (list of 3 strings)

    Respond STRICTLY in JSON format matching this schema:
    {{
        "personas": [
            {{
                "name": "...",
                "demographics": {{"age": "...", "occupation": "...", "income": "..."}},
                "behaviors": ["...", "...", "..."],
                "pain_points": ["...", "...", "..."],
                "needs": ["...", "...", "..."]
            }}, ... (exactly 3)
        ]
    }}
    """

    mock_fallback = {
        "personas": [
            {
                "name": "Standard Customer 1",
                "demographics": {"age": "25-35", "occupation": "Professional", "income": "Medium-High"},
                "behaviors": ["Visits regularly", "Values convenience", "Quality conscious"],
                "pain_points": ["Lack of time", "Inconsistent quality", "Poor service"],
                "needs": ["Speed", "Reliability", "Good ambience"]
            }
        ]
    }

    logger.info(f"Generating personas for {business_type} in {location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    try:
        return [CustomerPersona(**p) for p in result.get("personas", mock_fallback["personas"])]
    except Exception as e:
        logger.error(f"Error parsing Gemini response for personas: {e}")
        return [CustomerPersona(**p) for p in mock_fallback["personas"]]
