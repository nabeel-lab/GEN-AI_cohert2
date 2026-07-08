import logging
from typing import List
from models import SupplyChainItem
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.supply_chain_agent")

def get_supply_chain(business_type: str, location: str = "") -> List[SupplyChainItem]:
    """
    Uses Gemini to generate realistic supply chain items and risks.
    """
    prompt = f"""
    You are a Supply Chain Expert for LaunchWise AI.
    The user wants to open a {business_type} in {location}.

    Identify 3 major supply chain categories required to run this business.
    For each category, provide:
    1. category (e.g., "Raw Ingredients", "Fitness Equipment")
    2. suppliers (list of 2-3 types of local/national suppliers)
    3. risk_level (String: "Low", "Medium", or "High")

    Respond STRICTLY in JSON format matching this schema:
    {{
        "supply_chain": [
            {{
                "category": "...",
                "suppliers": ["...", "..."],
                "risk_level": "Medium"
            }}, ... (exactly 3)
        ]
    }}
    """

    mock_fallback = {
        "supply_chain": [
            {
                "category": "Basic Supplies",
                "suppliers": ["Local wholesale", "National distributors"],
                "risk_level": "Low"
            }
        ]
    }

    logger.info(f"Generating supply chain for {business_type} in {location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    try:
        return [SupplyChainItem(**s) for s in result.get("supply_chain", mock_fallback["supply_chain"])]
    except Exception as e:
        logger.error(f"Error parsing Gemini response for supply chain: {e}")
        return [SupplyChainItem(**s) for s in mock_fallback["supply_chain"]]
