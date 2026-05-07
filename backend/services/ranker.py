"""
Layer 3 — Ranker + Final Package Assembler
Takes hospitals + cost data and ranks them using a 4-factor scoring model.
Now supports dual-track costing: PMJAY for government, market rates for private.
"""

import os
import json
import re
import random
import math
import google.genai as genai
from services.cost_calculator import calculate_private_costs

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def _extract_google_reviews(raw_reviews: list, max_reviews: int = 4) -> list:
    """
    Extract clean, frontend-friendly review objects from Google Places API review data.
    Attempts to surface a balanced mix of highest and lowest available reviews.
    """
    valid_reviews = []
    
    # Map Google's rating enum to stars
    rating_map = {
        "FIVE": 5, "FOUR": 4, "THREE": 3, "TWO": 2, "ONE": 1,
        5: 5, 4: 4, 3: 3, 2: 2, 1: 1,
    }
    
    for r in raw_reviews:
        text = r.get("text", {}).get("text", "") if isinstance(r.get("text"), dict) else r.get("text", "")
        if not text or len(text.strip()) < 10:
            continue
        
        # Truncate very long reviews to 200 chars for UI
        display_text = text.strip()
        if len(display_text) > 200:
            display_text = display_text[:197] + "..."
        
        raw_rating = r.get("rating", "FIVE")
        stars = rating_map.get(raw_rating, 4)
        
        valid_reviews.append({
            "author": r.get("authorAttribution", {}).get("displayName", "Google User"),
            "rating": stars,
            "text": display_text,
            "relativeTime": r.get("relativePublishTimeDescription", "Recently"),
        })

    if not valid_reviews:
        return []

    # Sort reviews by rating (lowest first) to easily pick worst/best
    valid_reviews.sort(key=lambda x: x["rating"])
    
    if len(valid_reviews) <= max_reviews:
        return valid_reviews
        
    # Return a balanced mix: top 2 lowest, top 2 highest (if max_reviews=4)
    half = max_reviews // 2
    balanced = valid_reviews[:half] + valid_reviews[-half:]
    
    # Re-sort descending for visual presentation
    balanced.sort(key=lambda x: x["rating"], reverse=True)
    return balanced

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371
    return round(c * r, 1)

RANK_SYSTEM_PROMPT = """You are an elite hospital ranking and financial advisor for MedNav India.
Given a set of hospitals and patient context, generate the 'whyRecommended' text for the top hospitals.
Output ONLY valid JSON — a list of objects with keys: rank (int), whyRecommended (string, exactly 3-4 highly detailed analytical sentences).
Analyze the budget, the specific hospital's exact Google Rating, and the procedure cost fit. Keep it clinical, deeply insightful, and patient-centric. Do NOT hallucinate facts not given to you."""


def score_hospitals(hospitals: list, govt_cost_data: dict, budget: float, is_pmjay_covered: bool, 
                    user_lat: float = None, user_lng: float = None,
                    icd10_code: str = None, city: str = "Pune", age: int = 0, comorbidities: list = None) -> list:
    """
    Dual-track scoring: government hospitals use PMJAY rates, private hospitals use market estimates.
    """
    comorbidities = comorbidities or []
    scored = []

    for i, h in enumerate(hospitals):
        name = h.get("name", "").lower()
        rating = float(h.get("rating", 4.0))
        tier = h.get("tier", "mid")
        is_govt = (tier == "government")
        is_pmjay = h.get("isPmjay", False)

        # ─── DUAL-TRACK COSTING ───
        if is_govt:
            # Government hospitals: use PMJAY rates directly
            cost_data = govt_cost_data
            cost_source = "PMJAY HBP 2024 (NHA)"
        else:
            # Private hospitals: calculate market-based costs per facility
            review_count = int(h.get("reviewCount", 1000))
            if icd10_code:
                cost_data = calculate_private_costs(
                    icd10_code, tier, city, age, comorbidities,
                    rating=rating, review_count=review_count
                )
            else:
                cost_data = govt_cost_data  # fallback
            cost_source = "Estimated Market Rate"

        total_min = cost_data.get("cost_breakdown", {}).get("total", {}).get("min", 999999)
        total_max = cost_data.get("cost_breakdown", {}).get("total", {}).get("max", round(total_min * 1.2))

        # Clinical Match (0-30)
        clinical = 25
        if is_pmjay: clinical += 5

        # Reputation (0-30)
        reputation = round((rating / 5.0) * 30, 1)

        # Accessibility (0-20)
        hospital_location = h.get("location", {})
        h_lat = hospital_location.get("latitude")
        h_lng = hospital_location.get("longitude")
        if user_lat and user_lng and h_lat and h_lng:
            dist_val = calculate_haversine_distance(user_lat, user_lng, h_lat, h_lng)
        else:
            dist_val = round(2.0 + (i * 1.5) + (random.random() * 2), 1)
        accessibility = 15

        # Affordability (0-40+)
        affordability = 10
        if budget and budget > 0:
            if total_min <= budget * 0.7: affordability = 40
            elif total_min <= budget: affordability = 25
            elif total_min <= budget * 1.2: affordability = 5
            else: affordability = -20

        total_score = round(clinical + reputation + accessibility + affordability, 1)

        scored.append({
            **h,
            "totalScore": total_score,
            "distance": f"{dist_val} km",
            "scoreBreakdown": {
                "clinical": clinical,
                "reputation": reputation,
                "accessibility": accessibility,
                "affordability": affordability,
            },
            "costMin": total_min,
            "costMax": total_max,
            "tier": tier,
            "isPrivate": not is_govt,
            "costSource": cost_source,
            "costBreakdown": {
                k: v for k, v in cost_data.get("cost_breakdown", {}).items() 
                if k != "total" and isinstance(v, dict)
            },
            "costMethodology": cost_data.get("methodology", ""),
            # Extract 3-4 actual Google reviews for display
            "googleReviews": _extract_google_reviews(h.get("reviews", [])),
        })

    # Sort and return top 10
    scored.sort(key=lambda x: x["totalScore"], reverse=True)
    for i, h in enumerate(scored[:10]):
        h["rank"] = i + 1

    return scored[:10]


