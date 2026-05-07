import os
import json
import re
import asyncio
import random
import google.genai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

REVIEW_SYSTEM_PROMPT = """You are a specialized Medical Patient Experience Analyzer.
Analyze the provided Google reviews for a specific hospital and generate a clinical yet patient-centered synthesis.

CRITICAL RULES:
1. STRICT ANALYTICAL ADHERENCE: Only include information present in the real reviews. Do not hallucinate.
2. NO GENERIC SUMMARIES. Avoid "offers essential services" unless it's the specific review feedback.
3. STRENGTHS: Extract 2-3 specific clinical or operational strengths (e.g., "Fast Cardiac Admission", "Skilled Ward Staff").
4. WEAKNESSES: Extract 1-2 specific critical concerns or areas for improvement (e.g., "Long OPD Queues", "Bed Scarcity").
5. ANALYZED REVIEW: Synthesize exactly TWO clinical sentences (max 40 words) that summarize the actual patient experience.

Output ONLY a JSON object:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "analysis_review": "Exactly two lines of clinical synthesis."
}"""

PROFILE_SYSTEM_PROMPT = """You are a specialized Medical Clinical Profiler for MedNav.
The provided hospital does not have recent textual Google reviews. Your job is to generate a unique, scientifically plausible clinical profile based on its name, rating, and classification.

Rules:
1. DIFFERENTIATION: Distinguish between 'Medical Colleges' (specialized research/teaching), 'District/Civil' (high clinical load), and 'AIIMS' (apex research).
2. STRENGTHS: Based on the facility type, list 2-3 likely strengths (e.g., 'Specialized Resident Faculty', 'High Case Volume Offset').
3. WEAKNESSES: List 1-2 standard operational constraints for this tier (e.g., 'Crowded OPD', 'Wait for ICU beds').
4. ANALYSIS REVIEW: A 2-line summary explaining the facility's role in the public health ecosystem.

Output ONLY a JSON object:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1"],
  "analysis_review": "2-line clinical profile."
}"""

async def analyze_hospital_reviews(raw_reviews: list, hospital_name: str = "", metadata: dict = None, client=None) -> dict:
    """
    Analyzes Google reviews or generates a unique AI profile if reviews are missing.
    Uses a singleton client to prevent connection overhead.
    """
    if not GEMINI_API_KEY or "YOUR_GEMINI_KEY" in GEMINI_API_KEY:
        return {
            "strengths": ["Regulated Rates", "Public Oversight"] if metadata.get("tier") == "government" else ["Private Facility"],
            "weaknesses": ["High Patient Volume"],
            "analysis_review": f"{hospital_name} provides essential clinical care."
        }

    try:
        if not client:
            client = genai.Client(api_key=GEMINI_API_KEY)

        # ── Prevent APi Burst Limit (429 Errors) ───────────────
        # Add a random jitter of 0.1s to 1.5s to stagger the 4 parallel requests
        await asyncio.sleep(random.uniform(0.1, 1.5))

        # ── Step 1: Extract Review Text ─────────────────────
        review_texts = ""
        if raw_reviews:
            review_texts = "\n---\n".join([r.get("text", {}).get("text", "") for r in raw_reviews if r.get("text")])

        # ── Step 2: Determine mode (Review Analysis vs AI Profiling) ──
        if not review_texts.strip():
            # Mode: AI Profiling (No real reviews found)
            meta_str = f"Name: {hospital_name}, Info: {metadata or {}}"
            response = await client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=PROFILE_SYSTEM_PROMPT + "\n\nFACILITY INFO:\n" + meta_str,
                config=genai.types.GenerateContentConfig(response_mime_type="application/json")
            )
        else:
            # Mode: Real Review Analysis
            full_prompt = REVIEW_SYSTEM_PROMPT + "\n\nREVIEWS TO ANALYZE:\n" + review_texts
            response = await client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt,
                config=genai.types.GenerateContentConfig(response_mime_type="application/json")
            )

        # ── Step 3: Parse Result ──────────────────────────────
        return json.loads(response.text)

    except Exception as e:
        print(f"[ReviewAnalyzer] Error for {hospital_name}: {e}")
        tier = metadata.get("tier", "mid") if metadata else "mid"
        
        if tier == "government":
            return {
                "strengths": ["Regulated Costs", "Standardized Protocols"],
                "weaknesses": ["High Patient Volume", "Wait Times"],
                "analysis_review": f"As a government facility, {hospital_name} provides standardized public healthcare."
            }
        else:
            return {
                "strengths": ["Modern Amenities", "Specialists Available"],
                "weaknesses": ["Premium Pricing"],
                "analysis_review": f"Based on its profile, {hospital_name} focuses on comprehensive clinical care."
            }
