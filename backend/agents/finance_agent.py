import logging
from models import AnalysisRequest, EconomicReport, ForecastItem
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.finance_agent")

def get_finance(
    request: AnalysisRequest,
    rent_override: float = None,
    marketing_multiplier: float = 1.0,
) -> EconomicReport:
    """
    Uses Gemini to get realistic baseline cost estimates for the specific location,
    then applies the S-curve growth model over 12 months.
    """
    prompt = f"""
    You are a Financial Expert for LaunchWise AI.
    The user wants to open a {request.business_type} in {request.location} with a budget of INR {request.budget}.

    Estimate the following monthly costs realistically for this specific location:
    1. monthly_rent_estimate (in INR, float)
    2. raw_material_ratio (as a decimal, e.g., 0.30 for 30% of revenue)
    3. staff_cost_estimate (monthly in INR, float)

    Respond STRICTLY in JSON format matching this schema:
    {{
        "monthly_rent_estimate": 45000.0,
        "raw_material_ratio": 0.30,
        "staff_cost_estimate": 120000.0
    }}
    """

    mock_fallback = {
        "monthly_rent_estimate": 45000.0,
        "raw_material_ratio": 0.30,
        "staff_cost_estimate": 80000.0
    }

    logger.info(f"Getting finance estimates for {request.business_type} in {request.location}...")
    result = call_gemini_json(prompt, mock_fallback, enable_search=False)

    rent_est = rent_override if rent_override is not None else float(result.get("monthly_rent_estimate", mock_fallback["monthly_rent_estimate"]))
    raw_material_ratio = float(result.get("raw_material_ratio", mock_fallback["raw_material_ratio"]))
    staff_est = float(result.get("staff_cost_estimate", mock_fallback["staff_cost_estimate"]))

    budget = request.budget
    base_monthly_rev = budget * 0.06 * marketing_multiplier

    forecast = []
    accumulated_profit = 0.0
    break_even_month = -1

    for month in range(1, 13):
        growth_factor = 1.0 + (0.05 * month) + (0.003 * month ** 2)
        rev = round(base_monthly_rev * growth_factor, 2)
        cost = round(rent_est + staff_est + (rev * raw_material_ratio), 2)
        profit = round(rev - cost, 2)
        accumulated_profit += profit

        forecast.append(ForecastItem(
            month=month,
            revenue=rev,
            cost=cost,
            profit=profit
        ))

        if accumulated_profit >= (budget * 0.30) and break_even_month == -1:
            break_even_month = month

    if break_even_month == -1:
        break_even_month = 12

    roi = round((accumulated_profit / budget) * 100, 2)

    return EconomicReport(
        monthly_rent_estimate=rent_est,
        staff_cost_estimate=staff_est,
        raw_material_cost=round(base_monthly_rev * raw_material_ratio, 2),
        break_even_months=break_even_month,
        projected_revenue_month_6=forecast[5].revenue,
        projected_revenue_month_12=forecast[11].revenue,
        roi_percentage=roi,
        profit_forecast=forecast
    )