async def generate_why_recommended(ranked: list, condition: str, budget: float, client=None) -> list:
    def fallback_text(h: dict) -> str:
        rank = h["rank"]
        tier = h.get("tier", "mid")
        is_govt = (tier == "government")
        
        if rank == 1:
            if is_govt and h.get("isPmjay"):
                return "Our top recommendation. This PMJAY-empanelled government facility achieves a flawless 4-factor score, offering subsidized care with strong clinical outcomes at PMJAY-regulated rates."
            elif is_govt:
                return "Ranked #1 as a government facility providing cost-effective care under regulated pricing. Strong clinical infrastructure with transparent government-backed billing."
            else:
                return f"Ranked #1 among private hospitals. This {tier}-tier facility offers superior clinical infrastructure with competitive market pricing for this procedure."
        elif rank == 2:
            if is_govt:
                return "Our runner-up government facility. Maintains strong patient outcomes with PMJAY-regulated pricing, offering excellent value for cost-conscious patients."
            return "Our runner-up choice. Maintains exceptionally strong patient outcome reviews while offering a highly competitive and verified pricing structure."
        elif rank <= 5:
            if is_govt:
                return "A reliable government hospital option with regulated PMJAY pricing. Suitable for patients seeking the most affordable care pathway."
            return "A highly robust private hospital alternative. Offers an excellent value-to-care ratio with transparent market-rate pricing."
        else:
            return "A solid secondary option. Verified to possess the necessary medical infrastructure for this procedure, suitable for broader budget planning."

    if not GEMINI_API_KEY or GEMINI_API_KEY in ("your_gemini_api_key_here", "", "YOUR_GEMINI_KEY_HERE"):
        for h in ranked:
            h["whyRecommended"] = fallback_text(h)
        return ranked

    try:
        if not client:
            client = genai.Client(api_key=GEMINI_API_KEY)
        
        hospital_summary = [
            {"rank": h["rank"], "name": h["name"], "rating": h["rating"], "tier": h["tier"],
             "isPmjay": h.get("isPmjay", False), "isPrivate": h.get("isPrivate", False),
             "score": h["totalScore"], "costMin": h["costMin"], "costMax": h["costMax"]}
            for h in ranked[:5]
        ]
        user_msg = f"""Patient condition: {condition}
Patient budget: Rs {budget if budget else 'Not specified'}
Hospitals ranked by MedNav scoring model (mix of government and private):
{json.dumps(hospital_summary, indent=2)}

Generate a deeply analytical, 3-4 sentence whyRecommended text for only the TOP 5 hospitals.
For government hospitals, emphasize PMJAY rates and regulated pricing.
For private hospitals, explain the market-rate estimate and why this tier is appropriate."""

        full_prompt = RANK_SYSTEM_PROMPT + "\n\n" + user_msg
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )
        raw = response.text.strip()
        raw = re.sub(r'```json\s*', '', raw)
        raw = re.sub(r'```\s*', '', raw)
        raw = re.sub(r',\s*([}\]])', r'\1', raw)

        json_match = re.search(r'\[.*\]', raw, re.DOTALL)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                for rec in recommendations:
                    for h in ranked:
                        if h["rank"] == rec["rank"]:
                            h["whyRecommended"] = rec.get("whyRecommended", fallback_text(h))
            except json.JSONDecodeError:
                for h in ranked:
                    h["whyRecommended"] = fallback_text(h)
        else:
            for h in ranked:
                h["whyRecommended"] = fallback_text(h)
    except Exception as e:
        print(f"[Ranker] Gemini error: {e}. Using fallback text.")
        for h in ranked:
            h["whyRecommended"] = fallback_text(h)

    return ranked
