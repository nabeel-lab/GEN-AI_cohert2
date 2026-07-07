# LaunchWise AI - Decision Intelligence Platform

**Know before you launch.** 🚀

An AI-powered platform that analyzes business ideas using 10 specialized agents, delivers Go/No-Go verdicts in under 60 seconds, and provides investor-ready reports with dynamic simulations.

---

## 🎯 What It Does

LaunchWise AI takes a business idea and runs it through 10 specialized agents:

1. **Business Intelligence Agent** - Analyzes business model and value proposition
2. **Market Analysis Agent** - Evaluates market demand and growth potential
3. **Competitor Intelligence Agent** - Maps competitive landscape with SWOT
4. **Location Scoring Agent** - Assesses location viability (footfall, competition, growth)
5. **Financial Forecast Agent** - Projects revenue, costs, ROI, break-even timeline
6. **Customer Personas Agent** - Identifies target customer segments
7. **Supply Chain Analysis Agent** - Evaluates sourcing and operational feasibility
8. **Marketing Strategy Agent** - Plans market entry and acquisition strategy
9. **Risk Prediction Agent** - Scores operational, market, and financial risks
10. **Go/No-Go Decision Agent** - Synthesizes all insights into final verdict

**Output:** Investor-ready PDF report, business health score (0-100), confidence score, ROI projection, risk assessment, and a clear recommendation.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node 16+
- Optional: Google Cloud credentials for enhanced features

### Local Development

```bash
# 1. Clone and setup
git clone <repo>
cd google\ ai\ model

# 2. Backend setup
cd backend
pip install -r requirements.txt
export GEMINI_API_KEY="your-api-key"  # Optional, will use mock fallback
python -m uvicorn main:app --reload   # Starts on http://localhost:8000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev                             # Starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

### Environment Variables

Create a `.env` file in the project root:

```bash
# Gemini API (optional, mock fallback active if not set)
GEMINI_API_KEY=your-gemini-api-key

# Google Cloud (all optional - local fallbacks active)
GOOGLE_CLOUD_PROJECT=your-gcp-project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
FIRESTORE_DATABASE=(default)
STORAGE_BUCKET=your-gcs-bucket
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

**Note:** LaunchWise works perfectly without GCP credentials. Local fallbacks ensure zero downtime:
- No Gemini key? Mock responses used
- No Firestore? JSON sessions stored locally
- No BigQuery? Analytics aggregated from local JSON
- No Cloud Storage? PDFs served from local directory
- No Maps API? Maps embedding skipped

---

## 📱 Using the Platform

### 1. Demo Mode (Instant)
Click "Try a Pre-Built Demo" on the landing page to see instant analysis of:
- Specialty Coffee Café (Indiranagar, ₹15L, GO verdict)
- Premium 24/7 Gym (Whitefield, ₹25L, PROCEED WITH CAUTION)
- Casual Dining Restaurant (Koramangala, ₹30L, GO verdict)

### 2. Run Your Own Analysis
1. Click "Analyze My Business Idea"
2. Fill in: business type, location, budget, description
3. Click "Run Analysis" (wait ~60 seconds)
4. Review executive summary and 8 detailed reports

### 3. What-If Simulator
On the results page (bottom right):
- Adjust budget slider (₹5L-₹50L)
- Change marketing multiplier (0.5x-2.0x)
- Modify competition density (0-100)
- Override rent estimate
- See scores recalculate live

### 4. AI Chat Assistant
On the results page (bottom left):
- Ask questions about your analysis
- Get grounded answers backed by the report
- No hallucination - only data from your analysis

### 5. Analytics Dashboard
Click "Analytics" in the top navigation:
- See aggregated metrics across all analyses
- Pie chart of GO/CAUTION/NO GO decisions
- Bar chart of top business types
- Table of top locations with performance

### 6. Download Report
On results page:
- Click "Report" tab
- Scroll to download PDF
- Share with investors/stakeholders

---

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── main.py                 # FastAPI app, 9 REST endpoints
├── models.py               # Pydantic schemas for all data
├── agents/                 # 10 specialized AI agents
│   ├── gemini_helper.py   # Gemini 1.5 Flash client
│   ├── business_agent.py  # Business profile analysis
│   ├── market_agent.py    # Market intelligence
│   ├── competitor_agent.py # Competitive analysis
│   ├── location_agent.py  # Location scoring
│   ├── finance_agent.py   # Financial projections
│   ├── persona_agent.py   # Customer segmentation
│   ├── supply_chain_agent.py # Sourcing analysis
│   ├── marketing_agent.py # Go-to-market strategy
│   ├── risk_agent.py      # Risk assessment
│   ├── decision_agent.py  # Final recommendation
│   ├── chat_agent.py      # Q&A grounding
│   └── analytics_agent.py # Dataset processing
├── services/              # GCP integrations
│   ├── bigquery_service.py
│   ├── storage_service.py
│   └── pdf_service.py
├── sessions/              # Local fallback storage
└── requirements.txt

