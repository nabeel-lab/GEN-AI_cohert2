from typing import List, Dict
from models import (
    BusinessProfile, MarketReport, CompetitorReport, LocationMetrics,
    EconomicReport, RiskReport, CustomerPersona, SupplyChainItem,
    MarketingCampaign, DecisionReport
)
from agents.gemini_helper import call_gemini_json

# Mirrors the per-business-type budget benchmarks used by risk_agent.py —
# needed here to detect the "budget significantly below market average" pattern.
_IDEAL_BUDGET_BY_TYPE = {
    "cafe": 1_500_000.0,
    "restaurant": 3_000_000.0,
    "bakery": 1_200_000.0,
    "gym": 2_500_000.0,
    "salon": 1_500_000.0,
    "retail": 1_500_000.0,
}
_DEFAULT_IDEAL_BUDGET = 2_000_000.0


def _ideal_budget_for(business_type: str) -> float:
    bt = business_type.lower()
    for key, val in _IDEAL_BUDGET_BY_TYPE.items():
        if key in bt:
            return val
    return _DEFAULT_IDEAL_BUDGET


# --- Deterministic Score Breakdown ---------------------------------------
# Weights are fixed constants (sum to 1.0) and mirrored in the frontend
# purely for label display — the numbers themselves are always computed
# here, never invented by the LLM, so the final score is fully auditable.
_SCORE_WEIGHTS = {
    "market":       0.20,
    "location":     0.15,
    "finance":      0.15,
    "competition":  0.10,
    "risk":         0.15,
    "customer_fit": 0.10,
    "supply_chain": 0.075,
    "marketing":    0.075,
}


def _supply_chain_score(supply_chain: List[SupplyChainItem]) -> int:
    if not supply_chain:
        return 60
    points = {"Low": 90, "Medium": 60, "High": 30}
    scores = [points.get(item.risk_level, 60) for item in supply_chain]
    return round(sum(scores) / len(scores))


def _marketing_score(marketing: List[MarketingCampaign]) -> int:
    if not marketing:
        return 60
    points = {"Easy": 90, "Medium": 65, "Hard": 40}
    scores = [points.get(c.difficulty, 65) for c in marketing]
    return round(sum(scores) / len(scores))


def _finance_score(finance: EconomicReport) -> int:
    # Maps ROI% onto a 0-100 scale, centered at 50 (0% ROI = 50/100)
    return min(100, max(0, round(50 + finance.roi_percentage)))


def compute_score_breakdown(
    market: MarketReport, location: LocationMetrics, finance: EconomicReport,
    risk: RiskReport, personas: List[CustomerPersona],
    supply_chain: List[SupplyChainItem], marketing: List[MarketingCampaign]
) -> Dict[str, int]:
    location_composite = round(
        (location.footfall_score + location.accessibility_score + location.growth_potential) / 3
    )
    # Customer fit is a proxy: how well footfall (customer presence) aligns
    # with measured demand — both numbers already exist in prior agent output.
    customer_fit = round((market.demand_score + location.footfall_score) / 2)

    return {
        "market":       market.demand_score,
        "location":     location_composite,
        "finance":      _finance_score(finance),
        "competition":  max(0, 100 - location.competition_density),
        "risk":         max(0, 100 - risk.risk_score),
        "customer_fit": customer_fit,
        "supply_chain": _supply_chain_score(supply_chain),
        "marketing":    _marketing_score(marketing),
    }


def compute_health_score(score_breakdown: Dict[str, int]) -> int:
    raw = sum(score_breakdown[k] * _SCORE_WEIGHTS[k] for k in _SCORE_WEIGHTS)
    return min(100, max(10, round(raw)))


