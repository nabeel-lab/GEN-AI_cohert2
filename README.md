# LaunchWise AI

**LaunchWise AI** is an AI-powered decision intelligence platform that evaluates a business idea — a café, a gym, a restaurant, any local venture — and returns an investor-ready Go/No-Go verdict in under a minute. It runs the idea through a pipeline of specialized AI agents that each analyze one dimension of viability (market, competition, location, finance, risk, personas, supply chain, marketing) and synthesizes their output into a single business health score, ROI projection, and downloadable report.

---

## Problem Statement

Most first-time entrepreneurs decide where and how to launch a business using intuition, a handful of Google searches, and a rough spreadsheet. Professional market research, financial modeling, and competitive analysis are expensive, slow, and usually reserved for later-stage ventures — by the time the founder can afford real diligence, the capital is often already committed. There is no accessible, fast, structured way for someone with an idea to stress-test it before spending money.

## Solution

LaunchWise AI compresses that diligence process into a single guided flow. A founder describes their business idea, location, and budget; a network of AI agents analyzes market demand, competitor density, location viability, financial projections, customer personas, supply chain feasibility, marketing strategy, and risk factors in parallel; and the platform returns a synthesized verdict — GO, PROCEED WITH CAUTION, or NO GO — backed by a business health score, an investor-ready PDF report, and an interactive What-If simulator for testing different assumptions.

---

## Key Features

- **10-agent AI pipeline** — orchestrated analysis across market, competitor, location, finance, persona, supply chain, marketing, risk, and decision domains
- **Go/No-Go verdict** with a 0–100 business health score and confidence rating
- **Investor-ready PDF export** alongside raw JSON export for programmatic use
- **What-If Simulator** — live re-scoring as budget, marketing spend, competition density, or rent assumptions change
- **AI Chat Assistant** — grounded Q&A scoped to the generated report (no hallucinated figures)
- **AI Consultant** — free-form conversational advisory agent for founders
- **Analytics dashboard** — aggregated metrics across all analyses (decision distribution, top locations, top business types)
- **Live map integration** — location intelligence rendered on Google Maps
- **Pre-built demo scenarios** — three fully worked example reports (café, gym, restaurant) for instant exploration with no sign-up required
- **Continuous-scroll report UI** with sidebar scrollspy navigation
- **Runs entirely on Gemini's free tier** — no billing account required to demo or develop

---

## Architecture

```
┌────────────────────────┐        ┌──────────────────────────────┐
│   React + Vite SPA     │ ─────▶ │        FastAPI Backend        │
│  (Tailwind, Framer      │  /api  │  10-agent orchestration        │
│   Motion, Recharts)     │ ◀───── │  Mock-JWT auth · SQLite        │
└────────────────────────┘        └───────────┬────────────────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
              Google Gemini              Google Maps API         Firestore / BigQuery /
           (AI Studio, free tier)      (Places, Geocoding)     Cloud Storage (optional,
                                                                 graceful local fallback)
```

The frontend never talks to Google Cloud directly — every external call is proxied through the FastAPI backend, which is the only service holding API keys. In local development, Vite proxies `/api/*` to the backend; in production, the same relative-path convention is served through an nginx reverse proxy, so no environment-specific URLs are hardcoded anywhere in the client.

---

## Technology Stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Google Maps JavaScript API

**Backend:** FastAPI, Python 3.12, Pydantic, SQLAlchemy + SQLite, ReportLab (PDF generation), Uvicorn

**AI:** Google Gemini (`gemini-2.5-flash` via the `google-genai` SDK, AI Studio API-key auth — free tier, no billing account needed)

**Infrastructure:** Docker, Docker Compose, Kubernetes manifests, Helm chart, Google Cloud Run

---

## Google Cloud Services Used

| Service | Purpose | Required? |
|---|---|---|
| **Gemini API (AI Studio)** | Core reasoning engine for all 10 agents | Yes — free tier |
| **Google Maps JavaScript / Places / Geocoding API** | Location intelligence, map rendering | Optional — graceful skip if unset |
| **Cloud Firestore** | Persisted report storage | Optional — falls back to local JSON |
| **BigQuery** | Cross-report analytics aggregation | Optional — falls back to local aggregation |
| **Cloud Storage** | Hosted PDF report files | Optional — falls back to local file serving |
| **Cloud Run** | Production hosting for frontend + backend | Deployment target only |

Every optional integration degrades gracefully — the platform is fully functional using only a free-tier `GEMINI_API_KEY`, with no Google Cloud project or billing account required.

---

## AI Agent Pipeline

Each business analysis is broken down and delegated to specialized agents, then synthesized into one verdict:

1. **Business Agent** — business model and value proposition analysis
2. **Market Agent** — demand signals, growth trajectory, Total Addressable Market
3. **Competitor Agent** — competitive landscape mapping and saturation analysis
4. **Location Agent** — footfall, accessibility, and zoning viability
5. **Finance Agent** — 12-month revenue/cost projection and break-even modeling
6. **Persona Agent** — target customer segmentation and psychographics
7. **Supply Chain Agent** — sourcing and operational feasibility
8. **Marketing Agent** — go-to-market and acquisition strategy
9. **Risk Agent** — regulatory, market, and operational risk scoring
10. **Decision Agent** — synthesizes all prior agent outputs into the final Go/No-Go verdict and business health score

