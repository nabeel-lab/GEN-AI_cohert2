# backend/services/

Google Cloud integration layer, added to extend LaunchWise AI's architecture
beyond the core 10-agent pipeline. Every service in this package follows the
same pattern already established by Firestore in `main.py`: initialize once,
degrade gracefully and log clearly if the cloud dependency is unavailable,
and never let an integration failure break the core `/analyze` response.

## bigquery_service.py

Analytics layer. Every completed analysis is inserted as one row into
`launchwise_analytics.business_reports` (schema documented in
`docs/looker_views.sql`).

- `insert_report(report_dict)` — inserts one row built from a `FinalReport` dict. Returns `True`/`False`, never raises.
- `insert_rows(table_name, rows)` — generic insert used by the Analytics Agent for ad-hoc uploaded-dataset tables. Auto-creates the table with an auto-detected schema on first use.
- `query_historical_averages(business_type)` — reads aggregate stats for the Insights Agent. Returns `{}` if there's no history yet or BigQuery is unavailable.
- `is_available()` — cheap check, useful for a future `/health` detail field.

**Requires:** `GOOGLE_CLOUD_PROJECT` env var + GCP Application Default Credentials
(`gcloud auth application-default login`, or `GOOGLE_APPLICATION_CREDENTIALS`
pointing at a service account key). Without these, every function above logs
a warning once and returns an empty/falsy result — the app keeps running.

## storage_service.py

Cloud Storage integration for report artifacts.

- `upload_pdf(session_id, pdf_bytes)` / `upload_json(session_id, json_bytes)` — uploads to `reports/{session_id}.(pdf|json)` in the bucket named by `STORAGE_BUCKET`, returns a public URL.
- `generate_signed_url(session_id, extension, expiration_minutes)` — for when the bucket is private instead of public.

**Fallback:** if `STORAGE_BUCKET` is unset or the bucket is unreachable, files
are written to `backend/sessions/` instead and served via the app's own
`GET /report-file/{filename}` endpoint — the frontend receives a working URL
either way, it just points at your own backend instead of GCS.

## pdf_service.py

`generate_investor_pdf(report_dict)` — renders the 9-section investor report
(business summary, market, competitors, location, finance + chart, risk,
recommendations, roadmap, verdict) with ReportLab, returning raw PDF bytes.
Pure function, no cloud dependency — always works.

## Wiring

All three are called from `main.py`'s `POST /analyze` handler, immediately
after the `FinalReport` is assembled: generate PDF → upload PDF + JSON →
store the returned URLs on the report (`pdf_url`, `json_url`) → save to
Firestore/local JSON → insert the BigQuery analytics row. Every step after
report assembly is wrapped in its own try/except so partial cloud outages
never turn into a 500 for the user.