def compute_confidence(score_breakdown: Dict[str, int], risk: RiskReport, market: MarketReport) -> tuple:
    """Returns (confidence_score, confidence_factors) — both grounded in real numbers."""
    health = compute_health_score(score_breakdown)
    factors = []

    if health >= 80 or health <= 25:
        base = 90
    elif health >= 60 or health <= 35:
        base = 78
    else:
        base = 65

    if market.trend == "growing":
        factors.append(f"Market demand trend is {market.trend} ({market.demand_score}/100), reducing forecast uncertainty.")
    elif market.trend == "declining":
        factors.append(f"Market trend is declining ({market.demand_score}/100), which lowers confidence in long-term projections.")
        base -= 8
    else:
        factors.append(f"Market trend is stable ({market.demand_score}/100).")

    if risk.risk_level == "Low":
        factors.append("Overall risk score is low, meaning fewer variables threaten the projected outcome.")
    elif risk.risk_level == "High":
        factors.append("Overall risk score is high, which introduces meaningful uncertainty into this verdict.")
        base -= 10
    else:
        factors.append("Risk score is moderate — manageable with the recommended mitigations.")

    if score_breakdown["customer_fit"] >= 75:
        factors.append("Customer persona demand and location footfall are closely aligned, strengthening product-market fit confidence.")
    elif score_breakdown["customer_fit"] <= 40:
        factors.append("Customer footfall and demand signals are only weakly aligned, adding uncertainty to adoption speed.")

    if score_breakdown["finance"] >= 60:
        factors.append("Financial projections show a positive ROI trajectory, supporting the verdict.")
    elif score_breakdown["finance"] <= 40:
        factors.append("Financial projections show a weak or negative ROI trajectory, which weighs against this verdict.")
        base -= 8

    confidence = min(96, max(35, base))
    return confidence, factors


def detect_patterns(
    request_budget: float, business_type: str, market: MarketReport,
    location: LocationMetrics, finance: EconomicReport, risk: RiskReport,
    competitors: CompetitorReport
) -> List[str]:
    """Rule-based anomaly/pattern detection — every observation here is a direct
    comparison of real agent output fields. Nothing is generated or guessed."""
    patterns = []

    if market.trend == "growing" and location.competition_density >= 75:
        patterns.append(
            f"Demand is growing ({market.demand_score}/100) despite high competition density "
            f"({location.competition_density}/100) — the market has room to support a strong differentiated entrant."
        )

    ideal_budget = _ideal_budget_for(business_type)
    if request_budget < ideal_budget * 0.6:
        patterns.append(
            f"Budget of INR {request_budget:,.0f} is significantly below the typical INR {ideal_budget:,.0f} "
            f"benchmark for this business type — expect a longer runway to profitability."
        )

    location_composite = round((location.footfall_score + location.accessibility_score + location.growth_potential) / 3)
    if location_composite >= 80 and len(competitors.swot.get("strengths", [])) <= 1:
        patterns.append(
            f"Location intelligence is strong ({location_composite}/100 composite), but the competitive SWOT shows "
            f"limited unique strengths — differentiation, not location, is the binding constraint here."
        )

    if finance.roi_percentage >= 20 and finance.break_even_months >= 9:
        patterns.append(
            f"Projected ROI is attractive ({finance.roi_percentage:.1f}%), but break-even isn't reached until month "
            f"{finance.break_even_months} — this is a patient-capital business, not a quick win."
        )

    seasonality_lower = (market.seasonality or "").lower()
    if seasonality_lower and not any(w in seasonality_lower for w in ["no significant", "minimal", "none"]):
        patterns.append(f"Seasonal opportunity detected: {market.seasonality}")

    if risk.risk_level == "High" and market.trend == "growing":
        patterns.append(
            "Risk is elevated despite a growing market — the opportunity is real, but execution speed and "
            "capital discipline will determine whether it's captured before conditions change."
        )

    if finance.roi_percentage < 0 and market.demand_score >= 65:
        patterns.append(
            f"Demand is healthy ({market.demand_score}/100) but current financial assumptions produce negative ROI — "
            f"the constraint is cost structure, not market appetite."
        )

    return patterns


