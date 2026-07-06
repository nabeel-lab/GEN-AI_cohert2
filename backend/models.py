from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Input Models ---
class AnalysisRequest(BaseModel):
    business_type: str = Field(..., description="Type of business (e.g. cafe, bakery, restaurant, retail, gym, salon)")
    location: str = Field(..., description="Target city/neighborhood (e.g. Indiranagar, Bangalore)")
    budget: float = Field(..., description="Budget in INR")
    description: str = Field(..., description="Detailed description of the business idea")

# --- Agent Reports ---
class BusinessProfile(BaseModel):
    business_type: str
    products: List[str]
    target_customers: List[str]
    unique_value: str
    risks: List[str]

class Competitor(BaseModel):
    name: str
    rating: float
    price_range: str
    strengths: List[str]
    weaknesses: List[str]
    estimated_monthly_revenue: str

class CompetitorReport(BaseModel):
    competitors: List[Competitor]
    swot: Dict[str, List[str]]
    gap_opportunity: str

class LocationMetrics(BaseModel):
    footfall_score: int
    competition_density: int
    accessibility_score: int
    growth_potential: int
    latitude: float
    longitude: float

class ForecastItem(BaseModel):
    month: int
    revenue: float
    cost: float
    profit: float

class EconomicReport(BaseModel):
    monthly_rent_estimate: float
    staff_cost_estimate: float
    raw_material_cost: float
    break_even_months: int
    projected_revenue_month_6: float
    projected_revenue_month_12: float
    roi_percentage: float
    profit_forecast: List[ForecastItem]

class CustomerPersona(BaseModel):
    name: str
    demographics: Dict[str, str]
    behaviors: List[str]
    pain_points: List[str]
    needs: List[str]

class SupplyChainItem(BaseModel):
    category: str
    suppliers: List[str]
    risk_level: str

class MarketingCampaign(BaseModel):
    channel: str
    strategy: str
    difficulty: str

class RiskReport(BaseModel):
    risk_score: int
    risk_level: str
    mitigations: List[str]

class MarketReport(BaseModel):
    demand_score: int
    trend: str # growing, stable, declining
    top_3_trends: List[str]
    seasonality: str
    market_size_estimate: str
    detailed_analysis: Optional[str] = None

class DecisionReport(BaseModel):
    go_no_go: str # GO, NO GO, PROCEED WITH CAUTION
    confidence_score: int
    business_health_score: int
    top_3_recommendations: List[str]
    next_steps: Dict[str, List[str]] # "now", "3_months", "6_months", "1_year"

# --- Output Report ---
class FinalReport(BaseModel):
    session_id: str
    timestamp: str
    request: AnalysisRequest
    business_profile: BusinessProfile
    market_intelligence: MarketReport
    competitors: CompetitorReport
    location: LocationMetrics
    finance: EconomicReport
    personas: List[CustomerPersona]
    supply_chain: List[SupplyChainItem]
    marketing: List[MarketingCampaign]
    risk: RiskReport
    decision: DecisionReport
