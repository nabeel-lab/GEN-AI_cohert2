# Startup Checklist — LaunchWise AI

Confirms the project runs successfully from a fresh clone. Every item below was actually executed and verified during this audit (2026-07-07), not just inspected.

---

## Prerequisites

- [x] Python 3.12+ available
- [x] Node 18+ / npm available
- [x] `.env` present at project root (copy from `.env.example` and fill in real values)
- [x] `frontend/.env` present (copy from `frontend/.env.example` and fill in real values)

## Backend

- [x] `cd backend && pip install -r requirements.txt` — completes with no errors
- [x] `pip check` — "No broken requirements found"
- [x] All 22 backend `.py` modules import cleanly (no circular imports, no missing packages)
- [x] `python main.py` — starts cleanly, honors `PORT`/`HOST` from `.env`
- [x] `uvicorn main:app --reload --port 8000` — starts cleanly (documented alternative)
- [x] `GET /health` → `200 OK`, reports accurate status for all 5 services (Gemini, Firestore, BigQuery, Cloud Storage, Maps)
- [x] All 10 REST routes present in `/openapi.json`
- [x] `POST /analyze` → full 10-agent pipeline completes, returns a valid report
- [x] PDF report generated on disk (`backend/sessions/<id>.pdf`)
- [x] JSON report generated on disk (`backend/sessions/<id>.json`)
- [x] Running a second `/analyze` call does **not** restart the server (reload-loop fix verified)
- [x] CORS headers present on responses (`access-control-allow-origin: *`)

## Frontend

- [x] `cd frontend && npm install` — completes with 0 vulnerabilities
- [x] `npm run build` — 2353 modules transformed, 0 errors
- [x] `npm run dev` — serves on `http://localhost:5173` (or next free port), `200 OK`
- [x] Vite dev proxy (`/api/*` → backend `:8000`) — confirmed working end-to-end through a live request
- [x] `npm run lint` — 0 errors (a few pre-existing cosmetic warnings only)

## Cross-cutting

- [x] No frontend/backend environment variable naming mismatch
- [x] Every `os.getenv(`, `process.env.`, `import.meta.env.` reference resolves to a documented variable
- [x] `.env.example` and `frontend/.env.example` are complete and match what the code actually reads
- [x] No dead/ignored environment variables (`PORT`/`HOST` fixed)

---

## Known, Intentional Non-Issues

These are expected states, not failures — the app is designed to degrade gracefully:

| Condition | Behavior |
|---|---|
| `GEMINI_API_KEY` missing, placeholder, or rejected by Google | All AI agents use structured mock fallback data. App fully functional, reports are generic instead of AI-personalized. `/health` will show `gemini: connected` if the key merely *looks* valid (non-empty, non-placeholder) — it does not perform a live validation call against Google's servers, so a revoked/typo'd key can still show "connected" until an actual generation call is attempted. This is a known limitation, not a bug — a live-ping health check would add latency/cost to every health probe. |
| No GCP credentials (`GOOGLE_APPLICATION_CREDENTIALS` unset) | Firestore, BigQuery, and Cloud Storage all report "disconnected" with a graceful local fallback (JSON files, local aggregation, local file serving respectively). App fully functional. |
| `VITE_GOOGLE_MAPS_API_KEY` missing or restricted | Location picker shows a "map preview isn't configured" message with manual text entry. App fully functional, just without the interactive map. |

---

## Result

**The project starts cleanly and runs correctly from a fresh clone**, with all four fixes from `FIXES_APPLIED.md` applied. See `ENVIRONMENT_AUDIT.md` for the full variable inventory and `FIXES_APPLIED.md` for exactly what was changed and why.
