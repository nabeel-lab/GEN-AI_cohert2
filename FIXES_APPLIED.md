# Fixes Applied — LaunchWise AI Startup Audit

**Date:** 2026-07-07

This document lists every issue found during the full-project audit and what was done about each one. Issues are ordered by how they were discovered, not by severity.

---

## 1. Reported env var mismatch — investigated, found already resolved

**Reported symptom:** root `.env` containing `VITE_GOOGLE_MAPS_API_KEY` while `.env.example` contained `GOOGLE_MAPS_API_KEY`.

**Finding:** as of this audit, the root `.env` correctly contains `GOOGLE_MAPS_API_KEY` (matching `.env.example`), and the separate `frontend/.env` correctly contains `VITE_GOOGLE_MAPS_API_KEY` (matching `frontend/.env.example`). No code or config change was needed here — the two variables are intentionally distinct (see `ENVIRONMENT_AUDIT.md` → "Why two Maps keys?"). This is documented clearly so it isn't mistaken for a bug again.

**Action taken:** none required. Verified and documented.

---

## 2. Missing `GOOGLE_APPLICATION_CREDENTIALS` documentation

**Issue:** `backend/main.py` reads `os.getenv("GOOGLE_APPLICATION_CREDENTIALS")` to decide whether to attempt a Firestore connection, but this variable was never listed in `.env.example`, so a fresh clone had no indication it existed or what it was for.

**Fix:** added a documented, commented-out entry to `.env.example` explaining what it does and that it's optional (Firestore/BigQuery/Storage all have local fallbacks).

**File:** `.env.example`

---

## 3. `PORT` / `HOST` env vars were declared but silently ignored (dead config)

**Issue:** `.env` and `.env.example` both declare `PORT=8000` and `HOST=0.0.0.0`, implying they configure the backend's bind address. In reality, `backend/main.py`'s `if __name__ == "__main__":` block hardcoded `uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)` — changing the `.env` values had zero effect. This is misleading: anyone trying to run the backend on a different port via `.env` would silently fail and not know why.

**Fix:** the startup block now reads `os.getenv("HOST", "0.0.0.0")` and `int(os.getenv("PORT", "8000"))` and passes them to `uvicorn.run(...)`. Verified by starting with `PORT=8123` and confirming the intended bind port took effect (only fails to matter when invoking via `uvicorn main:app --port X` on the CLI, where the CLI flag correctly takes precedence — documented in `.env.example`).

**File:** `backend/main.py`

---

## 4. Real bug: Gemini Google Search grounding tool crashes every call, silently degrading to mock data

**Issue:** `backend/agents/gemini_helper.py`'s `call_gemini_json(..., enable_search=True)` — used by the Market Analysis agent — passed `tools=[{"google_search_retrieval": {}}]` to `genai.GenerativeModel(...)`. The installed SDK (`google-generativeai==0.7.2`)'s underlying `Tool` protobuf schema was checked directly (`glm.Tool()` field inspection) and only exposes `function_declarations` and `code_execution` — there is no `google_search_retrieval` field in this SDK version at all. Every single grounded call raised `Unknown field for FunctionDeclaration: google_search_retrieval` and fell straight through to the hardcoded mock fallback — meaning the Market Analysis agent **never** got a real, search-grounded answer from Gemini, even with a perfectly valid API key. This was invisible in normal operation because the exception handler already existed and silently substituted mock data — the app "worked," it just never delivered the real-time market intelligence the feature was built for.

**Fix:** `call_gemini_json` now attempts the call with the search tool first; if that specific call fails, it automatically retries the *same prompt* without the tool, so the agent still gets a live Gemini answer (just without search grounding) instead of falling all the way back to static mock data. A genuine failure (e.g. an invalid API key) still correctly falls through to mock after the retry — no infinite loop, no behavior change for that case.

**Verification:** three unit-level scenarios were tested directly against the patched function:
1. Search-tool call fails with the exact SDK error → retries without tools → returns the real (non-mock) result. ✅
2. A genuine failure (bad key) on both attempts → falls back to mock cleanly, no crash. ✅
3. Non-search calls never touch the retry path — exactly one request made. ✅