Supporting agents handle report Q&A (**Chat Agent**), free-form advisory conversation (**Consult / Conversation Agents**), dataset-driven analytics (**Analytics Agent**), and narrative insight generation (**Insights Agent**).

---

## Project Workflow

1. User submits a business idea (type, location, budget, description) or selects a pre-built demo
2. The backend orchestrates all 10 agents, each calling Gemini with a domain-specific prompt
3. Agent outputs are aggregated into a weighted business health score, confidence score, and Go/No-Go verdict
4. A structured `FinalReport` is persisted (SQLite + optional Firestore) and a PDF is generated
5. The frontend renders the full report as a continuous scrollable page with sidebar scrollspy navigation
6. The user can run What-If simulations, ask the AI Chat Assistant questions grounded in the report, or download the PDF/JSON

---

## Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Google AI Studio](https://aistudio.google.com/app/apikey) API key

### Clone

```bash
git clone https://github.com/nabeel-lab/GEN-AI_cohert2.git
cd GEN-AI_cohert2
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` in the project root and fill in your values:

```bash
# Required — free tier, generate at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key

# Optional — Google Cloud Project (enables Firestore/BigQuery/Storage)
PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_PROJECT=your-gcp-project-name
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Optional
FIRESTORE_DATABASE=your-firestore-database-id
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
STORAGE_BUCKET=your-gcs-bucket-name

# Server (only honored via `python main.py`, not `uvicorn` CLI flags)
PORT=8000
HOST=0.0.0.0
```

Every variable besides `GEMINI_API_KEY` is optional — the app runs fully functional with local fallbacks if omitted.

---

## Run Locally

```bash
# Terminal 1 — backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the backend on port 8000.

---

## Docker

```bash
docker compose up
# Backend:  http://localhost:8000
# Frontend: http://localhost:8080
```

`docker-compose.yml` mirrors the Cloud Run deployment topology (frontend and backend as separate containers) for local integration testing of the built images.

---

## Cloud Run Deployment

```bash
# Backend
gcloud run deploy launchwise-backend \
  --source backend/ \
  --port 8000 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<your-key>

# Frontend (built with the backend's Cloud Run URL injected at build time)
gcloud run deploy launchwise-frontend \
  --source frontend/ \
  --allow-unauthenticated
```

Kubernetes manifests (`k8s/`) and a Helm chart (`helm/launchwise/`) are also included for cluster-based deployment.

---

## Project Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI app and route definitions
│   ├── auth.py                 # Mock-JWT auth dependencies
│   ├── database.py             # SQLAlchemy models (SQLite)
│   ├── models.py                # Pydantic request/response schemas
│   ├── agents/                 # 10 core agents + chat/consult/analytics agents
│   ├── services/                # PDF generation, BigQuery, Cloud Storage integrations
│   ├── sessions/                # Local fallback report storage
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # LandingPage, AnalysisPage, ResultsPage, AnalyticsPage, ConsultantPage, ProjectsPage
│   │   ├── components/          # ChatPanel, WhatIfSimulator, ProductTour, Navbar
│   │   ├── context/             # AuthContext (mock-JWT session management)
│   │   ├── data/                # Pre-built demo scenarios
│   │   └── App.jsx              # Routing
│   ├── public/demo/             # Pre-generated demo PDF reports
│   └── vite.config.js           # Dev proxy: /api → :8000
├── k8s/                         # Kubernetes manifests
├── helm/launchwise/              # Helm chart
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service and integration status |
| GET | `/auth/me` | Current authenticated user |
| GET | `/projects` | List a user's saved projects |
| POST | `/analyze` | Run the full 10-agent analysis pipeline |
| GET | `/report/{session_id}` | Fetch a completed report |
| GET | `/report-file/{filename}` | Serve a locally stored report file |
| GET | `/download-report/{session_id}` | Download the report PDF |
| POST | `/upload-data` | Upload a dataset for KPI extraction |
| POST | `/simulate` | Run a What-If scenario against an existing report |
| POST | `/chat` | Ask the AI Chat Assistant a question grounded in a report |
| POST | `/consult` | Free-form AI Consultant conversation |
| GET | `/analytics/summary` | Aggregated platform-wide analytics |

All endpoints except `/health` and the demo-report path expect a `Bearer` token in the `Authorization` header (mock-JWT, issued client-side — see [Environment Variables](#environment-variables)).

---

## Future Scope

- Real OAuth/identity provider integration in place of the current mock-JWT scheme
- Persisted multi-user collaboration on a single project/report
- Expanded agent set (e.g. legal/regulatory compliance, hiring plan generation)
- Historical trend tracking for re-analyzed businesses over time
- Native mobile app wrapping the existing report experience

## Known Limitations

- Authentication is a client-side mock-JWT scheme, not a production identity provider — suitable for demo/hackathon use, not for handling real user credentials
- Firestore, BigQuery, and Cloud Storage integrations are optional and fall back to local storage; multi-instance deployments without these configured will not share state across instances
- Financial and scoring models use fixed weightings rather than a trained predictive model
- Google Maps features are skipped entirely if `GOOGLE_MAPS_API_KEY` is not configured

---

## Contributors

- Saad Riyaz Mohammed ([@saad-46](https://github.com/saad-46))
- Mohammed Nabeeluddin ([@nabeel-lab](https://github.com/nabeel-lab))

---

Built by Saad and Nabeel.

---
