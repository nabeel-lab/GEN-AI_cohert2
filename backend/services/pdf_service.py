"""
Investor-grade PDF report generator for LaunchWise AI, built on ReportLab.

Takes a FinalReport dict (the same structure returned by POST /analyze) and
renders a multi-section PDF: business summary, market analysis, competitor
analysis, location intelligence, financial forecast (with an embedded
revenue/cost chart), risk analysis, recommendations, roadmap timeline, and
the overall Go/No-Go verdict.
"""

import io
import logging
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak,
)

logger = logging.getLogger("launchwise.pdf")

_GOLD = colors.HexColor("#AA882C")
_NAVY = colors.HexColor("#0A0E1A")
_GREEN = colors.HexColor("#0F9D58")
_RED = colors.HexColor("#DB4437")


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="LWTitle", fontSize=22, leading=26, textColor=_NAVY, spaceAfter=6, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle(name="LWSubtitle", fontSize=11, textColor=colors.grey, spaceAfter=14))
    styles.add(ParagraphStyle(name="LWSection", fontSize=15, leading=18, textColor=_GOLD, spaceBefore=16, spaceAfter=8, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle(name="LWBody", fontSize=10, leading=15, textColor=colors.black))
    styles.add(ParagraphStyle(name="LWBullet", fontSize=10, leading=14, leftIndent=12, textColor=colors.black))
    return styles


def _verdict_color(verdict: str):
    if verdict == "GO":
        return _GREEN
    if verdict == "NO GO":
        return _RED
    return _GOLD


def _render_finance_chart(profit_forecast) -> io.BytesIO:
    """Renders a 12-month revenue-vs-cost line chart to an in-memory PNG using matplotlib."""
    import matplotlib
    matplotlib.use("Agg")  # headless — no display server needed on Cloud Run
    import matplotlib.pyplot as plt

    months = [m["month"] for m in profit_forecast]
    revenue = [m["revenue"] for m in profit_forecast]
    cost = [m["cost"] for m in profit_forecast]

    fig, ax = plt.subplots(figsize=(6.3, 3))
    ax.plot(months, revenue, color="#AA882C", linewidth=2, label="Revenue")
    ax.plot(months, cost, color="#DB4437", linewidth=2, label="Cost")
    ax.set_xlabel("Month")
    ax.set_ylabel("INR")
    ax.set_title("12-Month Revenue vs Cost", fontsize=11)
    ax.legend(loc="upper left", fontsize=8)
    ax.grid(alpha=0.25)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def _bullet_list(styles, items):
    return [Paragraph(f"&bull;&nbsp;&nbsp;{text}", styles["LWBullet"]) for text in items]


def generate_investor_pdf(report: Dict[str, Any]) -> bytes:
    """Builds the full investor report PDF and returns it as raw bytes."""
    styles = _build_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm,
        title=f"LaunchWise AI Report — {report['request']['business_type']}",
    )

    story = []
    req = report["request"]
    decision = report["decision"]
    business = report["business_profile"]
    market = report["market_intelligence"]
    competitors = report["competitors"]
    location = report["location"]
    finance = report["finance"]
    risk = report["risk"]

    # ── Cover / Overview ──────────────────────────────────────────────────
    story.append(Paragraph("LaunchWise AI — Investor Intelligence Report", styles["LWTitle"]))
    story.append(Paragraph(
        f"{req['business_type'].title()} · {req['location']} · Generated {report['timestamp'][:10]}",
        styles["LWSubtitle"],
    ))

    verdict_color = _verdict_color(decision["go_no_go"])
    verdict_table = Table(
        [[Paragraph(f"<b>{decision['go_no_go']}</b>", styles["LWBody"]),
          Paragraph(f"Health Score: <b>{decision['business_health_score']}/100</b>", styles["LWBody"]),
          Paragraph(f"Confidence: <b>{decision['confidence_score']}%</b>", styles["LWBody"])]],
        colWidths=[5.5 * cm, 5.5 * cm, 5.5 * cm],
    )
    verdict_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), verdict_color),
        ("TEXTCOLOR", (0, 0), (0, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 10))

    if decision.get("executive_summary"):
        story.append(Paragraph(decision["executive_summary"], styles["LWBody"]))

    # ── Business Summary ──────────────────────────────────────────────────
    story.append(Paragraph("1. Business Summary", styles["LWSection"]))
    story.append(Paragraph(f"<b>Unique Value Proposition:</b> {business['unique_value']}", styles["LWBody"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Products / Services</b>", styles["LWBody"]))
    story.extend(_bullet_list(styles, business["products"]))
    story.append(Paragraph("<b>Target Customers</b>", styles["LWBody"]))
    story.extend(_bullet_list(styles, business["target_customers"]))

    # ── Market Analysis ───────────────────────────────────────────────────
    story.append(Paragraph("2. Market Analysis", styles["LWSection"]))
    story.append(Paragraph(
        f"Demand score <b>{market['demand_score']}/100</b>, trend <b>{market['trend']}</b>. "
        f"Estimated market size: {market['market_size_estimate']}.", styles["LWBody"],
    ))
    story.append(Paragraph(f"Seasonality: {market['seasonality']}", styles["LWBody"]))
    story.append(Paragraph("<b>Top Trends</b>", styles["LWBody"]))
    story.extend(_bullet_list(styles, market["top_3_trends"]))

    # ── Competitor Analysis ───────────────────────────────────────────────
    story.append(Paragraph("3. Competitor Analysis", styles["LWSection"]))
    comp_rows = [["Competitor", "Rating", "Price Range", "Est. Monthly Revenue"]]
    for c in competitors["competitors"]:
        comp_rows.append([c["name"], str(c["rating"]), c["price_range"], c["estimated_monthly_revenue"]])
    comp_table = Table(comp_rows, colWidths=[4.5 * cm, 2 * cm, 4 * cm, 5 * cm])
    comp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Gap Opportunity:</b> {competitors['gap_opportunity']}", styles["LWBody"]))

    # ── Location Intelligence ─────────────────────────────────────────────
    story.append(Paragraph("4. Location Intelligence", styles["LWSection"]))
    loc_rows = [
        ["Footfall", "Competition Density", "Accessibility", "Growth Potential"],
        [str(location["footfall_score"]), str(location["competition_density"]),
         str(location["accessibility_score"]), str(location["growth_potential"])],
    ]
    loc_table = Table(loc_rows, colWidths=[4 * cm] * 4)
    loc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(loc_table)

    # ── Financial Forecast (with chart) ───────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("5. Financial Forecast", styles["LWSection"]))
    story.append(Paragraph(
        f"Monthly rent estimate: INR {finance['monthly_rent_estimate']:,.0f} · "
        f"Staff cost: INR {finance['staff_cost_estimate']:,.0f} · "
        f"Break-even: month {finance['break_even_months']} · "
        f"12-month ROI: {finance['roi_percentage']:.1f}%", styles["LWBody"],
    ))
    try:
        chart_buf = _render_finance_chart(finance["profit_forecast"])
        story.append(Spacer(1, 6))
        story.append(Image(chart_buf, width=15.5 * cm, height=7.4 * cm))
    except Exception as e:
        logger.warning(f"Finance chart render skipped: {e}")

    # ── Risk Analysis ─────────────────────────────────────────────────────
    story.append(Paragraph("6. Risk Analysis", styles["LWSection"]))
    story.append(Paragraph(f"Risk score: <b>{risk['risk_score']}/100</b> ({risk['risk_level']})", styles["LWBody"]))
    story.append(Paragraph("<b>Mitigation Strategies</b>", styles["LWBody"]))
    story.extend(_bullet_list(styles, risk["mitigations"]))

    # ── Recommendations ───────────────────────────────────────────────────
    story.append(Paragraph("7. Recommendations", styles["LWSection"]))
    story.extend(_bullet_list(styles, decision["top_3_recommendations"]))

    # ── Timeline / Roadmap ────────────────────────────────────────────────
    story.append(Paragraph("8. Roadmap Timeline", styles["LWSection"]))
    phase_labels = {"now": "Phase 1 — Immediate", "3_months": "Phase 2 — Preparation",
                    "6_months": "Phase 3 — Launch", "1_year": "Phase 4 — Growth"}
    for key, actions in decision["next_steps"].items():
        story.append(Paragraph(f"<b>{phase_labels.get(key, key)}</b>", styles["LWBody"]))
        story.extend(_bullet_list(styles, actions))

    # ── Overall Verdict ───────────────────────────────────────────────────
    story.append(Paragraph("9. Overall Go / No-Go", styles["LWSection"]))
    if decision.get("reasoning"):
        story.append(Paragraph(decision["reasoning"], styles["LWBody"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"<b>Final Verdict: {decision['go_no_go']}</b> — Business Health Score {decision['business_health_score']}/100, "
        f"Confidence {decision['confidence_score']}%.", styles["LWBody"],
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    logger.info(f"[PDF] Generated investor report ({len(pdf_bytes)} bytes) for session {report.get('session_id')}")
    return pdf_bytes
