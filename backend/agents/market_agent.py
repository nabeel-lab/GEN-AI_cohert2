from models import AnalysisRequest, MarketReport
from agents.gemini_helper import call_gemini_json


def run_market_analysis(request: AnalysisRequest) -> MarketReport:
    """
    Calls Gemini 1.5 Flash with Google Search grounding to generate
    a real-time market intelligence report for the given business type
    and location. Falls back to structured mock data if the API call fails.
    """

    prompt = f"""
    You are a senior market research analyst with deep expertise in Indian SME markets.
    Analyze current market conditions for the following business opportunity and respond
    with a structured JSON report.

    Business Type: {request.business_type}
    Target Location: {request.location}
    Launch Budget: INR {request.budget:,.2f}
    Business Description: {request.description}

    Use Google Search to find current 2025 market trends, demand signals, and consumer
    behavior data relevant to this business type in this Indian city/region.

    You must respond with ONLY a valid JSON object. No markdown, no explanation.

    JSON Schema:
    {{
        "demand_score": <integer 0-100 representing current local market demand>,
        "trend": "<one of: growing, stable, declining>",
        "top_3_trends": [
            "<Current market trend 1 specific to this business type in India>",
            "<Current market trend 2>",
            "<Current market trend 3>"
        ],
        "seasonality": "<Describe seasonal demand patterns for this business in India>",
        "market_size_estimate": "<Estimated local micro-market size in INR Crores>",
        "detailed_analysis": "<2-3 sentence synthesis of why this market is attractive or challenging for this specific business type in {request.location}>"
    }}
    """

    # Structured mock fallback — mirrors MarketReport schema exactly
    mock_fallback = {
        "demand_score": 78,
        "trend": "growing",
        "top_3_trends": [
            f"Rapid consumer adoption of premium {request.business_type} offerings in Tier-1 Indian cities",
            "Strong post-pandemic demand for experiential local retail and dining",
            "Digital discovery via Instagram and Google Maps driving 60%+ of new footfall"
        ],
        "seasonality": (
            "Moderate dip during summer months (April–June), strong peak demand during "
            "festive season (October–December) and year-end holidays"
        ),
        "market_size_estimate": f"INR 8–15 Crores estimated micro-market in {request.location}",
        "detailed_analysis": (
            f"The {request.business_type} segment in {request.location} shows consistent growth "
            f"driven by a young, high-income urban demographic with strong discretionary spending. "
            f"A well-differentiated launch with digital presence can capture significant early market share."
        )
    }

    # Call Gemini with Google Search grounding enabled
    result = call_gemini_json(prompt, mock_fallback, enable_search=True)

    return MarketReport(
        demand_score=int(result.get("demand_score", mock_fallback["demand_score"])),
        trend=result.get("trend", mock_fallback["trend"]),
        top_3_trends=result.get("top_3_trends", mock_fallback["top_3_trends"]),
        seasonality=result.get("seasonality", mock_fallback["seasonality"]),
        market_size_estimate=result.get("market_size_estimate", mock_fallback["market_size_estimate"]),
        detailed_analysis=result.get("detailed_analysis", mock_fallback["detailed_analysis"])
    )