Then confirmed against the live pipeline: running `/analyze` produced the log line `Gemini search-grounding unavailable on this SDK, retrying without it` (correct new behavior) instead of the old dead-end mock fallback.

**File:** `backend/agents/gemini_helper.py`

**Note:** a proper long-term fix would be upgrading to the current `google-genai` SDK, which has first-class Search grounding support with a different tool schema. That's a larger, riskier change (different import path, different call signature) and was intentionally left out of this audit to avoid changing working behavior beyond what's necessary — flagged here as a "Future Scope" item instead.

---

## 5. Real bug: dev server reload loop triggered by the app's own output files

**Issue:** `backend/main.py`'s `python main.py` startup path uses `uvicorn.run(..., reload=True)` with no `reload_excludes`. By default, uvicorn's file watcher monitors the entire working directory (`backend/`) for changes — which includes `backend/sessions/` and `backend/uploads/`, the exact folders the app writes to on every `POST /analyze` (new PDF + JSON per report) and `POST /upload-data` call. This meant **every successful analysis triggered the file watcher to detect a "source change" and restart the entire server mid-session** — the single most core feature of the app (running an analysis) was quietly sabotaging its own dev server uptime. In a demo or hackathon judging context, running two analyses back-to-back could restart the server between them.

**Fix:** added `reload_excludes=["sessions/*", "uploads/*"]` to the `uvicorn.run(...)` call, so the watcher ignores the app's own runtime data directories and only reloads on genuine source-code changes.

**Verification:** ran the backend via `python main.py`, confirmed the reloader started exactly once (`grep -c "Started server process"` = 1), fired a real `POST /analyze` call (which wrote new files into `sessions/`), waited, and confirmed the server was still the *same process* (identical PID in `netstat`) with no second "Started server process" line in the log — proving the restart loop is gone.

**File:** `backend/main.py`

---

## Issues investigated and found to be non-issues (no fix needed)

| Investigated | Finding |
|---|---|
| Circular imports across all 22 backend `.py` modules | None — every module imports cleanly in isolation |
| Missing Python packages | None — `pip install -r requirements.txt` and `pip check` both clean |
| Frontend build errors | None — `npm run build` completes with 0 errors (only a bundle-size advisory, unrelated to correctness) |
| TypeScript errors | N/A — project is plain JS/JSX, no `tsconfig.json`, nothing to check |
| CORS | Confirmed working — `access-control-allow-origin: *` present on live responses |
| Vite dev proxy (`/api/*`) | Confirmed working end-to-end through to the backend |
| `requests` library version warning at startup (`urllib3`/`chardet` mismatch) | Cosmetic dependency-resolution warning only; `pip check` confirms no broken requirements; does not affect any functionality |
| Frontend lint warnings (`oxlint`) | A handful of pre-existing unused-import warnings in `WhatIfSimulator.jsx`, `AnalyticsPage.jsx`, `ChatPanel.jsx`, and one `react-hooks/exhaustive-deps` advisory in `LocationPicker.jsx` (a deliberate, safe pattern for a cleanup-time ref read) — none are errors, none affect runtime behavior. Left untouched per "make only necessary changes." |

---

## Files Changed

| File | Change |
|---|---|
| `backend/main.py` | `PORT`/`HOST` now honored at startup; `reload_excludes` added to stop the reload loop |
| `backend/agents/gemini_helper.py` | Search-grounding tool failure now retries without the tool instead of degrading straight to mock |
| `.env.example` | Added `GOOGLE_APPLICATION_CREDENTIALS` (documented, optional); added a clarifying comment on `PORT`/`HOST` scope |

No frontend variable renames were needed — `VITE_GOOGLE_MAPS_API_KEY` was already correctly prefixed and consistently used in `frontend/src/lib/googleMaps.js`, and no backend code was found using a `VITE_`-prefixed name.
