"""
Optional Apache Spark processing path for LaunchWise AI.

This module is NOT required for the platform to run and is not wired into
any API endpoint. It exists to demonstrate the architecture's path to
distributed processing for datasets too large for pandas/cuDF on a single
machine (millions of uploaded sales/inventory rows across many businesses).

PySpark is intentionally not installed as a dependency — importing it is
wrapped so the module loads safely and reports itself as unavailable when
absent, exactly like the cuDF/pandas fallback in gpu_processing.py.
"""

import logging

logger = logging.getLogger("launchwise.spark")

try:
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    SPARK_AVAILABLE = True
    logger.info("PySpark detected — distributed processing path is available.")
except ImportError:
    SPARK_AVAILABLE = False
    logger.info("PySpark not installed — spark_processing module will no-op. "
                "This is expected in the hackathon environment; see docs/LOOKER_SETUP.md "
                "and README for how this would be enabled on a Dataproc/GKE cluster.")

_spark_session = None


def get_spark_session():
    """Returns a lazily-created local SparkSession, or None if PySpark isn't installed."""
    global _spark_session
    if not SPARK_AVAILABLE:
        return None
    if _spark_session is None:
        _spark_session = (
            SparkSession.builder
            .appName("LaunchWiseBatchAnalytics")
            .master("local[*]")
            .getOrCreate()
        )
        logger.info("Spark session created (local mode).")
    return _spark_session


def aggregate_at_scale(csv_path: str, group_by: str, value_col: str, agg: str = "sum"):
    """
    Demonstrates how a multi-million-row uploaded dataset (e.g. a full year
    of point-of-sale transactions across hundreds of franchise locations)
    would be aggregated with Spark instead of pandas/cuDF, which would
    exceed single-machine memory at that scale.

    Returns None (and logs why) if Spark isn't available — callers should
    treat this as an optional acceleration path, falling back to
    gpu_processing.aggregate() for realistic hackathon-scale datasets.
    """
    spark = get_spark_session()
    if spark is None:
        logger.info(f"Skipping Spark aggregation for {csv_path} — PySpark unavailable, use gpu_processing.aggregate() instead.")
        return None

    df = spark.read.csv(csv_path, header=True, inferSchema=True)
    agg_fn = {"sum": F.sum, "avg": F.avg, "mean": F.avg, "max": F.max, "min": F.min, "count": F.count}.get(agg, F.sum)
    result = df.groupBy(group_by).agg(agg_fn(value_col).alias(f"{value_col}_{agg}"))
    logger.info(f"Spark aggregation complete for {csv_path} grouped by {group_by}.")
    return result.toPandas()
