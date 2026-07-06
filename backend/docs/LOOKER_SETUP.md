# Looker / Looker Studio Setup — LaunchWise AI

This document covers connecting BigQuery's `launchwise_analytics` dataset to
Looker (or the free Looker Studio) for the judging-facing analytics dashboard.

## 1. Prerequisites

- `launchwise_analytics.business_reports` must have at least one row. It's
  populated automatically by `backend/services/bigquery_service.py::insert_report`
  on every completed `POST /analyze` call — no manual step needed once
  `GOOGLE_APPLICATION_CREDENTIALS` (or `gcloud auth application-default login`)
  is configured on the machine running the backend.
- Run `docs/looker_views.sql` once against your BigQuery project to create
  the six dashboard-ready views.

## 2. Connect BigQuery to Looker Studio

1. Go to [lookerstudio.google.com](https://lookerstudio.google.com) → **Create → Data Source**.
2. Choose the **BigQuery** connector.
3. Select your project → dataset `launchwise_analytics` → pick a view (e.g. `v_avg_business_score`).
4. Repeat per view, or add all six as separate data sources in one report.

## 3. Recommended dashboard tiles (one per view)

| View | Suggested Chart | What it shows |
|---|---|---|
| `v_avg_business_score` | Time-series line chart, segmented by `business_type` | How predicted business health trends over time per industry |
| `v_risk_by_industry` | Horizontal bar chart, sorted by `avg_risk_score` | Which industries the platform flags as consistently riskier |
| `v_business_type_distribution` | Pie / donut chart | What founders are actually asking LaunchWise to analyze |
| `v_avg_roi` | Bar chart grouped by `business_type`, filterable by `location` | Where ROI expectations are strongest |
| `v_location_success` | Table or bubble map (location as geo dimension) | Which neighborhoods produce the best outcomes |
| `v_decision_distribution` | Stacked bar chart (`decision` as stack, `business_type` as category) | GO / CAUTION / NO GO split across industries |

## 4. Full Looker (Enterprise) instead of Looker Studio

If using full Looker with LookML instead of Looker Studio:

1. Create a LookML project pointing at the BigQuery connection.
2. Generate one `.view.lkml` file per SQL view above via **Develop → Generate LookML from SQL**, pasting each `CREATE OR REPLACE VIEW` body as a derived table.
3. Add a single `launchwise.model.lkml` joining nothing (all views are already flat/pre-aggregated) and expose all six as explores.
4. Build a dashboard referencing each explore — same tile mapping as the table above.

## 5. Refresh cadence

Every `POST /analyze` call inserts a new row in real time (via `insert_rows_json`,
a streaming insert — visible in Looker within seconds, not the ~90 minute
streaming-buffer delay some BigQuery operations have). No scheduled refresh
job is required for the demo; for production, add a Looker Studio scheduled
refresh (Data Source → Refresh Options) if using cached extracts instead of
live connections.
