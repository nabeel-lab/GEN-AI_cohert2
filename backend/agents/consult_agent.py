import json
import logging
from typing import List, Dict, Any
from agents.gemini_helper import call_gemini_json

logger = logging.getLogger("launchwise.consult_agent")

def chat_consultant(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Simulates a highly interactive, real-life conversation between the user and a panel of 10 LaunchWise agents.
    Maintains context, asks questions, and provides dynamic insights.
    Also extracts parameters to determine if a full simulation analysis is ready.
    """
    history_str = ""
    for msg in messages:
        role_label = "Founder" if msg["role"] == "user" else "LaunchWise Panel"
        history_str += f"{role_label}: {msg['text']}\n\n"

    prompt = f"""
    You are the LaunchWise AI startup consultant team, representing a panel of 10 specialized agents.
    The founder is chatting with you to refine their startup idea, location, and parameters in REAL-TIME.

    The 10 Agents:
    1. Business Agent (value proposition, products)
    2. Market Agent (market size, trends)
    3. Competitor Agent (SWOT, competitor mapping)
    4. Location Agent (footfall, accessibility, nearby shops)
    5. Finance Agent (costs, rent, ROI)
    6. Risk Agent (operational & market risks)
    7. Persona Agent (target customers)
    8. Supply Chain Agent (sourcing, logistics)
    9. Marketing Agent (CAC, channels)
    10. Decision Agent (synthesis, overall verdict)

    Rules for your response:
    1. CONVERSATIONAL & REAL-LIFE: Talk to the founder like a real advisory board.
    2. REPRESENT THE AGENTS: Have 2-3 specific agents chime in with distinct expertise (e.g., "**📍 Location Agent:** I checked Banjara Hills...").
    3. BE CRITICAL BUT HELPFUL: If an idea has flaws, point them out (e.g., "The rent there is high, so Finance Agent is worried").
    4. ASK QUESTIONS: End your response with exactly ONE specific, thought-provoking question to the founder (e.g., "What is your max budget?", "Who exactly is your target demographic?").
    5. FORMATTING: Use Markdown bolding for agent names. Keep it punchy and visual.

    --- CONVERSATION HISTORY ---
    {history_str}
    ----------------------------

    Determine if the founder has provided enough information to run a full analysis. This requires:
    1. A startup business type/industry (e.g. coffee shop, gym, clothing brand, bookstore)
    2. A target location (e.g. city or neighborhood in India)
    3. An estimated launch budget in INR (must be a number, e.g. 1500000 or 1500000.0)

    If and only if all three parameters have been clearly mentioned or agreed upon in the conversation history, set "is_ready_for_analysis" to true and populate the fields in "extracted_params". Otherwise, set "is_ready_for_analysis" to false.

    Respond STRICTLY in JSON format matching this schema:
    {{
        "reply": "<your Markdown-formatted response here>",
        "is_ready_for_analysis": <true if business_type, location, and budget are all specified, else false>,
        "extracted_params": {{
            "business_type": "<the extracted business type or null>",
            "location": "<the extracted city/neighborhood name in India or null>",
            "budget": <the extracted budget as a number in INR, or null>,
            "description": "<a short 1-2 sentence description of the startup idea/vision based on the conversation, or null>"
        }}
    }}
    """

    mock_fallback = {
        "reply": "**💼 Business Agent:** I love the enthusiasm! However, we need to nail down the specifics.\n\n**💰 Finance Agent:** We need a concrete budget to calculate your runway.\n\nWhat is your estimated initial investment budget?",
        "is_ready_for_analysis": False,
        "extracted_params": None
    }

    result = call_gemini_json(prompt, mock_fallback, enable_search=False)
    
    # Ensure types match the schema
    reply_text = result.get("reply", mock_fallback["reply"])
    is_ready = bool(result.get("is_ready_for_analysis", False))
    extracted = result.get("extracted_params", None)
    
    if extracted and not isinstance(extracted, dict):
        extracted = None

    logger.info(f"[Consultant Agent] Chat step processed. Ready for analysis: {is_ready}")
    return {
        "reply": reply_text,
        "is_ready_for_analysis": is_ready,
        "extracted_params": extracted
    }
