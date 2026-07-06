"""
Aggregate analytics for the Analytics Dashboard (Part 3/4).

Same graceful-fallback pattern as the rest of the platform: prefers live
BigQuery (real data across every deployment, ideal for Looker), and falls
back to aggregating the local backend/sessions/*.json store when BigQuery
credentials aren't configured — so the dashboard always shows real numbers
from analyses actually run, never an empty state.
"""

import os
import json
import logging
from collections import defaultdict
from typing import Any, Dict, List

logger = logging.getLogger("launchwise.analytics_summary")

SESSIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sessions")


def _load_local_reports() -> List[Dict[str, Any]]:
    reports = []
    if not os.path.isdir(SESSIONS_DIR):
        return reports
    for fname in os.listdir(SESSIONS_DIR):
        if not fname.endswith(".json"):
            continue
        try:
            with open(os.path.join(SESSIONS_DIR, fname), "r") as f:
                reports.append(json.load(f))
        except Exception:
            continue  # skip corrupt/partial files rather than failing the whole dashboard
    return reports


def get_summary() -> Dict[str, Any]:
    """
    Returns the same shape regardless of data source:
    {
      source: "bigquery" | "local_json",
      total_reports, avg_health_score, avg_roi, avg_risk_score,
      decision_distribution: {GO: n, "NO GO": n, "PROCEED WITH CAUTION": n},
      by_business_type: [{business_type, count, avg_health_score, avg_roi}],
      by_location: [{location, count, avg_health_score}],
    }
    """
    from services.bigquery_service import is_available, _init_client, _dataset_ref, DATASET_ID, REPORTS_TABLE, _GCP_PROJECT

    if is_available():
        try:
            client = _init_client()
            query = f"""
                SELECT business_type, location, business_health_score, roi, risk_score, decision
                FROM `{_GCP_PROJECT}.{DATASET_ID}.{REPORTS_TABLE}`
            """
            rows = [dict(r) for r in client.query(query).result()]
            if rows:
                return _aggregate(rows, source="bigquery")
        except Exception as e:
            logger.warning(f"BigQuery analytics query failed, falling back to local JSON: {e}")

    local_reports = _load_local_reports()
    rows = [
        {
            "business_type": r["request"]["business_type"],
            "location": r["request"]["location"],
            "business_health_score": r["decision"]["business_health_score"],
            "roi": r["finance"]["roi_percentage"],
            "risk_score": r["risk"]["risk_score"],
            "decision": r["decision"]["go_no_go"],
        }
        for r in local_reports
    ]
    return _aggregate(rows, source="local_json")


def _aggregate(rows: List[Dict[str, Any]], source: str) -> Dict[str, Any]:
    if not rows:
        return {
            "source": source, "total_reports": 0, "avg_health_score": 0, "avg_roi": 0,
            "avg_risk_score": 0, "decision_distribution": {}, "by_business_type": [], "by_location": [],
        }

    n = len(rows)
    avg_health = round(sum(r["business_health_score"] for r in rows) / n, 1)
    avg_roi = round(sum(r["roi"] for r in rows) / n, 1)
    avg_risk = round(sum(r["risk_score"] for r in rows) / n, 1)

    decision_dist = defaultdict(int)
    for r in rows:
        decision_dist[r["decision"]] += 1

    by_type = defaultdict(list)
    by_loc = defaultdict(list)
    for r in rows:
        by_type[r["business_type"]].append(r)
        by_loc[r["location"]].append(r)

    by_business_type = [
        {
            "business_type": bt,
            "count": len(items),
            "avg_health_score": round(sum(i["business_health_score"] for i in items) / len(items), 1),
            "avg_roi": round(sum(i["roi"] for i in items) / len(items), 1),
        }
        for bt, items in sorted(by_type.items(), key=lambda kv: -len(kv[1]))
    ]

    by_location = [
        {
            "location": loc,
            "count": len(items),
            "avg_health_score": round(sum(i["business_health_score"] for i in items) / len(items), 1),
        }
        for loc, items in sorted(by_loc.items(), key=lambda kv: -len(kv[1]))
    ]

    return {
        "source": source,
        "total_reports": n,
        "avg_health_score": avg_health,
        "avg_roi": avg_roi,
        "avg_risk_score": avg_risk,
        "decision_distribution": dict(decision_dist),
        "by_business_type": by_business_type,
        "by_location": by_location,
    }
