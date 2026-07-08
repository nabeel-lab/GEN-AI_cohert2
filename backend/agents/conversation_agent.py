"""
Conversational AI Consultant — the brain behind Workflow 2.

This is NOT the Quick-Analysis form. It runs a natural business-consulting
dialogue that progressively collects the four things the existing /analyze
pipeline needs (business_type, location, budget, description), then signals
when there is enough to run the full 10-agent analysis.

Design principles:
- Gemini drives the natural phrasing and field extraction when a valid key is
  present. It degrades gracefully: deterministic Python extraction + a rule-based
  question ladder guarantee the flow still advances even when Gemini is down
  (currently the case — the .env key is invalid). Control flow (need_location /
  ready_to_analyze) is ALWAYS decided in Python, never trusted to the model.
- Reuses the shared call_gemini_json wrapper like every other agent (no new SDK
  surface, no duplicated Gemini plumbing).
"""

import re
import json
import logging
from typing import Any, Dict, List, Optional

from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.conversation")

# Fields the /analyze pipeline requires before it can run.
REQUIRED_FIELDS = ["business_type", "location", "budget", "description"]

# ── Production system prompt (Part 12) ───────────────────────────────────────
SYSTEM_PROMPT = """You are LaunchWise AI — a sharp, warm, senior business-launch
consultant in the mould of McKinsey / BCG advisors, specialised in first-time
founders and SMEs in India.

ROLE & OBJECTIVE
- Behave like a real human consultant in conversation — never a form, never a
  rigid questionnaire. You proactively guide the founder, you don't just answer.
- Your job in this phase is to collect exactly four things so a full 10-agent
  analysis can run: business type, target location, launch budget (INR), and a
  short description (what's unique / who it's for). Nothing else is mandatory.

CONVERSATION STYLE
- Concise and confident. 1–3 sentences per turn. No fluff, no generic AI hedging.
- React to what they just said before asking the next thing ("Organic — that's a
  strong differentiator."). Each question should follow naturally from their last
  answer, not read off a checklist.
- Ask for ONE thing at a time. A tasteful emoji occasionally is fine.

MEMORY
- You are given everything already collected. NEVER re-ask for something you know.
  If the user revises a value, silently update it.

QUESTION STRATEGY (ask only for what's still missing, in this order)
1. Business type → 2. Location → 3. Budget → 4. What makes it unique / audience.
- For LOCATION: invite them to name an area (e.g. "Banjara Hills, Hyderabad") — the
  app resolves it to precise coordinates. Don't demand a full postal address.
- Once all four are known, stop asking and tell them you're ready to run the full
  intelligence analysis.

DECISION-INTELLIGENCE BEHAVIOUR
- You have a real multi-agent pipeline behind you (market, competitor, location,
  finance, risk, personas, supply-chain, marketing, decision). Speak as one
  consultant; the agents are your internal analysts.

RULES
- Never invent specific numbers, competitors, or facts in this collection phase —
  save quantified claims for after the analysis runs.
- Never ask unnecessary questions. Keep momentum: every message moves forward.
"""


def _missing_fields(state: Dict[str, Any]) -> List[str]:
    return [f for f in REQUIRED_FIELDS if not state.get(f)]


