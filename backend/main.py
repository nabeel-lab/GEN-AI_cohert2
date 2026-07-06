import os
import uuid
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load .env from project root (one level above backend/)
_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path=_root_env, override=False)

# Import schemas and agents
from models import AnalysisRequest, FinalReport
import agents

app = FastAPI(title="LaunchWise AI - Master Decision Intelligence Server")

# Configure CORS for local development and Cloud Run hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration from environment ──────────────────────────────────────────
GCP_PROJECT        = os.getenv("GOOGLE_CLOUD_PROJECT", "launchwise-ai")
PROJECT_ID         = os.getenv("PROJECT_ID", GCP_PROJECT)
FIRESTORE_DATABASE = os.getenv("FIRESTORE_DATABASE", "(default)")
STORAGE_BUCKET     = os.getenv("STORAGE_BUCKET", "")
MAPS_API_KEY       = os.getenv("GOOGLE_MAPS_API_KEY", "")

print(f"[Config] GCP Project : {GCP_PROJECT} (ID: {PROJECT_ID})")
print(f"[Config] Firestore DB: {FIRESTORE_DATABASE}")
print(f"[Config] Storage     : {STORAGE_BUCKET or 'not configured'}")
print(f"[Config] Maps Key    : {'set' if MAPS_API_KEY else 'not configured'}")

# Ensure local session reports folder exists as fallback database
SESSIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)

# ── Firestore (optional) ─────────────────────────────────────────────────────
# Uses Google Cloud Firestore — NOT a local DB.
# Activated only when GOOGLE_CLOUD_PROJECT is set and credentials are available.
# Database is selected via FIRESTORE_DATABASE env var.
firestore_db = None
try:
    from google.cloud import firestore
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"):
        firestore_db = firestore.Client(
            project=GCP_PROJECT,
            database=FIRESTORE_DATABASE,
        )
        print(f"Firestore connected: project={GCP_PROJECT}, database={FIRESTORE_DATABASE}")
except Exception as e:
    print(f"Firestore not initialized (JSON session fallback active): {e}")


# --- API Routes ---

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/analyze", response_model=FinalReport)
def run_orchestration(request: AnalysisRequest):
    try:
        session_id = str(uuid.uuid4())
        
        # --- Sequential Orchestration of 10 Agents ---
        # 1. Business Understanding (Live — Gemini with mock fallback)
        biz_profile = agents.analyze_business(request)
        
        # 2. Market Intelligence (Live — Gemini + Google Search grounding with mock fallback)
        market_intel = agents.run_market_analysis(request)
        
        # 3. Competitor Intelligence (Hardcoded agent)
        competitor_intel = agents.analyze_competitors(request.business_type)
        
        # 4. Location Intelligence (Hardcoded agent)
        location_intel = agents.analyze_location(request.location, request.business_type)
        
        # 5. Economic Intelligence (Formula-based agent)
        finance_intel = agents.get_finance(request)
        
        # 6. Customer Persona (Hardcoded agent)
        personas = agents.get_personas(request.business_type)
        
        # 7. Supply Chain (Hardcoded agent)
        supply_chain = agents.get_supply_chain(request.business_type)
        
        # 8. Marketing (Hardcoded agent)
        marketing = agents.get_marketing(request.business_type)
        
        # 9. Risk Prediction (Rule-based agent)
        risk_intel = agents.evaluate_risk(request.business_type, request.budget, location_intel.competition_density)
        
        # 10. Decision Agent (Live — Gemini synthesizer with rule-based fallback)
        decision_intel = agents.make_decision(
            biz_profile, market_intel, competitor_intel,
            location_intel, finance_intel, risk_intel
        )
        
        # Assemble Final Report
        report = FinalReport(
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
            request=request,
            business_profile=biz_profile,
            market_intelligence=market_intel,
            competitors=competitor_intel,
            location=location_intel,
            finance=finance_intel,
            personas=personas,
            supply_chain=supply_chain,
            marketing=marketing,
            risk=risk_intel,
            decision=decision_intel
        )
        
        # Save to Database Fallback (JSON file)
        save_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        with open(save_path, "w") as f:
            json.dump(report.model_dump(), f, indent=4)
            
        # Optional: Save to Firestore if connected
        if firestore_db:
            try:
                firestore_db.collection("reports").document(session_id).set(report.model_dump())
            except Exception as fe:
                print(f"Failed to write to Firestore: {fe}")
                
        return report

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Orchestration pipeline failed: {str(e)}")

@app.get("/report/{session_id}", response_model=FinalReport)
def get_session_report(session_id: str):
    # Try fetching from local JSON folder first
    save_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(save_path):
        try:
            with open(save_path, "r") as f:
                data = json.load(f)
            return FinalReport(**data)
        except (json.JSONDecodeError, ValidationError) as ve:
            raise HTTPException(status_code=500, detail=f"Saved report format is corrupt: {str(ve)}")
            
    # Try fetching from Firestore if local file not found and db is active
    if firestore_db:
        try:
            doc = firestore_db.collection("reports").document(session_id).get()
            if doc.exists:
                return FinalReport(**doc.to_dict())
        except Exception as fe:
            raise HTTPException(status_code=500, detail=f"Firestore fetch failed: {str(fe)}")
            
    raise HTTPException(status_code=404, detail=f"Report session {session_id} not found.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
