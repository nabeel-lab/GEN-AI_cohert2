# Environment Variable Audit — LaunchWise AI

**Date:** 2026-07-07
**Scope:** Every `os.getenv(`, `process.env.`, and `import.meta.env.` reference in the repository, cross-checked against `.env`, `.env.example`, `frontend/.env`, `frontend/.env.example`, and deployment configs (`docker-compose.yml`, `frontend/Dockerfile`, `k8s/`, `helm/`).

---

## Summary

| Check | Result |
|---|---|
| Frontend/backend variable name mismatch (the `VITE_GOOGLE_MAPS_API_KEY` vs `GOOGLE_MAPS_API_KEY` issue reported) | ✅ Not present in current files — see note below |
| All variables referenced in code exist in `.env`/`.env.example` | ✅ Yes, after adding `GOOGLE_APPLICATION_CREDENTIALS` (see Fixes) |
| Frontend vars correctly `VITE_`-prefixed | ✅ Yes |
| Backend vars correctly un-prefixed | ✅ Yes |
| Dead/unused env vars (declared but never read) | ✅ Fixed — `PORT`/`HOST` were declared but ignored; now honored |

**Important clarification on the reported mismatch:** the task described root `.env` containing `VITE_GOOGLE_MAPS_API_KEY` while `.env.example` contained `GOOGLE_MAPS_API_KEY`. As audited now, the root `.env` correctly contains `GOOGLE_MAPS_API_KEY` (matching `.env.example`), and the separate `frontend/.env` file correctly contains `VITE_GOOGLE_MAPS_API_KEY` (matching `frontend/.env.example`). These are **two intentionally different variables in two intentionally different files** — not a naming bug. See the "Why two Maps keys?" section below for why this split is correct Vite behavior, not a mismatch to "fix" by unifying the name.

---

## Full Variable Inventory

### Backend (Python / FastAPI) — read via `os.getenv(...)`

| Variable | Used in | Required? | Default if unset | Description |
|---|---|---|---|---|
| `GEMINI_API_KEY` | `backend/agents/gemini_helper.py` | Soft-required | none (falls back to mock AI responses) | Google AI Studio key for Gemini 1.5 Flash. Powers 3 live agents (Business Intelligence, Market Analysis, Go/No-Go Decision synthesis). Without a **valid** key, all three silently return mock/fallback data — the app still runs, but every report is generic instead of AI-generated. Generate at https://aistudio.google.com/app/apikey |
| `GOOGLE_CLOUD_PROJECT` | `backend/main.py`, `backend/services/bigquery_service.py` | Optional | `"launchwise-ai"` | GCP project name used to initialize Firestore and BigQuery clients. |
| `PROJECT_ID` | `backend/main.py` | Optional | value of `GOOGLE_CLOUD_PROJECT` | GCP project ID (may differ from the project *name* above — e.g. `launchwise-ai-501610` vs `launchwise-ai`). Also referenced as a placeholder in `k8s/deployment.yaml` and `helm/launchwise/values.yaml` image tags. |
| `FIRESTORE_DATABASE` | `backend/main.py` | Optional | `"(default)"` | Named Firestore database ID. Only matters if Firestore is active (see `GOOGLE_APPLICATION_CREDENTIALS` below); otherwise the app uses the local JSON session fallback and this value is unused. |
| `STORAGE_BUCKET` | `backend/main.py`, `backend/services/storage_service.py` | Optional | `""` (disabled) | GCS bucket name for storing generated PDF/JSON reports. If empty or the bucket is unreachable, reports are served from the local `backend/sessions/` folder instead — no functionality is lost. |
| `GOOGLE_MAPS_API_KEY` | `backend/main.py` | Optional | `""` | **Backend-only.** Used solely to populate the `/health` endpoint's `maps: configured/not configured` status field. The backend never makes an actual Google Maps API call — all Maps usage (Maps JavaScript API, Places API New, Geocoding API) happens client-side in the browser via the separate `VITE_GOOGLE_MAPS_API_KEY` (see Frontend section). |
| `GOOGLE_APPLICATION_CREDENTIALS` | `backend/main.py` | Optional | none | Standard Google Cloud Application Default Credentials variable — path to a service-account JSON key file, or omitted if using `gcloud auth application-default login`. Enables Firestore, BigQuery, and Cloud Storage. Without it, all three gracefully fall back to local storage/aggregation. **Was missing from `.env.example`** — added (see Fixes Applied). |
| `PORT` | `backend/main.py` | Optional | `8000` | Port the backend binds to **when started via `python main.py`** directly. Was previously declared in `.env`/`.env.example` but silently ignored by the code (hardcoded `port=8000`) — fixed to actually be read (see Fixes Applied). Has no effect when starting via `uvicorn main:app --port X` on the CLI, since the CLI flag takes precedence there. |
| `HOST` | `backend/main.py` | Optional | `"0.0.0.0"` | Same as `PORT` above — bind host for `python main.py` direct invocation. Previously dead, now honored. |

