import logging
from models import RiskReport
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.risk_agent")

def evaluate_risk(business_type: str, budget: float, competition_density: int, location: str = "") -> RiskReport:
    """
    Uses Gemini to evaluate risk based on specific location, budget, and competition.
    """
    prompt = f"""
    You are a Risk Assessment Expert for LaunchWise AI.
    The user wants to open a {business_type} in {location} with a budget of INR {budget}.
    The local competition density score is {competition_density}/100.

    Analyze the operational and market risks specific to this setup.
    Calculate a risk_score from 0 to 100 (where 100 is extremely risky).
    Determine a risk_level ("Low", "Medium", "High").
    Provide 3 concrete mitigations.

    Respond STRICTLY in JSON format matching this schema:
    {{
        "risk_score": 65,
        "risk_level": "Medium",
        "mitigations": ["...", "...", "..."]
    }}
    """

    mock_fallback = {
        "risk_score": 50,
        "risk_level": "Medium",
        "mitigations": [
            "Maintain a 3-month cash runway",
            "Start with a lean team",
            "Monitor local competition pricing"
        ]
    }

    logger.info(f"Evaluating risk for {business_type} in {location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    try:
        return RiskReport(
            risk_score=int(result.get("risk_score", mock_fallback["risk_score"])),
            risk_level=str(result.get("risk_level", mock_fallback["risk_level"])),
            mitigations=list(result.get("mitigations", mock_fallback["mitigations"]))
        )
    except Exception as e:
        logger.error(f"Error parsing Gemini response for risk: {e}")
        return RiskReport(**mock_fallback)