**Endpoints:**
- POST /analyze                  → Run full pipeline
- POST /simulate                 → What-If Simulator
- POST /chat                     → AI Chat
- GET /analytics/summary         → Platform metrics
- GET /health                    → Service status
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Hero, demos, features
│   │   ├── AnalysisPage.jsx     # Form submission
│   │   ├── ResultsPage.jsx      # Report display + panels
│   │   └── AnalyticsPage.jsx    # Platform dashboard
│   ├── components/
│   │   ├── ChatPanel.jsx        # AI Assistant (floating)
│   │   └── WhatIfSimulator.jsx  # Budget sliders (floating)
│   ├── data/
│   │   └── demoScenarios.js     # 3 pre-built reports
│   └── App.jsx                  # Routing
├── public/
└── vite.config.js               # Proxy: /api → :8000

**Styling:**
- Tailwind CSS
- Dark theme with gold accents
- Responsive design
- Smooth animations
```

### Google Cloud Services
```
┌─────────────────────────────────────┐
│      LaunchWise AI Backend          │
└────────┬──────────────────┬─────────┘
         │                  │
    ┌────▼─────┐      ┌─────▼────┐
    │  Gemini  │      │ Firestore │
    │  1.5 Flash    │ (optional) │
    └──────────┘      └───────────┘
         │                  │
         │         ┌────────┴────────┐
         │         │                 │
         └────┬────▼──────┬──────────▼──┐
              │  BigQuery │  Cloud      │
              │           │  Storage    │
              │(optional) │ (optional)  │
              └───────────┴─────────────┘

All services: OPTIONAL with local fallbacks
```

---

## 📦 Deployment

### Docker (Local)
```bash
docker compose up
# Backend: http://localhost:8000
# Frontend: http://localhost:8080
```

### Google Cloud Run
```bash
# Backend
gcloud run deploy launchwise-backend \
  --source backend/ \
  --runtime python311 \
  --port 8000 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<key>

# Frontend
gcloud run deploy launchwise-frontend \
  --source frontend/ \
  --allow-unauthenticated
```

### Kubernetes
```bash
kubectl apply -f k8s/
# Deploys backend (2 replicas) + frontend (2 replicas)
```

### Helm
```bash
helm install launchwise ./helm/launchwise/
```

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health | jq
# Returns service status for each integration
```

### Try an Analysis
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "business_type": "Coffee Shop",
    "location": "Bangalore",
    "budget": 1500000,
    "description": "Premium specialty coffee targeting tech workers"
  }' | jq '.decision'
```

### View Demo
```bash
# Open http://localhost:5173
# Click "Try a Pre-Built Demo"
```

---

## 📊 Data Flow

```
User Input
    ↓
[Form: Business Type, Location, Budget, Description]
    ↓
FastAPI /analyze endpoint
    ↓
10-Agent Orchestration (sequential)
    ├─ Gemini API calls (with mock fallback)
    ├─ Location scoring (deterministic)
    ├─ Financial projections (hardcoded model)
    └─ Risk assessment (rules-based)
    ↓
Score Aggregation (8 components, fixed weights)
    ├─ Market: 20%
    ├─ Location: 15%
    ├─ Finance: 15%
    ├─ Competition: 10%
    ├─ Risk: 15%
    ├─ Customer Fit: 10%
    ├─ Supply Chain: 7.5%
    └─ Marketing: 7.5%
    ↓
Health Score (0-100) + Confidence + Verdict
    ↓
Report Generation
    ├─ JSON (sessionStorage on frontend)
    ├─ Firestore (if available)
    └─ BigQuery (if available)
    ↓
PDF Creation (ReportLab)
    └─ Cloud Storage or local serving
    ↓
Response to Frontend
    ├─ Display in Results page
    ├─ Enable What-If Simulator
    └─ Enable Chat Assistant
    ↓
Analytics Aggregation
    └─ BigQuery or local JSON aggregation
    ↓
Dashboard Display
    └─ KPIs, charts, location table
