import json
from models import AnalysisRequest, BusinessProfile
from agents.gemini_helper import call_gemini_json

def analyze_business(request: AnalysisRequest) -> BusinessProfile:
    # Define prompt instructing the model to parse the business description
    prompt = f"""
    You are an expert startup consultant and business analyst. 
    Analyze this pre-launch business idea and output a structured profile.
    
    Business Type: {request.business_type}
    Target Location: {request.location}
    Launch Budget: INR {request.budget:,.2f}
    Business Description: {request.description}
    
    Extract and structure the following details. You must respond strictly with a JSON object.
    Do not add any markdown explanation, just the raw JSON object.
    
    JSON Schema:
    {{
        "business_type": "{request.business_type}",
        "products": ["List 3-4 specific products or services they will sell"],
        "target_customers": ["List 3 key customer demographics or segments"],
        "unique_value": "A concise one-sentence statement of their unique value proposition",
        "risks": ["List 3 specific operational, financial, or market risks for this idea"]
    }}
    """
    
    # Define the mock fallback matching the model structure
    mock_fallback = {
        "business_type": request.business_type,
        "products": [
            f"Premium {request.business_type} core offering",
            "Specialized customized selections",
            "Value-added service packages"
        ],
        "target_customers": [
            "Young metropolitan working professionals",
            "Tech park employees and local residents",
            "High-discretionary income demographics"
        ],
        "unique_value": f"A highly localized, upscale {request.business_type} experience prioritizing quality and digital accessibility.",
        "risks": [
            "High commercial lease rent overheads in micro-market",
            "Local staff training and operational retention",
            "Intense competition from established national franchises"
        ]
    }
    
    # Call Gemini
    result_dict = call_gemini_json(prompt, mock_fallback, enable_search=False)
    
    # Map back to Pydantic model
    return BusinessProfile(
        business_type=result_dict.get("business_type", request.business_type),
        products=result_dict.get("products", mock_fallback["products"]),
        target_customers=result_dict.get("target_customers", mock_fallback["target_customers"]),
        unique_value=result_dict.get("unique_value", mock_fallback["unique_value"]),
        risks=result_dict.get("risks", mock_fallback["risks"])
    )
