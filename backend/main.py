import os
import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import ValidationError
from typing import List, Dict, Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi import Depends

# Load .env from project root (one level above backend/)
_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path=_root_env, override=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("launchwise.main")

# Import schemas and agents
from models import (
    AnalysisRequest, FinalReport, DatasetKPIReport,
    SimulationRequest, SimulationResult, MarketReport, CompetitorReport,
    CustomerPersona, SupplyChainItem, MarketingCampaign, ChatRequest, ChatResponse,
    ConsultRequest, ConsultResponse,
)

import agents
import database
import auth
from agents.decision_agent import compute_score_breakdown, compute_health_score, compute_confidence
import services
from services.analytics_summary import get_summary as get_analytics_summary

app = FastAPI(title="LaunchWise AI - Master Decision Intelligence Server")

# Configure CORS for local development and Cloud Run hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")

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

# Temporary holding area for user-uploaded datasets (CSV/Excel) before the
# Analytics Agent processes them. Not served publicly — only read by the agent.
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

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
    """
    Enhanced health check verifying all GCP service integrations.
    Returns detailed status for each service.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {}
    }

    # Check Gemini
    try:
        from agents.gemini_helper import _key_valid
        health_status["services"]["gemini"] = "connected" if _key_valid else "disconnected (fallback active)"
    except Exception as e:
        health_status["services"]["gemini"] = f"error: {str(e)}"

    # Check Firestore
    health_status["services"]["firestore"] = "connected" if firestore_db else "disconnected (JSON fallback active)"

    # Check BigQuery
    try:
        from services.bigquery_service import is_available
        health_status["services"]["bigquery"] = "connected" if is_available() else "disconnected (local aggregation)"
    except Exception as e:
        health_status["services"]["bigquery"] = f"error: {str(e)}"

    # Check Cloud Storage
    try:
        from services.storage_service import is_available
        health_status["services"]["storage"] = "connected" if is_available() else "disconnected (local serving)"
    except Exception as e:
        health_status["services"]["storage"] = f"error: {str(e)}"

    # Check Maps API
    health_status["services"]["maps"] = "configured" if MAPS_API_KEY else "not configured"

    # Check local fallbacks
    health_status["fallbacks"] = {
        "sessions_dir": os.path.exists(SESSIONS_DIR),
        "uploads_dir": os.path.exists(UPLOADS_DIR),
    }

    return health_status

@app.get("/projects")
def get_user_projects(current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    projects = db.query(database.Project).filter(database.Project.user_id == current_user.id).order_by(database.Project.created_at.desc()).all()
    # We return the basic project info + we will set report boolean if status is analyzed
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "createdAt": p.created_at,
            "report": p.status == "analyzed"
        })
    return result

@app.post("/analyze", response_model=FinalReport)
def run_orchestration(request: AnalysisRequest, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    try:
        session_id = str(uuid.uuid4())
        
        # --- Sequential Orchestration of 10 Agents ---
        # 1. Business Understanding (Live — Gemini with mock fallback)
        biz_profile = agents.analyze_business(request)
        
        # 2. Market Intelligence (Live — Gemini + Google Search grounding with mock fallback)
        market_intel = agents.run_market_analysis(request)
        
        # 3. Competitor Intelligence (Live Gemini agent)
        competitor_intel = agents.analyze_competitors(request.business_type, request.location)
        
        # 4. Location Intelligence (Hardcoded agent)
        # Prefers exact map-picked coordinates (request.latitude/longitude,
        # from the frontend's Uber-style LocationPicker) over the neighborhood
        # centroid lookup when available — both fields are optional so
        # requests without them behave exactly as before.
        location_intel = agents.analyze_location(
            request.location, request.business_type,
            precise_lat=request.latitude, precise_lng=request.longitude,
        )
        
        # 5. Economic Intelligence (Formula-based agent)
        finance_intel = agents.get_finance(request)
        
        # 6. Customer Persona (Live Gemini agent)
        personas = agents.get_personas(request.business_type, request.location)
        
        # 7. Supply Chain (Live Gemini agent)
        supply_chain = agents.get_supply_chain(request.business_type, request.location)
        
        # 8. Marketing (Live Gemini agent)
        marketing = agents.get_marketing(request.business_type, request.location)
        
        # 9. Risk Prediction (Live Gemini agent)
        risk_intel = agents.evaluate_risk(request.business_type, request.budget, location_intel.competition_density, request.location)

        # 9.5. Insights Agent (optional — reads BigQuery history for this business_type)
        # Returns None on first-ever analysis of a type, or if BigQuery is unavailable;
        # the Decision Agent handles a None historical_context exactly as before.
        historical_context = agents.get_historical_context(request.business_type)

        # 10. Decision Agent (Live — Gemini synthesizer with rule-based fallback)
        decision_intel = agents.make_decision(
            biz_profile, market_intel, competitor_intel,
            location_intel, finance_intel, risk_intel,
            personas=personas, supply_chain=supply_chain, marketing=marketing,
            budget=request.budget, location_name=request.location,
            historical_context=historical_context,
        )
        
        # Assemble Final Report
        report = FinalReport(
            session_id=session_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
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
        
        # --- PDF generation + Cloud Storage upload ---
        # Best-effort: any failure here must not break the core analysis response.
        report_dict = report.model_dump()
        try:
            pdf_bytes = services.generate_investor_pdf(report_dict)
            report.pdf_url = services.upload_pdf(session_id, pdf_bytes)
            report.json_url = services.upload_json(session_id, json.dumps(report_dict, indent=2).encode("utf-8"))
            report_dict = report.model_dump()  # refresh with the URLs now set
        except Exception as pe:
            logger.error(f"PDF/Storage pipeline failed for session {session_id}: {pe}")

        # Save to Database Fallback (JSON file) — includes pdf_url/json_url if set above
        save_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        with open(save_path, "w") as f:
            json.dump(report_dict, f, indent=4)

        # Optional: Save to Firestore if connected
        if firestore_db:
            try:
                firestore_db.collection("reports").document(session_id).set(report_dict)
            except Exception as fe:
                print(f"Failed to write to Firestore: {fe}")

        # --- BigQuery analytics row (best-effort — never blocks the response) ---
        try:
            services.insert_report(report_dict)
        except Exception as be:
            logger.error(f"BigQuery insert failed for session {session_id}: {be}")

        # Save to database to associate project with user
        new_project = database.Project(
            id=session_id,
            name=f"{request.business_type} in {request.location}",
            user_id=current_user.id,
            status="analyzed"
        )
        db.add(new_project)
        db.commit()

        return report

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Orchestration pipeline failed: {str(e)}")

@app.get("/report/{session_id}", response_model=FinalReport)
def get_session_report(session_id: str, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check if project belongs to the user
    project = db.query(database.Project).filter(database.Project.id == session_id, database.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
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


@app.get("/report-file/{filename}")
def get_local_report_file(filename: str):
    """
    Serves PDF/JSON report files from the local sessions/ fallback directory.
    Only reached when Cloud Storage is unavailable — storage_service.upload_pdf/
    upload_json return a "/api/report-file/..." URL in that case instead of a
    real GCS public URL, and the frontend treats both identically.
    """
    # Reject path traversal — filename must be exactly "<uuid>.pdf" or "<uuid>.json"
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = os.path.join(SESSIONS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found.")

    media_type = "application/pdf" if filename.endswith(".pdf") else "application/json"
    return FileResponse(file_path, media_type=media_type, filename=filename)


@app.get("/download-report/{session_id}")
def download_report(session_id: str, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """
    Returns the PDF for a session — redirects to its Cloud Storage public URL
    if one was generated, or regenerates it on the fly from the saved JSON
    report as a last resort (e.g. for sessions created before this endpoint existed).
    """
    project = db.query(database.Project).filter(database.Project.id == session_id, database.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    save_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if not os.path.exists(save_path):
        raise HTTPException(status_code=404, detail=f"Report session {session_id} not found.")

    with open(save_path, "r") as f:
        report_dict = json.load(f)

    if report_dict.get("pdf_url"):
        return RedirectResponse(url=report_dict["pdf_url"])

    # No pdf_url stored (older session, or the original PDF pipeline failed) — generate now.
    try:
        pdf_bytes = services.generate_investor_pdf(report_dict)
        pdf_url = services.upload_pdf(session_id, pdf_bytes)
        report_dict["pdf_url"] = pdf_url
        with open(save_path, "w") as f:
            json.dump(report_dict, f, indent=4)
        return RedirectResponse(url=pdf_url)
    except Exception as e:
        logger.error(f"On-demand PDF generation failed for {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@app.post("/upload-data", response_model=DatasetKPIReport)
async def upload_business_data(file: UploadFile = File(...)):
    """
    Accepts a CSV or Excel upload (sales report, inventory, financial
    statement) and runs it through the Analytics Agent: clean -> summarize ->
    compute KPIs -> sync to BigQuery. Uses gpu_processing (cuDF-if-available,
    else pandas) under the hood.
    """
    allowed_ext = (".csv", ".xlsx", ".xls")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_ext)}")

    upload_id = str(uuid.uuid4())
    saved_path = os.path.join(UPLOADS_DIR, f"{upload_id}{ext}")
    try:
        contents = await file.read()
        with open(saved_path, "wb") as f:
            f.write(contents)

        kpi_report = agents.analyze_uploaded_dataset(saved_path)
        return DatasetKPIReport(**kpi_report)
    except Exception as e:
        logger.error(f"Dataset upload processing failed for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Dataset processing failed: {str(e)}")
    finally:
        # Uploaded file is only needed transiently for this request's analysis.
        if os.path.exists(saved_path):
            os.remove(saved_path)


@app.post("/simulate", response_model=SimulationResult)
def simulate_scenario(sim: SimulationRequest, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """
    What-If Simulator — recomputes the health score, ROI, risk, break-even,
    and verdict for a modified scenario against an existing session's
    baseline (market intelligence, competitors, personas, supply chain,
    marketing). Deliberately makes ZERO Gemini calls: location, finance, and
    risk are all deterministic formula-based agents, so this responds
    instantly and can be called on every slider movement in the UI.
    """
    project = db.query(database.Project).filter(database.Project.id == sim.session_id, database.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    save_path = os.path.join(SESSIONS_DIR, f"{sim.session_id}.json")
    if not os.path.exists(save_path):
        raise HTTPException(status_code=404, detail=f"Report session {sim.session_id} not found.")

    with open(save_path, "r") as f:
        base = json.load(f)

    business_type = sim.business_type or base["request"]["business_type"]
    location_str = sim.location or base["request"]["location"]
    budget = sim.budget if sim.budget is not None else base["request"]["budget"]

    # Recompute location + finance + risk — all pure formula agents, no API calls.
    # Reuse the original session's exact map-picked coordinates only if the
    # simulation didn't override the location string to somewhere else.
    base_lat = base["location"].get("latitude") if not sim.location else None
    base_lng = base["location"].get("longitude") if not sim.location else None
    location_intel = agents.analyze_location(
        location_str, business_type, precise_lat=base_lat, precise_lng=base_lng,
    )
    if sim.competition_density is not None:
        location_intel = location_intel.model_copy(update={"competition_density": sim.competition_density})

    sim_request = AnalysisRequest(
        business_type=business_type, location=location_str, budget=budget,
        description=base["request"]["description"],
    )
    finance_intel = agents.get_finance(
        sim_request,
        rent_override=sim.rent_override,
        marketing_multiplier=sim.marketing_multiplier or 1.0,
    )
    risk_intel = agents.evaluate_risk(business_type, budget, location_intel.competition_density)

    # Reuse the original market/competitor/persona/supply-chain/marketing data —
    # demand and personas don't meaningfully change from budget/rent/location tweaks
    # within the same city, so re-running Gemini for them would add latency for no signal.
    market_intel = MarketReport(**base["market_intelligence"])
    competitors = CompetitorReport(**base["competitors"])
    personas = [CustomerPersona(**p) for p in base["personas"]]
    supply_chain = [SupplyChainItem(**s) for s in base["supply_chain"]]
    marketing = [MarketingCampaign(**m) for m in base["marketing"]]

    score_breakdown = compute_score_breakdown(market_intel, location_intel, finance_intel, risk_intel, personas, supply_chain, marketing)
    health_score = compute_health_score(score_breakdown)
    confidence_score, _ = compute_confidence(score_breakdown, risk_intel, market_intel)

    if health_score >= 70:
        verdict = "GO"
    elif health_score >= 45:
        verdict = "PROCEED WITH CAUTION"
    else:
        verdict = "NO GO"

    return SimulationResult(
        business_health_score=health_score,
        confidence_score=confidence_score,
        go_no_go=verdict,
        risk_score=risk_intel.risk_score,
        risk_level=risk_intel.risk_level,
        roi_percentage=finance_intel.roi_percentage,
        break_even_months=finance_intel.break_even_months,
        score_breakdown=score_breakdown,
    )


@app.post("/chat", response_model=ChatResponse)
def chat_with_report(chat: ChatRequest, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """AI Chat Assistant — answers a question grounded in one session's report."""
    project = db.query(database.Project).filter(database.Project.id == chat.session_id, database.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    save_path = os.path.join(SESSIONS_DIR, f"{chat.session_id}.json")
    if not os.path.exists(save_path):
        raise HTTPException(status_code=404, detail=f"Report session {chat.session_id} not found.")

    with open(save_path, "r") as f:
        report = json.load(f)

    # Convert list of ChatMessage models to list of dicts for the agent
    history = [{"role": m.role, "text": m.text} for m in chat.history]
    answer = agents.answer_question(report, chat.question, history)
    return ChatResponse(answer=answer)


@app.post("/consult", response_model=ConsultResponse)
def consult_with_panel(req: ConsultRequest, current_user: database.User = Depends(auth.get_current_user)):
    """AI Startup Consultant — panel conversation about a business idea."""
    # Convert list of Message models to list of dicts for the agent
    history = [{"role": m.role, "text": m.text} for m in req.messages]
    result_dict = agents.chat_consultant(history)
    return ConsultResponse(**result_dict)



@app.get("/analytics/summary")
def get_analytics():
    """Returns aggregated analytics across all analyzed businesses.
    Gracefully falls back to aggregating local sessions/*.json if BigQuery unavailable."""
    return get_analytics_summary()


@app.post("/test/full-pipeline")
def test_full_pipeline():
    """
    Full-pipeline integration test for deployment verification.
    Executes complete workflow: analyze → save → insert → generate PDF → upload.
    """
    logger.info("🧪 Starting full-pipeline test...")
    test_results = {
        "success": False,
        "steps": {},
        "errors": [],
    }

    try:
        # Step 1: Create test request
        logger.info("✓ Step 1: Creating test business request...")
        test_request = AnalysisRequest(
            business_type="Specialty Coffee Café",
            location="Indiranagar, Bangalore",
            budget=1500000,
            description="A premium coffee shop targeting remote workers with focus on quality and ambiance.",
        )
        test_results["steps"]["request_created"] = True
        logger.info("✓ Request created successfully")

        # Step 2: Run complete analysis pipeline
        logger.info("✓ Step 2: Running 10-agent analysis pipeline...")
        session_id = str(uuid.uuid4())

        biz_profile = agents.analyze_business(test_request)
        market_intel = agents.run_market_analysis(test_request)
        competitor_intel = agents.analyze_competitors(test_request.business_type, test_request.location)
        location_intel = agents.analyze_location(test_request.location, test_request.business_type)
        finance_intel = agents.get_finance(test_request)
        risk_intel = agents.evaluate_risk(test_request.business_type, test_request.budget, location_intel.competition_density, test_request.location)
        personas = agents.get_personas(test_request.business_type, test_request.location)
        supply_chain = agents.get_supply_chain(test_request.business_type, test_request.location)
        marketing = agents.get_marketing(test_request.business_type, test_request.location)

        score_breakdown = compute_score_breakdown(market_intel, location_intel, finance_intel, risk_intel, personas, supply_chain, marketing)
        health_score = compute_health_score(score_breakdown)
        confidence_score, factors = compute_confidence(score_breakdown, risk_intel, market_intel)

        if health_score >= 70:
            verdict = "GO"
        elif health_score >= 45:
            verdict = "PROCEED WITH CAUTION"
        else:
            verdict = "NO GO"

        logger.info(f"✓ Analysis complete: {verdict} (Health: {health_score}/100, Confidence: {confidence_score}%)")
        test_results["steps"]["analysis_complete"] = True

        # Step 3: Build final report
        logger.info("✓ Step 3: Building final report...")
        report = FinalReport(
            session_id=session_id,
            business_profile=biz_profile,
            market_research=market_intel,
            competitors=competitor_intel,
            location_research=location_intel,
            financial_outlook=finance_intel,
            risk_assessment=risk_intel,
            customer_personas=personas,
            supply_chain_analysis=supply_chain,
            marketing_strategy=marketing,
            decision={
                "go_no_go": verdict,
                "business_health_score": health_score,
                "confidence_factors": factors,
                "confidence_score": confidence_score,
            }
        )
        test_results["steps"]["report_built"] = True
        logger.info("✓ Report built successfully")

        # Step 4: Save to JSON (local fallback)
        logger.info("✓ Step 4: Saving report to JSON...")
        save_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        with open(save_path, "w") as f:
            json.dump(report.dict(), f, indent=2)
        test_results["steps"]["json_saved"] = True
        logger.info(f"✓ JSON saved to {save_path}")

        # Step 5: Insert to BigQuery (if available)
        logger.info("✓ Step 5: Inserting to BigQuery...")
        try:
            from services.bigquery_service import insert_report
            inserted = insert_report(report)
            test_results["steps"]["bigquery_inserted"] = inserted
            if inserted:
                logger.info("✓ BigQuery insert successful")
            else:
                logger.warning("⚠ BigQuery insert skipped (service unavailable)")
        except Exception as e:
            logger.warning(f"⚠ BigQuery insert failed: {e}")
            test_results["steps"]["bigquery_inserted"] = False

        # Step 6: Generate PDF
        logger.info("✓ Step 6: Generating PDF report...")
        try:
            from services.pdf_service import generate_investor_report
            pdf_bytes = generate_investor_report(report)
            test_results["steps"]["pdf_generated"] = True
            logger.info(f"✓ PDF generated ({len(pdf_bytes)} bytes)")
        except Exception as e:
            logger.warning(f"⚠ PDF generation failed: {e}")
            test_results["steps"]["pdf_generated"] = False
            pdf_bytes = None

        # Step 7: Upload to Cloud Storage (if available)
        logger.info("✓ Step 7: Uploading to Cloud Storage...")
        try:
            from services.storage_service import upload_pdf
            if pdf_bytes:
                pdf_url = upload_pdf(session_id, pdf_bytes)
                test_results["steps"]["storage_uploaded"] = True
                test_results["pdf_url"] = pdf_url
                logger.info(f"✓ PDF uploaded: {pdf_url}")
            else:
                logger.warning("⚠ PDF upload skipped (PDF not generated)")
                test_results["steps"]["storage_uploaded"] = False
        except Exception as e:
            logger.warning(f"⚠ Cloud Storage upload failed: {e}")
            test_results["steps"]["storage_uploaded"] = False

        # Step 8: Save to Firestore (if available)
        logger.info("✓ Step 8: Saving to Firestore...")
        if firestore_db:
            try:
                firestore_db.collection("analyses").document(session_id).set(report.dict())
                test_results["steps"]["firestore_saved"] = True
                logger.info("✓ Firestore save successful")
            except Exception as e:
                logger.warning(f"⚠ Firestore save failed: {e}")
                test_results["steps"]["firestore_saved"] = False
        else:
            logger.info("ℹ Firestore not available (JSON fallback active)")
            test_results["steps"]["firestore_saved"] = False

        # Mark overall success
        test_results["success"] = True
        test_results["session_id"] = session_id
        test_results["verdict"] = verdict
        test_results["health_score"] = health_score

        logger.info("✅ Full-pipeline test completed successfully!")
        return test_results

    except Exception as e:
        logger.error(f"❌ Full-pipeline test failed: {e}", exc_info=True)
        test_results["errors"].append(str(e))
        return test_results


if __name__ == "__main__":
    import uvicorn
    # Honor PORT/HOST from .env (documented in .env.example) instead of
    # hardcoding — matters when running `python main.py` directly rather
    # than `uvicorn main:app --port X` on the CLI.
    run_host = os.getenv("HOST", "0.0.0.0")
    run_port = int(os.getenv("PORT", "8000"))
    # reload_excludes: without this, every /analyze call writes a new
    # PDF/JSON into sessions/ (and every /upload-data writes into uploads/),
    # which the file watcher sees as a source change and restarts the whole
    # server mid-request. These are runtime data dirs, not source code.
    uvicorn.run(
        "main:app", host=run_host, port=run_port, reload=True,
        reload_excludes=["sessions/*", "uploads/*"],
    )
