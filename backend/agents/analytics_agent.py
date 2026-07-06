"""
Analytics Agent (optional, Part 7 of the GCP extension).

Reads a user-uploaded business dataset (CSV, or Excel exported to CSV by the
caller), cleans it via gpu_processing (cuDF-if-available, else pandas),
computes summary KPIs, and writes the row-level data to BigQuery for the
Insights Agent and Looker to consume.

This agent is additive — it is not part of the core 10-agent /analyze
pipeline and does not change any existing behavior there.
"""

import os
import logging
import uuid
from typing import Any, Dict

import gpu_processing as gp

logger = logging.getLogger("launchwise.analytics_agent")


def _numeric_summary(df) -> Dict[str, Dict[str, float]]:
    """Per-numeric-column min/max/mean/sum — the building blocks for KPIs and charts."""
    summary = {}
    for col in df.columns:
        if df[col].dtype.kind in "fi":
            series = df[col]
            summary[col] = {
                "min": float(series.min()),
                "max": float(series.max()),
                "mean": round(float(series.mean()), 2),
                "sum": round(float(series.sum()), 2),
            }
    return summary


def _detect_missing_values(df_raw) -> Dict[str, int]:
    """Counts null/empty cells per column in the ORIGINAL (pre-clean) dataset —
    this is what the user actually uploaded, so the report reflects real data quality."""
    return {col: int(df_raw[col].isna().sum()) for col in df_raw.columns}


def _compute_kpis(df) -> Dict[str, float]:
    """Derives a small set of generic business KPIs from whichever recognizable
    columns exist (revenue/sales/amount, cost/expense, quantity/units)."""
    kpis: Dict[str, float] = {}
    cols_lower = {c: c.lower() for c in df.columns}

    revenue_cols = [c for c, low in cols_lower.items() if any(k in low for k in ("revenue", "sales", "amount"))]
    cost_cols = [c for c, low in cols_lower.items() if any(k in low for k in ("cost", "expense"))]
    qty_cols = [c for c, low in cols_lower.items() if any(k in low for k in ("qty", "quantity", "units"))]

    if revenue_cols:
        total_revenue = float(df[revenue_cols[0]].sum())
        kpis["total_revenue"] = round(total_revenue, 2)
        kpis["avg_transaction_value"] = round(total_revenue / max(1, len(df)), 2)

    if cost_cols:
        total_cost = float(df[cost_cols[0]].sum())
        kpis["total_cost"] = round(total_cost, 2)
        if revenue_cols:
            kpis["gross_margin_pct"] = round(((kpis["total_revenue"] - total_cost) / max(1, kpis["total_revenue"])) * 100, 2)

    if qty_cols:
        kpis["total_units"] = round(float(df[qty_cols[0]].sum()), 2)

    kpis["row_count"] = float(len(df))
    return kpis


def analyze_uploaded_dataset(file_path: str, sync_to_bigquery: bool = True) -> Dict[str, Any]:
    """
    Full pipeline for one uploaded dataset: load -> clean -> feature-engineer ->
    summarize -> (optionally) push to BigQuery. Returns a JSON-serializable dict
    matching models.DatasetKPIReport.
    """
    filename = os.path.basename(file_path)
    logger.info(f"[Analytics Agent] Processing uploaded dataset: {filename}")

    # Excel files (sales reports, inventory, financial statements) are common
    # non-CSV uploads. cuDF has no Excel reader, so these load via pandas
    # regardless of GPU availability — the rest of the pipeline (clean/feature
    # engineering/export) works identically on either backend's DataFrame API.
    ext = os.path.splitext(filename)[1].lower()
    if ext in (".xlsx", ".xls"):
        import pandas as pd
        df_raw = pd.read_excel(file_path)
        logger.info(f"Loaded {len(df_raw)} rows from {filename} using pandas (Excel).")
    else:
        df_raw = gp.load_csv(file_path)

    missing_values = _detect_missing_values(df_raw)

    df = gp.clean_dataset(df_raw)
    df = gp.feature_engineering(df)

    numeric_summary = _numeric_summary(df)
    kpis = _compute_kpis(df)

    bigquery_synced = False
    if sync_to_bigquery:
        table_name = f"uploaded_{os.path.splitext(filename)[0].replace('-', '_').replace(' ', '_')}_{uuid.uuid4().hex[:6]}"
        bigquery_synced = gp.export_to_bigquery(df, table_name)

    result = {
        "filename": filename,
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": list(df.columns),
        "missing_values": missing_values,
        "numeric_summary": numeric_summary,
        "kpis": kpis,
        "gpu_accelerated": gp.GPU_ACTIVE,
        "bigquery_synced": bigquery_synced,
    }
    logger.info(f"[Analytics Agent] Completed KPI analysis for {filename}: {kpis}")
    return result
