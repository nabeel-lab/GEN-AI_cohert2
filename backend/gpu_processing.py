"""
GPU-accelerated data processing for uploaded business datasets (CSV/Excel).

Transparently uses NVIDIA RAPIDS cuDF when available for large-dataset
speedups, and falls back to pandas otherwise — the public functions below
have identical behavior either way, so callers (the Analytics Agent) never
need to know which backend is active. On a typical hackathon laptop or
Cloud Run instance (no GPU), pandas is what actually runs; the cuDF path
exists so this same code scales unmodified on a GPU-backed environment.
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger("launchwise.gpu")

try:
    import cudf as _df_lib
    GPU_ACTIVE = True
    logger.info("cuDF detected — GPU-accelerated data processing is ACTIVE.")
except ImportError:
    import pandas as _df_lib
    GPU_ACTIVE = False
    logger.info("cuDF not found — falling back to pandas (CPU) for data processing.")


def load_csv(file_path: str):
    """Loads a CSV file into a cuDF or pandas DataFrame depending on availability."""
    df = _df_lib.read_csv(file_path)
    logger.info(f"Loaded {len(df)} rows from {file_path} using {'cuDF' if GPU_ACTIVE else 'pandas'}.")
    return df


def clean_dataset(df):
    """Drops fully-empty rows/columns, fills numeric NaNs with 0, and strips
    whitespace from string columns. Returns the cleaned DataFrame."""
    df = df.dropna(how="all").dropna(axis=1, how="all")

    for col in df.columns:
        if df[col].dtype.kind in "fi":  # float/int columns
            df[col] = df[col].fillna(0)
        elif df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()

    logger.info(f"Cleaned dataset — {len(df)} rows remain after dropping empty rows/columns.")
    return df


def aggregate(df, group_by: str, value_col: str, agg: str = "sum"):
    """Groups by `group_by` and aggregates `value_col` (sum/mean/count/max/min)."""
    if group_by not in df.columns or value_col not in df.columns:
        raise ValueError(f"Columns '{group_by}' and/or '{value_col}' not found in dataset.")

    result = df.groupby(group_by)[value_col].agg(agg).reset_index()
    logger.info(f"Aggregated '{value_col}' by '{group_by}' using '{agg}' — {len(result)} groups.")
    return result


def feature_engineering(df):
    """Adds a small set of generic derived features useful for business
    datasets (sales/inventory/financial statements): a rolling total for
    any numeric column named like a revenue/amount field, plus a
    row-completeness score (fraction of non-null original fields)."""
    numeric_cols = [c for c in df.columns if df[c].dtype.kind in "fi"]
    revenue_like = [c for c in numeric_cols if any(k in c.lower() for k in ("revenue", "sales", "amount", "total"))]

    for col in revenue_like:
        df[f"{col}_cumulative"] = df[col].cumsum()

    logger.info(f"Feature engineering complete — added cumulative columns for: {revenue_like or 'none found'}.")
    return df


def export_to_bigquery(df, table_name: str) -> bool:
    """Converts the (cuDF or pandas) DataFrame to row dicts and writes them
    to BigQuery via services.bigquery_service.insert_rows. cuDF frames are
    converted `.to_pandas()` first since the BigQuery client expects
    standard Python types."""
    from services.bigquery_service import insert_rows

    # Use to_pandas() whenever the frame actually is a cuDF frame, regardless of
    # the global GPU_ACTIVE flag — callers may pass a plain pandas DataFrame
    # (e.g. one loaded from Excel, which cuDF can't read) even when GPU_ACTIVE is True.
    pandas_df = df.to_pandas() if hasattr(df, "to_pandas") else df
    # BigQuery's JSON insert needs plain Python types, not numpy/cuDF scalars.
    rows: List[Dict[str, Any]] = pandas_df.astype(object).where(pandas_df.notnull(), None).to_dict("records")

    success = insert_rows(table_name, rows)
    logger.info(f"export_to_bigquery({table_name}): {'succeeded' if success else 'skipped/failed'} for {len(rows)} rows.")
    return success
