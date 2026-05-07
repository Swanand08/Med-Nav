"""
MedNav FastAPI Backend — Main Entry Point
POST /api/v1/analyze — The single endpoint that runs the full 3-layer pipeline.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

import google.genai as genai
from services.intent_extractor import extract_intent
from services.cost_calculator import calculate_costs, load_procedures, calculate_private_costs
from services.hospital_finder import discover_hospitals
from services.ranker import score_hospitals, generate_why_recommended
from services.review_analyzer import analyze_hospital_reviews

# ─────────────────────────────────────────────────────
# Pydantic Request/Response Models
# ─────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    query: str
    city: str = "Pune"
    age: int | None = None
    budget: float | None = None
    comorbidities: list[str] = []
    persona: str = "patient"  # "patient" | "loan_officer"
    user_lat: float | None = None
    user_lng: float | None = None


class AnalyzeResponse(BaseModel):
    success: bool
    emergency: bool = False
    data: dict | None = None
    error: str | None = None


# ─────────────────────────────────────────────────────
# App Startup: pre-load procedures.json into memory
# ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[MedNav] Loading procedures database...")
    try:
        load_procedures()
        print("[MedNav] Database ready.")
    except Exception as e:
        print(f"[MedNav] WARNING: Could not load procedures.json: {e}")
    yield
    print("[MedNav] Shutting down.")


# ─────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────

app = FastAPI(
    title="MedNav API",
    description="AI-powered healthcare navigator with deterministic cost engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "service": "MedNav Backend"}


# ─────────────────────────────────────────────────────
# Main Pipeline Endpoint
# ─────────────────────────────────────────────────────

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """
    3-Layer Pipeline:
      Layer 1 → Claude NLP: maps user query to ICD-10
      Layer 2 → Deterministic cost calculator + Google Places hospital finder
      Layer 3 → 4-factor scoring + Claude ranking text
    """
    try:
        # ── LAYER 1: Intent Extraction (Claude) ─────────────
        intent = await extract_intent(req.query, req.age, req.comorbidities)

        # Return immediately on emergency
        if intent.get("emergency"):
            return AnalyzeResponse(success=True, emergency=True, data={
                "condition": req.query,
                "icd10": "EMERGENCY",
                "icd10Desc": "Life-threatening emergency detected",
                "confidence": 1.0,
                "confidence_explanation": "Emergency keywords detected. Call 108 immediately.",
            })

        icd10     = intent.get("icd10", "UNKNOWN")
        condition = intent.get("condition", req.query)
        department = intent.get("department", "General Medicine")

        # ── LAYER 2A: Deterministic Cost Calculation ─────────
        cost_data = calculate_costs(
            icd10_code=icd10,
            city=req.city,
            age=req.age or 0,
            comorbidities=req.comorbidities,
        )

        # ── LAYER 2B: Hospital Discovery ─────────────────────
        hospitals = await discover_hospitals(city=req.city, department=department)

        # ── LAYER 3: 4-Factor Scoring + Generative Text ───────
        ranked = score_hospitals(
            hospitals, 
            cost_data, 
            req.budget or 0, 
            cost_data.get("pmjay", {}).get("covered", False),
            user_lat=req.user_lat,
            user_lng=req.user_lng,
            icd10_code=icd10,
            city=req.city,
            age=req.age or 0,
            comorbidities=req.comorbidities,
        )
        # ── LAYER 3: Optimized Concurrent AI Processing ──
        # We use a single shared client for all parallel requests to prevent resource bottlenecks.
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        review_tasks = []
        for i, h in enumerate(ranked):
            if i < 4: # Reduced to top 4 for maximum stability under 10s
                metadata = {"rating": h.get("rating"), "reviewCount": h.get("reviewCount"), "tier": h.get("tier")}
                review_tasks.append(analyze_hospital_reviews(h.get("reviews", []), h.get("name", "Facility"), metadata=metadata, client=client))
            else:
                is_govt = (h.get("tier") == "government")
                h["review_analysis"] = {
                    "strengths": ["Verified Public Health Entity"] if is_govt else ["Standard Clinical Care", "Private Amenities"],
                    "weaknesses": ["High Patient Demand"] if is_govt else ["Premium Market Pricing"],
                    "analysis_review": f"{'As a public facility, ' if is_govt else 'Based on its market profile, '}{h['name']} provides standard clinical care."
                }

        results = await asyncio.gather(
            generate_why_recommended(ranked, condition, req.budget, client=client),
            *review_tasks
        )
        ranked = results[0]
        review_results = results[1:]
        for i, r_result in enumerate(review_results):
            if i < len(ranked):
                ranked[i]["review_analysis"] = r_result

        # ── Assemble Response ──────────────────────────────────
        response_data = {
            # Clinical Mapping
            "condition":    condition,
            "icd10":        icd10,
            "icd10Desc":    intent.get("condition", condition),
            "procedure":    intent.get("procedure", ""),
            "hbp_code":     cost_data.get("hbp_code", ""),
            "confidence":   intent.get("confidence", 0.5),
            "confidence_explanation": intent.get("confidence_explanation", ""),
            "clinical_assessment": intent.get("clinical_assessment", ""),

            # Hospital Rankings
            "ranked_hospitals": ranked,

            # Cost
            "cost_breakdown": cost_data.get("cost_breakdown"),
            "private_cost_breakdown": calculate_private_costs(icd10, "mid", req.city, req.age or 0, req.comorbidities).get("cost_breakdown", {}),

            # Government Schemes
            "govt_schemes": {
                "pmjay": {
                    "covered": cost_data.get("pmjay", {}).get("covered", False),
                    "rate": cost_data.get("pmjay", {}).get("rate", 0),
                    "hbp_code": cost_data.get("hbp_code", ""),
                },
                "state_scheme": {
                    "name": "Mahatma Jyotiba Phule Jan Arogya Yojana (MJPJAY)",
                    "coverage": "1.5 Lakhs",
                    "eligibility": "Yellow, orange, or white ration card holders. Annual income below Rs 1 lakh.",
                    "url": "https://jeevandayee.gov.in",
                    "helpline": "155388"
                }
            },

            # Risk & Responsible AI
            "risk_flags": cost_data.get("risk_flags", []),
            "budget_assessment": (
                f"Estimated cost: Rs {cost_data.get('cost_breakdown', {}).get('total', {}).get('min', 0):,} – "
                f"Rs {cost_data.get('cost_breakdown', {}).get('total', {}).get('max', 0):,} "
                f"(PMJAY baseline for {req.city.title()})."
            ),

            # Attribution
            "data_sources": ["PMJAY HBP 2024 (NHA)", "Google Places API", "Gemini 2.0 AI", "NHA Operational Guidelines"],
            "methodology": cost_data.get("methodology", ""),
        }

        return AnalyzeResponse(success=True, emergency=False, data=response_data)

    except Exception as e:
        print(f"[MedNav] Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
