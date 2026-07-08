import logging
from models import LocationMetrics
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.location_agent")

def analyze_location(
    location_str: str,
    business_type: str,
    precise_lat: float = None,
    precise_lng: float = None,
) -> LocationMetrics:
    """
    Uses Gemini with Google Search Grounding to score the real location.
    """
    prompt = f"""
    You are a Location Intelligence Expert for LaunchWise AI.
    Analyze the location "{location_str}" for opening a "{business_type}".

    Use Google Search to find out about the footfall, competition density, accessibility, and growth potential of this specific area.
    
    Score each of the following on a scale of 0 to 100:
    1. footfall_score (higher is busier)
    2. competition_density (higher means more existing businesses of this type)
    3. accessibility_score (higher means better roads, parking, transit)
    4. growth_potential (higher means upcoming area)

    Respond STRICTLY in JSON format matching this schema:
    {{
        "footfall_score": 85,
        "competition_density": 60,
        "accessibility_score": 90,
        "growth_potential": 75
    }}
    """

    mock_fallback = {
        "footfall_score": 80,
        "competition_density": 60,
        "accessibility_score": 75,
        "growth_potential": 85
    }

    logger.info(f"Analyzing location {location_str} for {business_type}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=True)

    # Use the precise lat/lng if provided, otherwise default to a general center
    latitude = precise_lat if precise_lat is not None else 17.3850 # Default Hyderabad
    longitude = precise_lng if precise_lng is not None else 78.4867 # Default Hyderabad

    try:
        return LocationMetrics(
            footfall_score=int(result.get("footfall_score", mock_fallback["footfall_score"])),
            competition_density=int(result.get("competition_density", mock_fallback["competition_density"])),
            accessibility_score=int(result.get("accessibility_score", mock_fallback["accessibility_score"])),
            growth_potential=int(result.get("growth_potential", mock_fallback["growth_potential"])),
            latitude=latitude,
            longitude=longitude,
        )
    except Exception as e:
        logger.error(f"Error parsing Gemini response for location: {e}")
        return LocationMetrics(
            footfall_score=mock_fallback["footfall_score"],
            competition_density=mock_fallback["competition_density"],
            accessibility_score=mock_fallback["accessibility_score"],
            growth_potential=mock_fallback["growth_potential"],
            latitude=latitude,
            longitude=longitude,
        )
