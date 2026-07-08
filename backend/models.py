from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Input Models ---
class AnalysisRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Optional pre-generated session/project ID")
    business_type: str = Field(..., description="Type of business (e.g. cafe, bakery, restaurant, retail, gym, salon)")
    location: str = Field(..., description="Target city/neighborhood (e.g. Indiranagar, Bangalore)")
    budget: float = Field(..., description="Budget in INR")
    description: str = Field(..., description="Detailed description of the business idea")


    # --- Precise location (optional) ---
    # Populated by the frontend's Uber-style map picker (Maps JavaScript API +
    # Places API + Geocoding API). All optional so requests built without the
    # picker (existing tests, demo scenarios, older clients) remain valid.
    latitude: Optional[float] = Field(None, description="Exact latitude picked on the map")
    longitude: Optional[float] = Field(None, description="Exact longitude picked on the map")
    formatted_address: Optional[str] = Field(None, description="Full formatted address from Geocoding API")
    place_id: Optional[str] = Field(None, description="Google Place ID of the selected location")
    locality: Optional[str] = Field(None, description="Neighborhood / area")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State / administrative area")
    country: Optional[str] = Field(None, description="Country")
    postal_code: Optional[str] = Field(None, description="Postal / PIN code")

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

    # --- Executive Intelligence Brief ---
    executive_summary: str = ""
    top_opportunities: List[str] = Field(default_factory=list)
    biggest_risks: List[str] = Field(default_factory=list)
    market_outlook: str = ""
    financial_outlook: str = ""
    recommended_launch_window: str = ""
    expected_roi_summary: str = ""

    # --- AI Insights Panel ---
    reasoning: str = ""                      # Why this recommendation was made, citing specific data
    confidence_factors: List[str] = Field(default_factory=list)
    key_strengths: List[str] = Field(default_factory=list)
    key_weaknesses: List[str] = Field(default_factory=list)
    hidden_opportunities: List[str] = Field(default_factory=list)
    critical_risks: List[str] = Field(default_factory=list)
    suggested_next_milestone: str = ""

    # --- Pattern Detection (computed deterministically from agent outputs) ---
    patterns: List[str] = Field(default_factory=list)

    # --- Decision Score Breakdown (computed deterministically — same weights used for business_health_score) ---
    score_breakdown: Dict[str, int] = Field(default_factory=dict)

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

    # Populated after Cloud Storage upload — None until then, and always
    # optional so existing saved session JSON files remain valid.
    pdf_url: Optional[str] = None
    json_url: Optional[str] = None


# --- What-If Simulator ---
class SimulationRequest(BaseModel):
    session_id: str = Field(..., description="Original analysis session to use as the baseline")
    business_type: Optional[str] = None
    location: Optional[str] = None
    budget: Optional[float] = None
    competition_density: Optional[int] = Field(None, ge=0, le=100)
    rent_override: Optional[float] = None
    marketing_multiplier: Optional[float] = Field(None, ge=0.5, le=2.0)


class SimulationResult(BaseModel):
    business_health_score: int
    confidence_score: int
    go_no_go: str
    risk_score: int
    risk_level: str
    roi_percentage: float
    break_even_months: int
    score_breakdown: Dict[str, int]


# --- AI Chat Assistant ---
class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    session_id: str
    question: str = Field(..., min_length=1, max_length=500)
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str


# --- Uploaded Dataset Analysis (Analytics Agent) ---
class DatasetKPIReport(BaseModel):
    filename: str
    row_count: int
    column_count: int
    columns: List[str]
    missing_values: Dict[str, int]
    numeric_summary: Dict[str, Dict[str, float]]
    kpis: Dict[str, float]
    gpu_accelerated: bool
    bigquery_synced: bool


# --- Strategic AI Consultant ---
class Message(BaseModel):
    role: str
    text: str

class ConsultRequest(BaseModel):
    messages: List[Message]

class ExtractedParams(BaseModel):
    business_type: Optional[str] = None
    location: Optional[str] = None
    budget: Optional[float] = None
    description: Optional[str] = None

class ConsultResponse(BaseModel):
    reply: str
    is_ready_for_analysis: bool = False
    extracted_params: Optional[ExtractedParams] = None