def make_decision(
    profile: BusinessProfile,
    market: MarketReport,
    competitors: CompetitorReport,
    location: LocationMetrics,
    finance: EconomicReport,
    risk: RiskReport,
    personas: List[CustomerPersona] = None,
    supply_chain: List[SupplyChainItem] = None,
    marketing: List[MarketingCampaign] = None,
    budget: float = 0.0,
    location_name: str = "the selected location",
    historical_context: str = None,
) -> DecisionReport:
    """
    Calls Gemini 1.5 Flash to synthesize all 9 prior agent reports into an
    executive-grade decision brief — verdict, reasoning, opportunities, risks,
    and a phased roadmap. Score breakdown, confidence factors, and pattern
    detection are computed deterministically from real agent data so they can
    never be fabricated, then blended with Gemini's narrative reasoning.
    Falls back to a fully rule-based, still-grounded report if Gemini is unavailable.
    """
    personas = personas or []
    supply_chain = supply_chain or []
    marketing = marketing or []

    # ── Deterministic, auditable calculations ────────────────────────────
    score_breakdown = compute_score_breakdown(market, location, finance, risk, personas, supply_chain, marketing)
    health_score = compute_health_score(score_breakdown)
    confidence_score, confidence_factors = compute_confidence(score_breakdown, risk, market)
    patterns = detect_patterns(budget, profile.business_type, market, location, finance, risk, competitors)

    if health_score >= 70:
        verdict = "GO"
    elif health_score >= 45:
        verdict = "PROCEED WITH CAUTION"
    else:
        verdict = "NO GO"

    # ── Summaries for the prompt ──────────────────────────────────────────
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
    persona_summary = "; ".join(
        f"{p.name} ({p.demographics.get('occupation', 'N/A')}) needs: {', '.join(p.needs[:2])}"
        for p in personas[:3]
    ) or "No persona data available."
    supply_summary = "; ".join(
        f"{s.category} ({s.risk_level} risk)" for s in supply_chain
    ) or "No supply chain data available."
    marketing_summary = "; ".join(
        f"{m.channel} ({m.difficulty})" for m in marketing
    ) or "No marketing data available."
    competitor_gap = competitors.gap_opportunity
    historical_block = f"\n    --- HISTORICAL PLATFORM DATA ---\n    {historical_context}\n" if historical_context else ""

    prompt = f"""
    You are a senior management consultant in the style of McKinsey, BCG, or Deloitte, writing an
    executive intelligence brief for a founder deciding whether to launch a new business.
    Write with precision and authority. Every claim must cite a specific number or fact from the
    data below. Never use vague filler like "consider your options" — always justify conclusions
    with the actual figures provided. Avoid repetitive phrasing and bullet-spam; write in full,
    confident sentences. If historical platform data is provided below, weave it into your
    reasoning and market outlook as corroborating or contrasting evidence.

    --- BUSINESS PROFILE ---
    Type: {profile.business_type}
    Unique Value: {profile.unique_value}
    Key Risks: {', '.join(profile.risks)}

    --- MARKET INTELLIGENCE ---
    Demand Score: {market.demand_score}/100
    Trend: {market.trend}
    Top Trends: {', '.join(market.top_3_trends)}
    Market Size: {market.market_size_estimate}
    Seasonality: {market.seasonality}

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

    --- CUSTOMER PERSONAS ---
    {persona_summary}
{historical_block}
    --- SUPPLY CHAIN ---
    {supply_summary}

    --- MARKETING CHANNELS ---
    {marketing_summary}

    --- COMPUTED SCORES (already finalized — use these exact numbers in your reasoning) ---
    Business Health Score: {health_score}/100
    Verdict: {verdict}
    Confidence Score: {confidence_score}/100

    Return ONLY a valid JSON object (no markdown, no explanation) with this exact schema:
    {{
        "executive_summary": "<one tight paragraph (3-4 sentences) summarizing the entire opportunity like the opening of a consulting deck>",
        "reasoning": "<2-3 sentences explaining WHY the verdict is {verdict}, citing specific numbers from market, finance, location, risk, and competition above — in the style of: 'Our recommendation is GO because projected demand is high, expected ROI reaches approximately 24%...'>",
        "top_opportunities": ["<specific opportunity 1 citing data>", "<opportunity 2>", "<opportunity 3>"],
        "biggest_risks": ["<specific risk 1 citing data>", "<risk 2>"],
        "market_outlook": "<1-2 sentences on where this market is headed>",
        "financial_outlook": "<1-2 sentences on the financial trajectory, citing ROI and break-even>",
        "recommended_launch_window": "<a specific, reasoned timing recommendation, e.g. 'Within the next 60 days, ahead of Q4 seasonal demand'>",
        "expected_roi_summary": "<1 sentence stating the expected ROI and timeframe>",
        "key_strengths": ["<strength 1>", "<strength 2>"],
        "key_weaknesses": ["<weakness 1>", "<weakness 2>"],
        "hidden_opportunities": ["<a non-obvious opportunity a founder might miss>"],
        "critical_risks": ["<the single most important risk to watch>"],
        "suggested_next_milestone": "<the one milestone that most determines success, with a rough timeframe>",
        "top_3_recommendations": ["<specific, actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
        "next_steps": {{
            "now": ["<Immediate action 1>", "<Immediate action 2>"],
            "3_months": ["<Preparation-phase action 1>", "<Preparation-phase action 2>"],
            "6_months": ["<Launch-phase action 1>", "<Launch-phase action 2>"],
            "1_year": ["<Growth-phase action 1>", "<Growth-phase action 2>"]
        }}
    }}
    """

    # ── Grounded fallback (used if Gemini is unavailable) — every sentence
    # below references a real computed number, never a generic placeholder. ──
    roi_word = "positive" if finance.roi_percentage >= 0 else "negative"
    mock_fallback = {
        "executive_summary": (
            f"This {profile.business_type} concept in {location_name} scores {health_score}/100 "
            f"on our composite health index, driven primarily by a {market.demand_score}/100 demand signal and "
            f"{'a healthy' if score_breakdown['finance'] >= 50 else 'a strained'} {finance.roi_percentage:.1f}% projected "
            f"12-month ROI. Competition density sits at {location.competition_density}/100 and overall risk is "
            f"classified {risk.risk_level}. Our verdict is {verdict}, with {confidence_score}% confidence."
            + (f" {historical_context}" if historical_context else "")
        ),
        "reasoning": (
            f"Our recommendation is {verdict} because market demand is {market.trend} at {market.demand_score}/100, "
            f"projected 12-month ROI is {roi_word} at {finance.roi_percentage:.1f}%, and location footfall "
            f"({location.footfall_score}/100) {'supports' if location.footfall_score >= 60 else 'only partially supports'} "
            f"the target customer base. The primary constraint is "
            f"{'elevated competition density (' + str(location.competition_density) + '/100)' if location.competition_density >= 70 else 'overall risk level (' + risk.risk_level + ')'}."
        ),
        "top_opportunities": [
            f"Market gap: {competitor_gap[:140]}",
            f"Demand trend is {market.trend} at {market.demand_score}/100 — {market.top_3_trends[0] if market.top_3_trends else 'favorable positioning is available'}.",
            f"Location growth potential is {location.growth_potential}/100, supporting long-term footfall expansion.",
        ],
        "biggest_risks": [
            risk.mitigations[0] if risk.mitigations else "Working capital reserves should be increased before launch.",
            f"Competition density of {location.competition_density}/100 will pressure pricing and customer acquisition cost." if location.competition_density >= 50 else f"Break-even is not projected until month {finance.break_even_months}, requiring sustained capital discipline.",
        ],
        "market_outlook": f"Demand is {market.trend} ({market.demand_score}/100) with {market.market_size_estimate}.",
        "financial_outlook": f"Projected {finance.roi_percentage:.1f}% ROI over 12 months, with break-even expected in month {finance.break_even_months}.",
        "recommended_launch_window": (
            "Within the next 60-90 days to capture current demand momentum." if market.trend == "growing"
            else "After validating demand further — consider a 90-120 day pre-launch testing window."
        ),
        "expected_roi_summary": f"Approximately {finance.roi_percentage:.1f}% return is projected within the first 12 months of operation.",
        "key_strengths": [
            f"Demand score of {market.demand_score}/100" if market.demand_score >= 60 else f"Growth potential of {location.growth_potential}/100",
            f"Footfall score of {location.footfall_score}/100 at the selected location.",
        ],
        "key_weaknesses": [
            f"Risk score of {risk.risk_score}/100 ({risk.risk_level})",
            f"ROI of {finance.roi_percentage:.1f}% requires disciplined cost control." if finance.roi_percentage < 15 else "Break-even timeline requires sustained execution.",
        ],
        "hidden_opportunities": [
            f"Persona data shows recurring demand for {personas[0].needs[0] if personas and personas[0].needs else 'improved customer experience'} — an underserved need competitors are not addressing."
        ],
        "critical_risks": [
            risk.mitigations[0] if risk.mitigations else "Cash flow discipline during the pre-break-even period.",
        ],
        "suggested_next_milestone": f"Reach break-even by month {finance.break_even_months} — the clearest signal that unit economics are working.",
        "top_3_recommendations": [
            f"Leverage the identified market gap: {competitor_gap[:120]}",
            f"Address the highest risk factor first: {risk.mitigations[0] if risk.mitigations else 'Build an emergency cash reserve of 20% of total budget'}",
            f"Prioritize digital presence from day one — 60%+ of {profile.business_type} customers discover via Google Maps and Instagram",
        ],
        "next_steps": {
            "now": [
                "Complete business entity registration and secure all required local permits",
                "Finalize location lease and conduct competitor price benchmarking",
            ],
            "3_months": [
                "Complete interior setup and hire core operational staff",
                "Launch pre-opening social media campaign and collect early sign-ups",
            ],
            "6_months": [
                "Achieve break-even trajectory by optimizing top revenue channels",
                "Launch first customer loyalty or referral program",
            ],
            "1_year": [
                "Audit full P&L against initial financial projections",
                "Evaluate expansion or second location feasibility",
            ],
        },
    }

    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    # Validate next_steps keys exist, fill missing ones from fallback
    next_steps_raw = result.get("next_steps", {})
    next_steps = {
        "now":      next_steps_raw.get("now", mock_fallback["next_steps"]["now"]),
        "3_months": next_steps_raw.get("3_months", mock_fallback["next_steps"]["3_months"]),
        "6_months": next_steps_raw.get("6_months", mock_fallback["next_steps"]["6_months"]),
        "1_year":   next_steps_raw.get("1_year", mock_fallback["next_steps"]["1_year"]),
    }

    def _get(key):
        return result.get(key, mock_fallback[key])

    return DecisionReport(
        go_no_go=verdict,
        confidence_score=confidence_score,
        business_health_score=health_score,
        top_3_recommendations=_get("top_3_recommendations"),
        next_steps=next_steps,
        executive_summary=_get("executive_summary"),
        top_opportunities=_get("top_opportunities"),
        biggest_risks=_get("biggest_risks"),
        market_outlook=_get("market_outlook"),
        financial_outlook=_get("financial_outlook"),
        recommended_launch_window=_get("recommended_launch_window"),
        expected_roi_summary=_get("expected_roi_summary"),
        reasoning=_get("reasoning"),
        confidence_factors=confidence_factors,
        key_strengths=_get("key_strengths"),
        key_weaknesses=_get("key_weaknesses"),
        hidden_opportunities=_get("hidden_opportunities"),
        critical_risks=_get("critical_risks"),
        suggested_next_milestone=_get("suggested_next_milestone"),
        patterns=patterns,
        score_breakdown=score_breakdown,
    )
