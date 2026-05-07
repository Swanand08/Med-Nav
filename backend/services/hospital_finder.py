"""
Layer 2B — Hospital Finder using Google Places API
Discovers real hospitals near the user's city with live Google ratings.
Now returns BOTH government and private hospitals with proper 4-tier classification.
"""

import httpx
import os
import random
import urllib.parse
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

PREMIUM_BRANDS = [
    "apollo", "fortis", "kokilaben", "medanta", "max hospital", "manipal",
    "columbia asia", "narayana", "lilavati", "ruby hall", "kims",
    "yashoda", "care hospital", "aster", "global hospital", "sahyadri", "hinduja",
    "wockhardt", "jupiter", "breach candy", "jaslok", "bombay hospital",
    "sterling", "saifee", "reliance", "sevenhills"
]

GOV_KEYWORDS = [
    "aiims", "civil hospital", "district hospital", "government", "govt",
    "municipal", "sadar", "phc", "esi hospital", "railway hospital",
    "gmch", "kem", "nair", "lokmanya", "sassoon", "yerawada", "ambedkar",
    "mumbai municipal", "pune municipal", "general hospital", "corporation hospital",
    "medical college", "cantonment hospital"
]


def classify_tier(name: str, rating: float, reviews: int) -> str:
    """
    4-tier classification: government / budget / mid / premium
    Uses name keywords, Google rating, review count, and brand recognition.
    """
    name_lower = name.lower()

    # Government — immediate classification
    if any(k in name_lower for k in GOV_KEYWORDS):
        return "government"

    # Premium — ONLY for recognized premium brand chains
    # This ensures only genuine corporate chains get premium pricing
    if any(b in name_lower for b in PREMIUM_BRANDS):
        return "premium"

    # Scoring for remaining private hospitals
    score = 0

    # Signal 1: Rating (0-40 pts)
    if rating >= 4.5: score += 40
    elif rating >= 4.2: score += 25
    elif rating >= 3.9: score += 12
    else: score += 5

    # Signal 2: Review count (0-30 pts)
    if reviews >= 10000: score += 30
    elif reviews >= 5000: score += 18
    elif reviews >= 1000: score += 8
    else: score += 3

    if score >= 45: return "mid"
    return "budget"


MOCK_HOSPITALS = {
    "default": [
        {"name": "Sassoon General Hospital", "rating": 4.1, "reviewCount": 15000, "address": "Pune Station, Pune", "isPmjay": True, "tier": "government", "reviews": []},
        {"name": "B.J. Medical College & Hospital", "rating": 4.3, "reviewCount": 8200, "address": "Pune", "isPmjay": True, "tier": "government", "reviews": []},
    ]
}

async def find_google_places_hospitals(city: str, department: str) -> list:
    """
    Call Google Places API to find ALL hospitals (government + private) for the condition.
    """
    if not GOOGLE_API_KEY:
        print("[HospitalFinder] Error: GOOGLE_PLACES_API_KEY is missing.")
        return None

    # Search for ALL hospitals — not just government
    search_query = f"{department} hospital in {city}"
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.id,places.types,places.reviews,places.location"
    }
    
    body = {
        "textQuery": search_query,
        "maxResultCount": 20,
        "languageCode": "en"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()
            
            places = data.get("places", [])
            hospitals = []
            
            for p in places:
                name = p.get("displayName", {}).get("text", "")
                if not name:
                    continue
                
                # Filter out non-hospital results
                name_lower = name.lower()
                types = p.get("types", [])
                is_hospital = ("hospital" in types or "hospital" in name_lower
                               or "institute" in name_lower or "health" in name_lower
                               or "clinic" in name_lower)
                is_bad = ("pharmacy" in name_lower or "diagnostic" in name_lower
                          or "pathology" in name_lower or "medical store" in name_lower
                          or "lab " in name_lower)
                
                if not is_hospital or is_bad:
                    continue

                rating = float(p.get("rating", 3.5))
                reviews_count = int(p.get("userRatingCount", 50))
                
                # Classify into 4 tiers
                tier = classify_tier(name, rating, reviews_count)
                is_govt = (tier == "government")
                
                hospitals.append({
                    "name": name,
                    "rating": rating,
                    "reviewCount": reviews_count,
                    "address": p.get("formattedAddress", city),
                    "isPmjay": is_govt,  # Only government hospitals are PMJAY
                    "tier": tier,
                    "isPrivate": not is_govt,
                    "reviews": p.get("reviews", []),
                    "location": p.get("location", {})
                })

            # Sort by rating to return the best matches
            hospitals.sort(key=lambda x: (x["rating"], x["reviewCount"]), reverse=True)
            return hospitals[:15] if hospitals else None

    except Exception as e:
        print(f"[HospitalFinder] Google Places API error: {e}")
        return None

def get_mock_hospitals(department: str) -> list:
    """Return curated mock hospitals when API isn't available."""
    return MOCK_HOSPITALS["default"]

async def discover_hospitals(city: str, department: str) -> list:
    """
    Main discovery function — returns mixed government + private hospitals.
    """
    hospitals = await find_google_places_hospitals(city, department)
    if not hospitals:
        print("[HospitalFinder] No hospitals found. Falling back to mock data.")
        hospitals = get_mock_hospitals(department)
        
    return hospitals
