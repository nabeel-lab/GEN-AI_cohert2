-- ============================================================================
-- LaunchWise AI — BigQuery views optimized for Looker Studio / Looker
-- ============================================================================
-- Source table: launchwise_analytics.business_reports
-- (populated automatically by backend/services/bigquery_service.py::insert_report
--  on every completed POST /analyze)
--
-- Run these once against your BigQuery project to create the views Looker
-- dashboards should connect to. Each view answers exactly one dashboard
-- question — see docs/LOOKER_SETUP.md for how to wire them into tiles.
-- ============================================================================

-- 1. Average Business Score — overall and trended over time
CREATE OR REPLACE VIEW `launchwise_analytics.v_avg_business_score` AS
SELECT
  DATE(timestamp) AS report_date,
  business_type,
  ROUND(AVG(business_health_score), 1) AS avg_health_score,
  COUNT(*) AS report_count
FROM `launchwise_analytics.business_reports`
GROUP BY report_date, business_type;

-- 2. Risk by Industry — average and max risk score per business type
CREATE OR REPLACE VIEW `launchwise_analytics.v_risk_by_industry` AS
SELECT
  business_type,
  ROUND(AVG(risk_score), 1) AS avg_risk_score,
  MAX(risk_score) AS max_risk_score,
  COUNTIF(risk_score >= 70) AS high_risk_count,
  COUNT(*) AS total_reports
FROM `launchwise_analytics.business_reports`
GROUP BY business_type
ORDER BY avg_risk_score DESC;

-- 3. Business Type Distribution — share of total analyses per type
CREATE OR REPLACE VIEW `launchwise_analytics.v_business_type_distribution` AS
SELECT
  business_type,
  COUNT(*) AS report_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_of_total
FROM `launchwise_analytics.business_reports`
GROUP BY business_type
ORDER BY report_count DESC;

-- 4. Average ROI — by business type and location
CREATE OR REPLACE VIEW `launchwise_analytics.v_avg_roi` AS
SELECT
  business_type,
  location,
  ROUND(AVG(roi), 2) AS avg_roi_pct,
  ROUND(MIN(roi), 2) AS min_roi_pct,
  ROUND(MAX(roi), 2) AS max_roi_pct
FROM `launchwise_analytics.business_reports`
GROUP BY business_type, location;

-- 5. Location Success — composite score per location across all analyses run there
CREATE OR REPLACE VIEW `launchwise_analytics.v_location_success` AS
SELECT
  location,
  COUNT(*) AS analyses_run,
  ROUND(AVG(business_health_score), 1) AS avg_health_score,
  ROUND(AVG(location_score), 1) AS avg_location_score,
  ROUND(AVG(competition_score), 1) AS avg_competition_score,
  COUNTIF(decision = 'GO') AS go_count,
  COUNTIF(decision = 'NO GO') AS no_go_count
FROM `launchwise_analytics.business_reports`
GROUP BY location
ORDER BY avg_health_score DESC;

-- 6. Decision Distribution — GO / PROCEED WITH CAUTION / NO GO breakdown
CREATE OR REPLACE VIEW `launchwise_analytics.v_decision_distribution` AS
SELECT
  decision,
  business_type,
  COUNT(*) AS count,
  ROUND(AVG(confidence_score), 1) AS avg_confidence
FROM `launchwise_analytics.business_reports`
GROUP BY decision, business_type;
