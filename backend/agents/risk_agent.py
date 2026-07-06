from models import RiskReport

def evaluate_risk(business_type: str, budget: float, competition_density: int) -> RiskReport:
    # 1. Determine budget threshold based on business type
    # For India market context (in INR)
    bus_lower = business_type.lower()
    min_budget = 1000000.0  # 10 Lakhs standard default
    ideal_budget = 2000000.0  # 20 Lakhs standard default
    
    if "cafe" in bus_lower:
        min_budget = 800000.0     # 8 Lakhs
        ideal_budget = 1500000.0  # 15 Lakhs
    elif "restaurant" in bus_lower:
        min_budget = 1500000.0    # 15 Lakhs
        ideal_budget = 3000000.0  # 30 Lakhs
    elif "bakery" in bus_lower:
        min_budget = 500000.0     # 5 Lakhs
        ideal_budget = 1200000.0  # 12 Lakhs
    elif "gym" in bus_lower:
        min_budget = 1200000.0    # 12 Lakhs
        ideal_budget = 2500000.0  # 25 Lakhs
    elif "salon" in bus_lower:
        min_budget = 600000.0     # 6 Lakhs
        ideal_budget = 1500000.0  # 15 Lakhs
    elif "retail" in bus_lower:
        min_budget = 500000.0     # 5 Lakhs
        ideal_budget = 1500000.0  # 15 Lakhs

    # 2. Calculate risk parameters
    risk_score = 0
    mitigations = []

    # Budget risk calculation (up to 50 points)
    if budget < min_budget:
        budget_risk = 50
        mitigations.append(f"Raise additional capital. Current budget of INR {budget:,.2f} is below the critical threshold of INR {min_budget:,.2f} for a {business_type}.")
    elif budget < ideal_budget:
        # Interpolate between 15 and 40 points
        ratio = (budget - min_budget) / (ideal_budget - min_budget)
        budget_risk = int(40 - (ratio * 25))
        mitigations.append("Secure secondary credit line. Budget is sufficient for launch but provides less than 3 months of working capital reserve.")
    else:
        budget_risk = 10
        mitigations.append("Maximize initial capital deployment into high-ROI marketing and premium front-of-house assets.")

    # Competition risk calculation (up to 50 points)
    if competition_density > 80:
        comp_risk = 50
        mitigations.append("Differentiate value proposition strictly. Establish a unique niche to avoid head-on price wars with surrounding high-density competitors.")
        mitigations.append("Focus heavily on pre-launch digital signups and loyalty programs to steal early market share.")
    elif competition_density > 50:
        comp_risk = 30
        mitigations.append("Conduct a local SWOT audit on the top 3 closest competitors and exploit their service/timings gaps.")
    else:
        comp_risk = 10
        mitigations.append("Aggressively establish local brand presence early before new competitors enter the low-density market space.")

    # Combined score
    risk_score = budget_risk + comp_risk
    
    # Cap score at 100
    risk_score = min(100, max(0, risk_score))
    
    # Classify Risk Level
    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 40:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return RiskReport(
        risk_score=risk_score,
        risk_level=risk_level,
        mitigations=mitigations
    )
