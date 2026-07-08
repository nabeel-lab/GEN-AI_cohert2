import logging
from typing import List
from models import MarketingCampaign
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.marketing_agent")

def get_marketing(business_type: str, location: str = "") -> List[MarketingCampaign]:
    """
    Uses Gemini to generate localized marketing strategies.
    """
    prompt = f"""
    You are a Marketing Expert for LaunchWise AI.
    The user wants to open a {business_type} in {location}.

    Recommend 3 effective marketing campaigns/strategies tailored for this specific business and location.
    For each campaign, provide:
    1. channel (e.g., "Instagram Reels", "Local B2B Partnerships")
    2. strategy (1-2 sentences explaining what to do)
    3. difficulty (String: "Low", "Medium", or "High")

    Respond STRICTLY in JSON format matching this schema:
    {{
        "marketing": [
            {{
                "channel": "...",
                "strategy": "...",
                "difficulty": "Low"
            }}, ... (exactly 3)
        ]
    }}
    """

    mock_fallback = {
        "marketing": [
            {
                "channel": "Social Media (Instagram/Facebook)",
                "strategy": "Run localized ads targeting a 5km radius.",
                "difficulty": "Low"
            }
        ]
    }

    logger.info(f"Generating marketing for {business_type} in {location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    try:
        return [MarketingCampaign(**m) for m in result.get("marketing", mock_fallback["marketing"])]
    except Exception as e:
        logger.error(f"Error parsing Gemini response for marketing: {e}")
        return [MarketingCampaign(**m) for m in mock_fallback["marketing"]]
