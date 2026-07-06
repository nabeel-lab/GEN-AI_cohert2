"""
Insights Agent (optional, Part 7 of the GCP extension).

Reads aggregate historical statistics from BigQuery for the current
business_type and turns them into a short, grounded context string that the
Decision Agent can fold into its reasoning — e.g. "gyms analyzed previously
averaged a 62/100 health score." This lets the platform's judgment improve
as more analyses accumulate, without ever inventing numbers: if BigQuery
has no history yet (or is unavailable), this agent returns None and the
Decision Agent proceeds exactly as it does today.
"""

import logging
from typing import Optional

from services.bigquery_service import query_historical_averages

logger = logging.getLogger("launchwise.insights_agent")


def get_historical_context(business_type: str) -> Optional[str]:
    """
    Returns a one-sentence, data-grounded summary of how similar businesses
    have historically scored, or None if there isn't enough history yet.
    """
    stats = query_historical_averages(business_type)
    if not stats or not stats.get("sample_size"):
        logger.info(f"[Insights Agent] No historical BigQuery data yet for '{business_type}'.")
        return None

    sentence = (
        f"Historical context from {stats['sample_size']} prior {business_type} "
        f"analyses on this platform: average health score {stats['avg_health_score']}/100, "
        f"average projected ROI {stats['avg_roi']}%, average risk score {stats['avg_risk_score']}/100, "
        f"most common verdict '{stats['most_common_decision']}'."
    )
    logger.info(f"[Insights Agent] {sentence}")
    return sentence
