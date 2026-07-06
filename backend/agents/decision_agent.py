from models import (
    BusinessProfile, MarketReport, CompetitorReport, LocationMetrics,
    EconomicReport, RiskReport, DecisionReport
)
from agents.gemini_helper import call_gemini_json


def make_decision(
    profile: BusinessProfile,
    market: MarketReport,
    competitors: CompetitorReport,
    location: LocationMetrics,
    finance: EconomicReport,
    risk: RiskReport
) -> DecisionReport:
    """
    Calls Gemini 1.5 Flash to synthesize all agent reports into a final
    Go/No-Go business decision with actionable recommendations.
    Falls back to a rule-based verdict if the API call fails.
    """

    # Serialize key metrics into a compact summary for the prompt
    finance_summary = (
        f"Break-even in {finance.break_even_months} months. "
        f"Month-6 revenue: INR {finance.projected_revenue_month_6:,.0f}. "
        f"Month-12 revenue: INR {finance.projected_revenue_month_12:,.0f}. "
        f"Projected ROI: {finance.roi_percentage:.1f}%."
    )

    location_summary = (
        f"Footfall score: {location.footfall_score}/100. "
        f"Competition density: {location.competition_density}/100. "
        f"Accessibility: {location.accessibility_score}/100. "
        f"Growth potential: {location.growth_potential}/100."
    )

    competitor_gap = competitors.gap_opportunity

    prompt = f"""
    You are a senior venture analyst and startup strategy consultant.
    You have received the following intelligence reports for a pre-launch business.
    Synthesize all data and return a final Go/No-Go investment decision.

    --- BUSINESS PROFILE ---
    Type: {profile.business_type}
    Unique Value: {profile.unique_value}
    Key Risks: {', '.join(profile.risks)}

    --- MARKET INTELLIGENCE ---
    Demand Score: {market.demand_score}/100
    Trend: {market.trend}
    Top Trends: {', '.join(market.top_3_trends)}
    Market Size: {market.market_size_estimate}

    --- COMPETITOR INTELLIGENCE ---
    Gap Opportunity: {competitor_gap}
    SWOT Strengths: {', '.join(competitors.swot.get('strengths', []))}
    SWOT Threats: {', '.join(competitors.swot.get('threats', []))}

    --- LOCATION INTELLIGENCE ---
    {location_summary}

    --- FINANCIAL PROJECTIONS ---
    {finance_summary}

    --- RISK ASSESSMENT ---
    Risk Score: {risk.risk_score}/100 ({risk.risk_level} risk)
    Mitigations needed: {', '.join(risk.mitigations)}

    Based on ALL of the above data, produce a final decision report.
    You must respond with ONLY a valid JSON object. No markdown, no explanation.

    JSON Schema:
    {{
        "go_no_go": "<exactly one of: GO, NO GO, PROCEED WITH CAUTION>",
        "confidence_score": <integer 0-100 representing your confidence in this verdict>,
        "business_health_score": <integer 0-100 overall business viability score>,
        "top_3_recommendations": [
            "<Specific, actionable recommendation 1 based on the data above>",
            "<Specific, actionable recommendation 2>",
            "<Specific, actionable recommendation 3>"
        ],
        "next_steps": {{
            "now": ["<Immediate action 1>", "<Immediate action 2>"],
            "3_months": ["<Action in first 3 months 1>", "<Action in first 3 months 2>"],
            "6_months": ["<Action by month 6 1>", "<Action by month 6 2>"],
            "1_year": ["<Action by year 1 1>", "<Action by year 1 2>"]
        }}
    }}
    """

    # Rule-based fallback: compute health score from available metrics
    raw_health = int(
        (market.demand_score * 0.30) +
        ((100 - risk.risk_score) * 0.25) +
        (location.footfall_score * 0.20) +
        (location.growth_potential * 0.15) +
        (min(100, max(0, 50 + finance.roi_percentage)) * 0.10)
    )
    health_score = min(100, max(10, raw_health))

    if health_score >= 70:
        verdict = "GO"
    elif health_score >= 45:
        verdict = "PROCEED WITH CAUTION"
    else:
        verdict = "NO GO"

    mock_fallback = {
        "go_no_go": verdict,
        "confidence_score": 80,
        "business_health_score": health_score,
        "top_3_recommendations": [
            f"Leverage the identified market gap: {competitor_gap[:120]}",
            f"Address the highest risk factor first: {risk.mitigations[0] if risk.mitigations else 'Build an emergency cash reserve of 20% of total budget'}",
            f"Prioritize digital presence from day one — 60%+ of {profile.business_type} customers discover via Google Maps and Instagram"
        ],
        "next_steps": {
            "now": [
                "Complete business entity registration and secure all required local permits",
                "Finalize location lease and conduct competitor price benchmarking"
            ],
            "3_months": [
                "Complete interior setup and hire core operational staff",
                "Launch pre-opening social media campaign and collect early sign-ups"
            ],
            "6_months": [
                "Achieve break-even trajectory by optimizing top revenue channels",
                "Launch first customer loyalty or referral program"
            ],
            "1_year": [
                "Audit full P&L against initial financial projections",
                "Evaluate expansion or second location feasibility"
            ]
        }
    }

    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    # Validate go_no_go is one of the accepted values
    valid_verdicts = {"GO", "NO GO", "PROCEED WITH CAUTION"}
    go_no_go = result.get("go_no_go", mock_fallback["go_no_go"]).strip().upper()
    if go_no_go not in valid_verdicts:
        go_no_go = mock_fallback["go_no_go"]

    # Validate next_steps keys exist, fill missing ones from fallback
    next_steps_raw = result.get("next_steps", {})
    next_steps = {
        "now":        next_steps_raw.get("now",        mock_fallback["next_steps"]["now"]),
        "3_months":   next_steps_raw.get("3_months",   mock_fallback["next_steps"]["3_months"]),
        "6_months":   next_steps_raw.get("6_months",   mock_fallback["next_steps"]["6_months"]),
        "1_year":     next_steps_raw.get("1_year",     mock_fallback["next_steps"]["1_year"]),
    }

    return DecisionReport(
        go_no_go=go_no_go,
        confidence_score=int(result.get("confidence_score", mock_fallback["confidence_score"])),
        business_health_score=int(result.get("business_health_score", mock_fallback["business_health_score"])),
        top_3_recommendations=result.get("top_3_recommendations", mock_fallback["top_3_recommendations"]),
        next_steps=next_steps
    )