### Frontend (React / Vite) — read via `import.meta.env....`

| Variable | Used in | Required? | Default if unset | Description |
|---|---|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | `frontend/src/lib/googleMaps.js` (loaded by `LocationPicker.jsx` and the results-page `LocationMap`) | Optional (graceful fallback UI) | `""` | **Frontend-only**, must live in `frontend/.env` (not the root `.env`) and must carry the `VITE_` prefix — Vite only exposes `VITE_*`-prefixed variables to the browser bundle; anything else is stripped for security. Powers the interactive map: Maps JavaScript API (rendering), Places API (New) (search autocomplete), Geocoding API (reverse geocoding on pin drop). Without it, the picker shows a "map preview isn't configured" message with a manual text-entry fallback — the app still functions. |

### Deployment-only (not part of `.env` — set via container/orchestration config)

| Variable | Used in | Required? | Default if unset | Description |
|---|---|---|---|---|
| `BACKEND_URL` | `frontend/entrypoint.sh` → `frontend/nginx.conf` | Optional | `http://backend:8000` | Production-container-only variable. At container startup, `entrypoint.sh` substitutes this into `nginx.conf`'s `/api/` reverse-proxy target. Set via Cloud Run service config or `docker-compose.yml` — never via a `.env` file, since it only matters after the frontend is already built and running as a container, not during `npm run dev`. |

---

## Why two separate Maps keys? (not a bug)

Vite's environment model deliberately draws a hard line: only variables prefixed `VITE_` are inlined into the client-side JavaScript bundle at build time. Everything else in a `.env` file is invisible to browser code — this is a security feature, not an oversight, since it prevents accidentally shipping backend secrets (like `GEMINI_API_KEY`) to every visitor's browser.

Because of this:
- The **backend** reads its own copy from the **root** `.env` as `GOOGLE_MAPS_API_KEY` (plain, backend-only convention, matches every other backend var in that file).
- The **frontend** reads its own copy from **`frontend/.env`** (a separate file, in a separate directory) as `VITE_GOOGLE_MAPS_API_KEY`.

Both currently hold the *same* actual API key value (copy-pasted into both files), which is expected — they're the same Google Cloud Platform key, just declared twice because two different runtimes (Python backend, browser-bundled frontend) each need their own copy under the naming convention that runtime requires. Renaming one to match the other would either break Vite's bundling (if the frontend one lost its `VITE_` prefix) or be misleading (if the backend one gained a `VITE_` prefix it doesn't need). The two-file, two-name setup is correct and is called out with comments in both `.env.example` files.

---

## Verification Performed

- ✅ `npm install` — completes cleanly, 0 vulnerabilities
- ✅ `npm run build` — 2353 modules transformed, 0 errors
- ✅ `npm run dev` — serves on port 5173/5174, HTTP 200
- ✅ `pip install -r requirements.txt` — all satisfied
- ✅ `pip check` — "No broken requirements found"
- ✅ `python main.py` — starts cleanly, honors `PORT`/`HOST` (after fix)
- ✅ `uvicorn main:app --reload --port 8000` — starts cleanly
- ✅ All 22 backend `.py` modules import with zero errors (no circular imports, no missing packages, no broken relative paths)
- ✅ `GET /health` — returns 200, all 5 services report accurate status
- ✅ `POST /analyze` — full 10-agent pipeline runs end-to-end 3× with different inputs, generates PDF + JSON reports on disk
- ✅ CORS — `access-control-allow-origin: *` confirmed present on responses
- ✅ Vite dev proxy (`/api/*` → backend) — confirmed working end-to-end
- ✅ All 10 registered FastAPI routes present in `/openapi.json`