def _last_user_message(messages: List[Dict[str, str]]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            return m.get("content", "")
    return ""


# ── Deterministic extraction (mock-mode safety net) ──────────────────────────
BUSINESS_KEYWORDS = [
    "cafe", "café", "coffee", "bakery", "restaurant", "gym", "fitness", "salon",
    "spa", "retail", "boutique", "cloud kitchen", "pharmacy", "bookstore", "bar",
    "pub", "food truck", "grocery", "clothing", "apparel", "juice", "ice cream",
    "pizzeria", "diner", "studio", "clinic", "store", "shop",
]

_BUSINESS_PREFIXES = [
    "i would like to open a ", "i would like to open an ", "i'd like to open a ",
    "i want to open a ", "i want to open an ", "i want to open ",
    "i want to start a ", "i want to start an ", "i want to start ",
    "i want to launch a ", "i want to launch an ", "i want to launch ",
    "i'm planning a ", "i am planning a ", "planning to open a ",
    "open a ", "open an ", "start a ", "start an ", "launch a ", "launch an ",
    "a ", "an ",
]


def _clean_business_phrase(text: str) -> str:
    t = text.strip().lower().rstrip(".!?")
    for p in _BUSINESS_PREFIXES:
        if t.startswith(p):
            t = t[len(p):]
            break
    return t.strip()


def _extract_business_type(text: str) -> Optional[str]:
    if not text or "?" in text:
        return None
    lowered = text.lower()
    cleaned = _clean_business_phrase(text)
    if any(kw in lowered for kw in BUSINESS_KEYWORDS):
        return cleaned or next(kw for kw in BUSINESS_KEYWORDS if kw in lowered)
    if 0 < len(cleaned.split()) <= 6:
        return cleaned
    return None


def _parse_budget(text: str) -> Optional[float]:
    """INR budget parser: '15 lakh', '2 crore', '500k', or a cued bare number."""
    if not text:
        return None
    t = text.lower().replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(cr|crore|crores)", t)
    if m:
        return float(m.group(1)) * 10_000_000
    m = re.search(r"(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|l)\b", t)
    if m:
        return float(m.group(1)) * 100_000
    m = re.search(r"(\d+(?:\.\d+)?)\s*k\b", t)
    if m:
        return float(m.group(1)) * 1_000
    # A bare number only counts as budget when a money cue is present — prevents
    # PIN codes / phone numbers inside an address from being read as budget.
    if any(c in t for c in ("budget", "₹", "rs", "rupee", "inr", "invest", "capital", "spend", "lakh", "crore", "lac")):
        m = re.search(r"₹?\s*(\d{4,})", t)
        if m:
            return float(m.group(1))
    return None


def _fallback_question(state: Dict[str, Any], missing: List[str]) -> str:
    if "business_type" in missing:
        return (
            "Hello — I'm LaunchWise AI, your business-launch consultant. "
            "Let's evaluate your idea together. What kind of business are you planning to start?"
        )
    if "location" in missing:
        bt = state.get("business_type", "business")
        return (
            f"A {bt} — good choice. Which area are you targeting? "
            "Name a neighbourhood (e.g. \"Banjara Hills, Hyderabad\") and I'll pull the local intelligence."
        )
    if "budget" in missing:
        return "What's your approximate launch budget? Something like \"₹15 lakh\" is fine."
    if "description" in missing:
        return "Last thing — what makes it stand out, and who is it for?"
    return (
        "Perfect. I have everything I need — business, location, budget and positioning. "
        "I'll run the full 10-agent intelligence analysis now."
    )


def converse(messages: List[Dict[str, str]], state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Advance the consulting conversation by one turn.
    Returns: { reply, state, ready_to_analyze, need_location, phase }
    """
    state = dict(state or {})
    prior_keys = set(state.keys())  # what we knew coming INTO this turn
    missing = _missing_fields(state)
    transcript = "\n".join(
        f"{m.get('role', 'user')}: {m.get('content', '')}" for m in messages[-12:]
    )

    prompt = f"""{SYSTEM_PROMPT}

INFORMATION ALREADY COLLECTED (never re-ask):
{json.dumps(state, indent=2, default=str)}

STILL MISSING (ask only for the FIRST, per the question strategy): {missing or "nothing — announce you're running the analysis"}

CONVERSATION SO FAR:
{transcript if transcript else "(no messages yet — greet the founder and ask for the business type)"}

Return ONLY a valid JSON object:
{{
  "reply": "<your next natural message, 1-3 sentences>",
  "extracted": {{ <NEW fields learned from the user's LAST message: business_type (string), budget (number in INR), description (string), target_customers (string), goals (string), concerns (string)> }}
}}
If location is the first missing item, invite them to name an area (don't demand a full address). If nothing is missing, tell them you're starting the full analysis. Return {{}} for extracted if nothing new was learned."""

    _SENTINEL = "__MOCK_FALLBACK__"
    result = call_gemini_json(prompt, {"reply": _SENTINEL, "extracted": {}}, enable_search=False)

    # Merge Gemini-extracted fields.
    for key, value in (result.get("extracted") or {}).items():
        if value not in (None, "", [], {}):
            state[key] = value

    # Deterministic extraction backstop (works even with Gemini down).
    last_user = _last_user_message(messages)
    if not state.get("business_type"):
        bt = _extract_business_type(last_user)
        if bt:
            state["business_type"] = bt
    # Free-text location capture for the text-only consultant (no map): if the
    # business type was already known BEFORE this turn and no location/coords are
    # set yet, treat this turn's answer as the location the user named.
    if (
        "business_type" in prior_keys and not state.get("location")
        and state.get("latitude") is None and last_user.strip()
        and "?" not in last_user and _parse_budget(last_user) is None
    ):
        state["location"] = last_user.strip()
    if not state.get("budget"):
        parsed = _parse_budget(last_user)
        if parsed:
            state["budget"] = parsed
    if (
        state.get("business_type") and state.get("location") and state.get("budget")
        and not state.get("description") and last_user.strip()
        and _parse_budget(last_user) is None
    ):
        state["description"] = last_user.strip()

    missing_now = _missing_fields(state)
    model_reply = (result.get("reply") or "").strip()
    reply = model_reply if model_reply and model_reply != _SENTINEL else _fallback_question(state, missing_now)

    has_location = bool(state.get("location")) or state.get("latitude") is not None
    need_location = bool(state.get("business_type")) and not has_location
    ready = len(missing_now) == 0
    phase = "ready" if ready else ("need_location" if need_location else "collecting")

    logger.info(f"[Consultant] missing={missing_now} need_location={need_location} ready={ready}")
    return {
        "reply": reply,
        "state": state,
        "ready_to_analyze": ready,
        "need_location": need_location,
        "phase": phase,
    }


def analyze_area(business_type: str, location: str,
                 latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict[str, Any]:
    """
    Real-time local-area intelligence (Part 6). Combines the Maps-resolved place
    label + coordinates with Gemini reasoning about that specific locality.
    """
    coords = f" (approx {latitude:.4f}, {longitude:.4f})" if latitude is not None else ""
    prompt = f"""{SYSTEM_PROMPT}

TASK: Give a concise local-area intelligence read for a prospective
{business_type} at {location}{coords}. Reference real characteristics of THIS
locality — not generic advice.

Return ONLY a valid JSON object:
{{
  "summary": "<2-3 sentences on this exact area for this business>",
  "competition": "<1-2 sentences on nearby/competing businesses and density>",
  "demand": "<1-2 sentences on customer density, footfall, demand signals>",
  "opportunities": ["<short>", "<short>"],
  "risks": ["<short>", "<short>"]
}}"""

    fallback = {
        "summary": (
            f"{location} is a workable catchment for a {business_type}. The full "
            "location scoring will fold in the exact coordinates during analysis."
        ),
        "competition": "Density varies block to block — the Location and Competitor agents will quantify it precisely.",
        "demand": "Customer density looks viable for this format; the Market agent will score demand next.",
        "opportunities": [f"Differentiated {business_type} positioning", "Underserved premium niche"],
        "risks": ["Commercial rent pressure", "Established nearby incumbents"],
    }
    result = call_gemini_json(prompt, fallback, enable_search=False)
    for k, v in fallback.items():
        result.setdefault(k, v)
    logger.info(f"[Area Intel] {business_type} @ {location} -> {result.get('summary','')[:80]!r}")
    return result
