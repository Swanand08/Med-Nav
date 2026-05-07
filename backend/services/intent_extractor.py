"""
Layer 1 — Gemini NLP Intent Extractor
Reads free-form user input and maps to ICD-10 + detected procedure.
Gemini is ONLY used for language understanding — NOT for costs or recommendations.
"""

import json
import re
import os
import google.genai as genai
from google.genai import types as genai_types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# The 10 ICD-10 codes our backend currently supports
SUPPORTED_ICD10 = [
    {"icd10": "M17.9", "condition": "Osteoarthritis of Knee",     "keywords": ["knee", "knee pain", "knee replacement"]},
    {"icd10": "M16.9", "condition": "Osteoarthritis of Hip",      "keywords": ["hip", "hip pain", "hip replacement"]},
    {"icd10": "I25.1", "condition": "Coronary Artery Disease",    "keywords": ["heart", "angioplasty", "ptca", "coronary", "chest pain", "angina"]},
    {"icd10": "I34.0", "condition": "Valve Disease",              "keywords": ["valve", "mitral", "heart valve", "bypass"]},
    {"icd10": "H26.9", "condition": "Cataract",                   "keywords": ["eye", "cataract", "vision", "blurry", "blur"]},
    {"icd10": "K37",   "condition": "Appendicitis",               "keywords": ["appendix", "appendicitis", "stomach pain right"]},
    {"icd10": "K80.2", "condition": "Gallstones / Cholelithiasis","keywords": ["gallstone", "gall", "gallbladder", "cholecystectomy"]},
    {"icd10": "N20.0", "condition": "Kidney Stone",               "keywords": ["kidney stone", "urinary stone", "pcnl", "kidney pain"]},
    {"icd10": "Z51.1", "condition": "Cancer Chemotherapy",        "keywords": ["cancer", "tumour", "tumor", "chemo", "chemotherapy", "oncology"]},
    {"icd10": "O82",   "condition": "Caesarean Section",          "keywords": ["c-section", "caesarean", "delivery", "pregnancy", "labour"]},
]

EMERGENCY_KEYWORDS = [
    "heart attack", "stroke", "not breathing", "unconscious",
    "severe chest pain right now", "accident", "bleeding heavily",
    "can't breathe", "cannot breathe"
]

SYSTEM_PROMPT = """You are a clinical coding assistant for MedNav, an AI-powered healthcare navigator.

Your ONLY job is to extract structured information from patient queries and map them to ICD-10 diagnostic codes.

Rules:
1. Output ONLY valid JSON — no extra text, no explanation.
2. DO NOT suggest specific drugs, costs, or hospital recommendations. 
3. Provide a detailed, patient-friendly 3-4 sentence `clinical_assessment` of their symptoms, explaining potential causes and the general clinical pathway (without formally diagnosing).
4. DO NOT diagnose definitively. Only map symptoms to the most likely ICD-10 code from the SUPPORTED list.
5. Set emergency=true ONLY for life-threatening situations needing immediate ambulance.
6. If the query matches none of the supported codes, use icd10="UNKNOWN" and procedure="general_consultation".
7. Confidence must be between 0.0 and 1.0.
8. Scoring Confidence: Provide >0.90 if the query explicitly matches a condition, keyword, or known procedure. Provide 0.75-0.89 if symptoms strongly suggest the supported condition. Provide <0.70 ONLY if highly ambiguous.

Supported ICD-10 codes: M17.9, M16.9, I25.1, I34.0, H26.9, K37, K80.2, N20.0, Z51.1, O82

Output JSON format:
{
  "icd10": "<code>",
  "condition": "<condition name>",
  "procedure": "<approved treatment name>",
  "department": "<medical department>",
  "confidence": <0.0-1.0>,
  "emergency": <true/false>,
  "confidence_explanation": "<one sentence explaining confidence level>",
  "clinical_assessment": "<3-4 sentence detailed, user-friendly initial assessment>"
}"""


def keyword_fallback(query: str) -> dict | None:
    """
    Fast keyword-based fallback if Gemini is unavailable.
    Scans query against known symptom keywords.
    """
    q = query.lower()
    for entry in SUPPORTED_ICD10:
        for kw in entry["keywords"]:
            if kw in q:
                return {
                    "icd10": entry["icd10"],
                    "condition": entry["condition"],
                    "procedure": entry["condition"],
                    "department": "General",
                    "confidence": 0.65,
                    "emergency": any(ek in q for ek in EMERGENCY_KEYWORDS),
                    "confidence_explanation": f"Keyword '{kw}' detected. Confidence reduced as mapping relies on exact keyword matching rather than full clinical context analysis.",
                    "clinical_assessment": f"Based on your symptoms, we suspect a correlation with {entry['condition']}. We recommend undergoing a formal clinical evaluation or general consultation to determine the exact severity and confirm the diagnosis before proceeding with treatment pathways."
                }
    return None


async def extract_intent(query: str, age: int, comorbidities: list) -> dict:
    """
    Layer 1 of the 3-layer pipeline.
    Sends user query to Gemini and extracts structured medical intent.
    Falls back to keyword matching if Gemini unavailable.
    """
    # Check emergency keywords first (no LLM call needed)
    q_lower = query.lower()
    if any(ek in q_lower for ek in EMERGENCY_KEYWORDS):
        return {
            "icd10": "EMERGENCY",
            "condition": query,
            "procedure": "emergency",
            "department": "Emergency",
            "confidence": 1.0,
            "emergency": True,
            "confidence_explanation": "Emergency keyword detected. Immediate 108 call required.",
            "clinical_assessment": "This appears to be a medical emergency. Please seek immediate medical attention or call emergency services right away."
        }

    # Try Gemini API
    if GEMINI_API_KEY and GEMINI_API_KEY not in ("your_gemini_api_key_here", "", "YOUR_GEMINI_KEY_HERE"):
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)

            user_message = f"""Patient query: "{query}"
Patient age: {age if age else 'Unknown'}
Comorbidities: {', '.join(comorbidities) if comorbidities else 'None'}

Map this to the most appropriate ICD-10 code from the supported list."""

            full_prompt = SYSTEM_PROMPT + "\n\n" + user_message

            response = await client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt
            )
            raw = response.text.strip()

            # Extract JSON even if Gemini wraps it in markdown ```json blocks
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                print(f"[IntentExtractor] Gemini mapped: {result.get('icd10')} (confidence={result.get('confidence')})")
                return result

        except Exception as e:
            print(f"[IntentExtractor] Gemini API error: {e}. Falling back to keywords.")

    # Keyword fallback
    fallback = keyword_fallback(query)
    if fallback:
        return fallback

    # Final fallback: general consultation
    return {
        "icd10": "UNKNOWN",
        "condition": query,
        "procedure": "general_consultation",
        "department": "General Medicine",
        "confidence": 0.30,
        "emergency": False,
        "confidence_explanation": "Condition not recognized in supported procedure list. Showing general consultation options.",
        "clinical_assessment": "Your symptoms are quite specific and do not firmly map to our primary surgical pathway database. Given the ambiguity of the provided symptoms, the safest and most effective initial step is to schedule a comprehensive general medical consultation to narrow down the potential exact diagnosis."
    }
