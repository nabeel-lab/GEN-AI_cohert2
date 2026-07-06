from models import AnalysisRequest, EconomicReport, ForecastItem


# Rent lookup table by business type (monthly, INR)
RENT_BY_TYPE = {
    "cafe":       45000.0,
    "bakery":     35000.0,
    "restaurant": 85000.0,
    "retail":     70000.0,
    "gym":        90000.0,
    "salon":      40000.0,
}

# Raw material cost as % of monthly revenue by business type
RAW_MATERIAL_RATIO = {
    "cafe":       0.30,
    "bakery":     0.35,
    "restaurant": 0.38,
    "retail":     0.50,
    "gym":        0.05,
    "salon":      0.15,
}


def _resolve_type_key(business_type: str) -> str:
    """Map any business description to one of our known keys."""
    bl = business_type.lower()
    if "cafe" in bl or "coffee" in bl:
        return "cafe"
    if "bake" in bl or "pastry" in bl or "cake" in bl:
        return "bakery"
    if "restaurant" in bl or "dine" in bl or "food" in bl or "eatery" in bl:
        return "restaurant"
    if "shop" in bl or "store" in bl or "retail" in bl or "boutique" in bl:
        return "retail"
    if "gym" in bl or "fit" in bl or "workout" in bl:
        return "gym"
    if "salon" in bl or "hair" in bl or "spa" in bl or "beauty" in bl:
        return "salon"
    return "cafe"  # safe default


def get_finance(request: AnalysisRequest) -> EconomicReport:
    """
    Formula-based financial projection agent.
    Uses business-type-specific lookup tables for rent and raw material ratios.
    Applies a realistic S-curve growth model over 12 months.
    """
    budget = request.budget
    key = _resolve_type_key(request.business_type)

    rent_est = RENT_BY_TYPE[key]
    raw_material_ratio = RAW_MATERIAL_RATIO[key]

    # Staff cost: 8–12% of budget depending on scale
    if budget < 1_000_000:
        staff_est = budget * 0.08
    elif budget < 3_000_000:
        staff_est = budget * 0.09
    else:
        staff_est = budget * 0.10

    # Base monthly revenue: conservative 6% of budget
    base_monthly_rev = budget * 0.06

    forecast: list[ForecastItem] = []
    accumulated_profit = 0.0
    break_even_month = -1

    for month in range(1, 13):
        # S-curve growth: slow start, accelerates mid-year, levels off
        # Growth ranges from +5% (month 1) to +85% (month 12)
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

        # Break-even: when cumulative profit recovers 30% of initial budget
        if accumulated_profit >= (budget * 0.30) and break_even_month == -1:
            break_even_month = month

    if break_even_month == -1:
        break_even_month = 12  # Did not break even within year — cap at 12

    total_revenue = sum(f.revenue for f in forecast)
    roi = round((accumulated_profit / budget) * 100, 2)

    return EconomicReport(
        monthly_rent_estimate=rent_est,
        staff_cost_estimate=round(staff_est, 2),
        raw_material_cost=round(base_monthly_rev * raw_material_ratio, 2),
        break_even_months=break_even_month,
        projected_revenue_month_6=forecast[5].revenue,
        projected_revenue_month_12=forecast[11].revenue,
        roi_percentage=roi,
        profit_forecast=forecast
    )
