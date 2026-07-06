"""
BigQuery analytics layer for LaunchWise AI.

Every completed analysis is inserted as one row into
`launchwise_analytics.business_reports` for downstream BI (Looker) and the
Insights Agent. Mirrors the existing Firestore pattern in main.py: the client
initializes once at import time, and every write degrades gracefully (logs
and returns False) if BigQuery is unreachable — e.g. no GCP Application
Default Credentials configured on the local dev machine.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger("launchwise.bigquery")

DATASET_ID = "launchwise_analytics"
REPORTS_TABLE = "business_reports"

REPORTS_SCHEMA = [
    ("session_id", "STRING"),
    ("timestamp", "TIMESTAMP"),
    ("business_type", "STRING"),
    ("location", "STRING"),
    ("budget", "FLOAT"),
    ("market_score", "INTEGER"),
    ("competition_score", "INTEGER"),
    ("location_score", "INTEGER"),
    ("risk_score", "INTEGER"),
    ("roi", "FLOAT"),
    ("business_health_score", "INTEGER"),
    ("decision", "STRING"),
    ("confidence_score", "INTEGER"),
]

_client = None
_dataset_ref = None
_GCP_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "launchwise-ai")


def _init_client():
    """Lazily initializes the BigQuery client and ensures the dataset/table exist.
    Any failure (missing ADC, missing package, no network) is caught and logged —
    the rest of the app must keep working with BigQuery disabled."""
    global _client, _dataset_ref
    if _client is not None:
        return _client

    try:
        from google.cloud import bigquery

        client = bigquery.Client(project=_GCP_PROJECT)
        dataset_ref = bigquery.DatasetReference(_GCP_PROJECT, DATASET_ID)

        # Ensure dataset exists (idempotent — cheap no-op if already created)
        try:
            client.get_dataset(dataset_ref)
        except Exception:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            client.create_dataset(dataset, exists_ok=True)
            logger.info(f"Created BigQuery dataset {DATASET_ID}")

        # Ensure the business_reports table exists with the required schema
        table_ref = dataset_ref.table(REPORTS_TABLE)
        try:
            client.get_table(table_ref)
        except Exception:
            schema = [bigquery.SchemaField(name, ftype) for name, ftype in REPORTS_SCHEMA]
            table = bigquery.Table(table_ref, schema=schema)
            client.create_table(table, exists_ok=True)
            logger.info(f"Created BigQuery table {DATASET_ID}.{REPORTS_TABLE}")

        _client = client
        _dataset_ref = dataset_ref
        logger.info(f"BigQuery connected: project={_GCP_PROJECT}, dataset={DATASET_ID}")
        return _client

    except Exception as e:
        logger.warning(f"BigQuery unavailable — analytics inserts will be skipped. Reason: {e}")
        _client = False  # sentinel: "tried and failed", don't retry every call
        return None


def is_available() -> bool:
    """True once the client has successfully connected. Triggers lazy init on first call."""
    if _client is None:
        _init_client()
    return bool(_client)


def insert_report(report: Dict[str, Any]) -> bool:
    """
    Inserts one flattened row into business_reports, built from a FinalReport dict.
    Returns True on success, False if BigQuery is unavailable or the insert fails —
    callers should treat this as best-effort telemetry, never a request-blocking error.
    """
    client = _init_client()
    if not client:
        logger.info(f"[BigQuery skipped] session={report.get('session_id')}")
        return False

    try:
        row = {
            "session_id": report["session_id"],
            "timestamp": report["timestamp"],
            "business_type": report["request"]["business_type"],
            "location": report["request"]["location"],
            "budget": report["request"]["budget"],
            "market_score": report["market_intelligence"]["demand_score"],
            "competition_score": report["location"]["competition_density"],
            "location_score": report["location"]["footfall_score"],
            "risk_score": report["risk"]["risk_score"],
            "roi": report["finance"]["roi_percentage"],
            "business_health_score": report["decision"]["business_health_score"],
            "decision": report["decision"]["go_no_go"],
            "confidence_score": report["decision"]["confidence_score"],
        }
        table_ref = _dataset_ref.table(REPORTS_TABLE)
        errors = client.insert_rows_json(table_ref, [row])
        if errors:
            logger.error(f"BigQuery insert errors for session {row['session_id']}: {errors}")
            return False

        logger.info(f"[BigQuery] Inserted report row for session {row['session_id']}")
        return True

    except Exception as e:
        logger.error(f"BigQuery insert failed for session {report.get('session_id')}: {e}")
        return False


def query_historical_averages(business_type: str) -> Dict[str, Any]:
    """
    Reads prior business_reports rows for the same business_type and returns
    aggregate trend stats (avg health score, avg ROI, decision distribution).
    Used by the Insights Agent to give the Decision Agent real historical
    context instead of reasoning about a single analysis in isolation.
    Returns an empty dict (never raises) if BigQuery is unavailable or there
    is no prior history yet — both are normal, expected states.
    """
    client = _init_client()
    if not client:
        logger.info(f"[BigQuery skipped] query_historical_averages({business_type})")
        return {}

    try:
        query = f"""
            SELECT
                COUNT(*) AS sample_size,
                AVG(business_health_score) AS avg_health_score,
                AVG(roi) AS avg_roi,
                AVG(risk_score) AS avg_risk_score,
                APPROX_TOP_COUNT(decision, 1)[OFFSET(0)].value AS most_common_decision
            FROM `{_GCP_PROJECT}.{DATASET_ID}.{REPORTS_TABLE}`
            WHERE business_type = @business_type
        """
        from google.cloud import bigquery
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("business_type", "STRING", business_type)]
        )
        rows = list(client.query(query, job_config=job_config).result())
        if not rows or rows[0]["sample_size"] == 0:
            return {}

        row = rows[0]
        return {
            "sample_size": row["sample_size"],
            "avg_health_score": round(row["avg_health_score"], 1) if row["avg_health_score"] is not None else None,
            "avg_roi": round(row["avg_roi"], 1) if row["avg_roi"] is not None else None,
            "avg_risk_score": round(row["avg_risk_score"], 1) if row["avg_risk_score"] is not None else None,
            "most_common_decision": row["most_common_decision"],
        }
    except Exception as e:
        logger.error(f"query_historical_averages failed for {business_type}: {e}")
        return {}


def insert_rows(table_name: str, rows: List[Dict[str, Any]]) -> bool:
    """
    Generic insert helper used by the Analytics Agent to write ad-hoc KPI rows
    (e.g. from an uploaded CSV) into any table within launchwise_analytics.
    Creates the table on first use with an auto-detected schema.
    """
    client = _init_client()
    if not client or not rows:
        logger.info(f"[BigQuery skipped] insert_rows into {table_name} ({len(rows)} rows)")
        return False

    try:
        from google.cloud import bigquery

        table_ref = _dataset_ref.table(table_name)
        try:
            client.get_table(table_ref)
        except Exception:
            # Auto-detect schema from the first row's keys/types — fine for
            # ad-hoc uploaded-dataset KPI tables that aren't part of the
            # fixed business_reports schema.
            job_config = bigquery.LoadJobConfig(autodetect=True, write_disposition="WRITE_APPEND")
            load_job = client.load_table_from_json(rows, table_ref, job_config=job_config)
            load_job.result()
            logger.info(f"[BigQuery] Created + loaded table {table_name} ({len(rows)} rows)")
            return True

        errors = client.insert_rows_json(table_ref, rows)
        if errors:
            logger.error(f"BigQuery insert_rows errors for {table_name}: {errors}")
            return False
        logger.info(f"[BigQuery] Inserted {len(rows)} row(s) into {table_name}")
        return True

    except Exception as e:
        logger.error(f"BigQuery insert_rows failed for {table_name}: {e}")
        return False
