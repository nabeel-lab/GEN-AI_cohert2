import logging
from models import CompetitorReport
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.competitor_agent")

def analyze_competitors(business_type: str, location: str = "") -> CompetitorReport:
    """
    Uses Gemini with Google Search Grounding to find real competitors in the specified area.
    """
    prompt = f"""
    You are a Competitor Analysis Expert for LaunchWise AI.
    The user wants to open a {business_type} in {location}.
    
    Using Google Search, find 3 REAL, SPECIFIC competitors for this business type in this location. 
    If you cannot find exact matches in {location}, find the closest prominent competitors in the same city.

    For each competitor, provide:
    1. name
    2. rating (float)
    3. price_range (e.g., "INR 500-1000 for two")
    4. strengths (list of 3 strings)
    5. weaknesses (list of 3 strings)
    6. estimated_monthly_revenue (string, e.g., "INR 10,00,000")

    Also provide an overall SWOT analysis for opening a {business_type} in {location}:
    - strengths (list of 3 strings)
    - weaknesses (list of 3 strings)
    - opportunities (list of 3 strings)
    - threats (list of 3 strings)

    And finally, a gap_opportunity (1-2 sentences explaining what the market is missing).

    Respond STRICTLY in JSON format matching this schema:
    {{
        "competitors": [
            {{
                "name": "...",
                "rating": 4.5,
                "price_range": "...",
                "strengths": ["...", "...", "..."],
                "weaknesses": ["...", "...", "..."],
                "estimated_monthly_revenue": "..."
            }}, ... (exactly 3)
        ],
        "swot": {{
            "strengths": ["...", "...", "..."],
            "weaknesses": ["...", "...", "..."],
            "opportunities": ["...", "...", "..."],
            "threats": ["...", "...", "..."]
        }},
        "gap_opportunity": "..."
    }}
    """

    mock_fallback = {
        "competitors": [
            {
                "name": "Standard Local Competitor 1",
                "rating": 4.2,
                "price_range": "Moderate",
                "strengths": ["Established presence", "Loyal customer base", "Good location"],
                "weaknesses": ["Outdated interiors", "Slow service", "High prices"],
                "estimated_monthly_revenue": "INR 5,00,000"
            }
        ],
        "swot": {
            "strengths": ["Growing market", "High margins"],
            "weaknesses": ["High setup cost", "Staff turnover"],
            "opportunities": ["Digital marketing", "Delivery partnerships"],
            "threats": ["Economic downturn", "New entrants"]
        },
        "gap_opportunity": "There is a gap for a modern, tech-enabled competitor in this space."
    }

    logger.info(f"Analyzing competitors for {business_type} in {location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=True)

    try:
        return CompetitorReport(**result)
    except Exception as e:
        logger.error(f"Error parsing Gemini response for competitors: {e}")
        return CompetitorReport(**mock_fallback)