```

---

## 🔒 Security & Privacy

- ✅ No data persisted without consent (local-first by default)
- ✅ Optional: Cloud storage for backups
- ✅ Input validation via Pydantic
- ✅ Graceful error handling (no sensitive data in errors)
- ✅ CORS configured for frontend/backend isolation
- ✅ Environment variables for secrets (no hardcoding)

---

## 🛠️ Troubleshooting

### "Module not found" errors
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### Port already in use
```bash
# Kill existing process
lsof -i :8000    # Find process on 8000
kill -9 <PID>    # Kill it

# Or use different port
python -m uvicorn main:app --port 9000
```

### Gemini API errors
LaunchWise handles this gracefully:
- If key is invalid/missing: Mock responses used
- If quota exceeded: Mock fallback
- Check: `curl http://localhost:8000/health | jq '.services.gemini'`

### Analytics showing no data
- Ensure analyses have been completed (saved to `backend/sessions/`)
- Check: `ls backend/sessions/ | wc -l` (should show session files)
- Try: Run a demo or new analysis to generate data

### Maps not showing
- Optional feature, doesn't break functionality
- Set `GOOGLE_MAPS_API_KEY` in `.env` to enable
- Check: Results page loads even without Maps API

---

## 📚 API Reference

### POST /analyze
**Analyze a business idea**

```json
Request:
{
  "business_type": "Coffee Shop",
  "location": "Indiranagar, Bangalore",
  "budget": 1500000,
  "description": "Premium specialty coffee targeting remote workers"
}

Response:
{
  "session_id": "uuid-here",
  "business_profile": {...},
  "market_research": {...},
  "competitors": {...},
  "location_research": {...},
  "financial_outlook": {...},
  "risk_assessment": {...},
  "customer_personas": [...],
  "supply_chain_analysis": [...],
  "marketing_strategy": [...],
  "decision": {
    "go_no_go": "GO",
    "business_health_score": 72,
    "confidence_score": 78,
    "confidence_factors": [...]
  },
  "pdf_url": "http://...",
  "json_url": "http://..."
}
```

### POST /simulate
**Run what-if scenario**

```json
Request:
{
  "session_id": "uuid-here",
  "budget": 2000000,
  "marketing_multiplier": 1.5,
  "competition_density": 45,
  "rent_override": 50000
}

Response:
{
  "business_health_score": 68,
  "confidence_score": 72,
  "go_no_go": "PROCEED WITH CAUTION",
  "risk_score": 55,
  "risk_level": "Medium",
  "roi_percentage": 18.5,
  "break_even_months": 10,
  "score_breakdown": {
    "market": 78,
    "location": 82,
    "finance": 42,
    ...
  }
}
```

### POST /chat
**Ask AI assistant**

```json
Request:
{
  "session_id": "uuid-here",
  "question": "What are the biggest risks for this business?"
}

Response:
{
  "answer": "Based on your analysis, the biggest risks are..."
}
```

### GET /analytics/summary
**Platform aggregation**

```json
Response:
{
  "source": "local_json | bigquery",
  "total_reports": 13,
  "avg_health_score": 61.4,
  "avg_roi": -64.1,
  "avg_risk_score": 52.5,
  "decision_distribution": {
    "GO": 3,
    "PROCEED WITH CAUTION": 8,
    "NO GO": 2
  },
  "by_business_type": [...],
  "by_location": [...]
}
```

### GET /health
**Service status**

```json
Response:
{
  "status": "healthy",
  "timestamp": "2026-07-06T...",
  "services": {
    "gemini": "connected",
    "firestore": "disconnected (JSON fallback active)",
    "bigquery": "disconnected (local aggregation)",
    "storage": "disconnected (local serving)",
    "maps": "configured"
  },
  "fallbacks": {
    "sessions_dir": true,
    "uploads_dir": true
  }
}
```

---

## 🎓 Learning Resources

- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI Guide](https://fastapi.tiangolo.com/)
- [Google Generative AI Python SDK](https://ai.google.dev/tutorials/python_quickstart)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! The codebase is structured for easy extension:

### Adding a New Agent
1. Create `backend/agents/new_agent.py`
2. Implement function returning appropriate model
3. Export in `backend/agents/__init__.py`
4. Integrate in `main.py` orchestration
5. Add tests

### Adding a New GCP Service
1. Create `backend/services/new_service.py`
2. Implement with graceful fallback
3. Export in `backend/services/__init__.py`
4. Integrate in main.py where needed

### Frontend Components
1. Create in `frontend/src/components/`
2. Use existing styling (Tailwind + dark theme)
3. Follow React hooks patterns
4. Test responsiveness

---

## 🚀 Deployment Checklist

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for production readiness verification and deployment instructions.

---

**Built with:** Python, FastAPI, React, Tailwind, Gemini 1.5 Flash, Google Cloud



