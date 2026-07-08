"""
AI Chat Assistant (Part 6).

Answers free-text questions about a completed analysis, grounded strictly in
that report's own JSON — no external knowledge, no invented numbers. Reuses
the existing gemini_helper wrapper and JSON-mode enforcement pattern used by
every other live agent, so it degrades the same way (mock fallback) if
Gemini is unavailable.
"""

import logging
from typing import Any, Dict, List

from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.chat_agent")


def _condense_report(report: Dict[str, Any]) -> str:
    """Flattens the parts of the report a founder would actually ask about
    into a compact block — keeps the prompt small and keeps the model
    from wandering into unrelated sections."""
    d = report["decision"]
    return f"""
    Business: {report['request']['business_type']} in {report['request']['location']}, budget INR {report['request']['budget']:,.0f}
    Verdict: {d['go_no_go']} | Health Score: {d['business_health_score']}/100 | Confidence: {d['confidence_score']}%
    Executive Summary: {d.get('executive_summary', '')}
    Reasoning: {d.get('reasoning', '')}
    Top Opportunities: {'; '.join(d.get('top_opportunities', []))}
    Biggest Risks: {'; '.join(d.get('biggest_risks', []))}
    Market: demand {report['market_intelligence']['demand_score']}/100, trend {report['market_intelligence']['trend']}
    Competitors: {report['competitors']['gap_opportunity']}
    Location: footfall {report['location']['footfall_score']}, competition density {report['location']['competition_density']}, growth {report['location']['growth_potential']}
    Finance: ROI {report['finance']['roi_percentage']}%, break-even month {report['finance']['break_even_months']}
    Risk: {report['risk']['risk_score']}/100 ({report['risk']['risk_level']}) — mitigations: {'; '.join(report['risk']['mitigations'])}
    Marketing channels: {'; '.join(m['channel'] for m in report.get('marketing', []))}
    Score Breakdown: {d.get('score_breakdown', {})}
    """


def answer_question(report: Dict[str, Any], question: str, history: List[Dict[str, str]] = None) -> str:
    """Returns a grounded answer to `question` using only `report`'s own data, keeping track of history."""
    context = _condense_report(report)

    history_context = ""
    if history:
        history_context = "--- CONVERSATION HISTORY ---\n"
        for msg in history:
            role_label = "Founder" if msg.get("role") == "user" else "Advisor"
            history_context += f"{role_label}: {msg.get('text')}\n\n"
        history_context += "----------------------------\n"

    prompt = f"""
    You are LaunchWise AI's business analyst assistant. Answer the founder's question
    using ONLY the report data below — never invent numbers, competitors, or facts that
    aren't present in this data. If the data doesn't cover the question, say so plainly
    and suggest which report tab might help instead. Keep the answer to 2-4 sentences,
    confident and specific, citing the actual figures.

    If there is a conversation history below, refer to it to maintain context of what the founder has asked previously.

    --- REPORT DATA ---
    {context}

    {history_context}
    --- QUESTION ---
    {question}

    Respond with ONLY a valid JSON object: {{"answer": "<your grounded answer>"}}
    """

    mock_fallback = {
        "answer": (
            f"Based on this report, the verdict is {report['decision']['go_no_go']} with a "
            f"{report['decision']['business_health_score']}/100 health score. For a detailed "
            f"answer to \"{question}\", check the AI Insights or Risk tabs — this response "
            f"is a fallback because live AI analysis is temporarily unavailable."
        )
    }

    result = call_gemini_json(prompt, mock_fallback, enable_search=False)
    answer = result.get("answer", mock_fallback["answer"])
    logger.info(f"[Chat Agent] Q: {question!r} -> A: {answer[:120]!r}")
    return answer
