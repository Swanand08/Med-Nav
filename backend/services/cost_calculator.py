"""
Layer 2A — Deterministic Cost Calculator
Dual-track: PMJAY government rates + Private market estimates.
Government costs: From PMJAY HBP Schedule 2024 (NHA) — official.
Private costs: Research-based model using tier multipliers, city index, and patient adjustments.
"""

import json
import os
from pathlib import Path

# City to PMJAY tier mapping
CITY_TIER_MAP = {
    "mumbai": "tier1",
    "pune":   "tier1",
    "nagpur": "tier2",
    "delhi":  "tier1",
    "default": "tier2",
}

# City cost multipliers for private hospitals
# Source: Practo city-wise procedure cost data analysis
CITY_MULTIPLIERS = {
    "mumbai": 1.25,
    "delhi": 1.20,
    "bangalore": 1.15,
    "chennai": 1.10,
    "pune": 1.10,
    "hyderabad": 1.05,
    "kolkata": 0.95,
    "nagpur": 0.90,
    "default": 1.00,
}

# ───────────────────────────────────────────────────────────────
# Private Hospital Base Costs per Procedure
# Source: Master Document Parts 11-12 (Practo, Credihealth, Apollo/Fortis published data)
# These are the mid-tier national average base costs.
# ───────────────────────────────────────────────────────────────
PRIVATE_BASE_COSTS = {
    "M17.9": {  # Knee Replacement
        "base_components": {
            "procedure": {"min": 120000, "max": 280000},
            "doctor_fee": {"min": 25000, "max": 80000},
            "medication": {"min": 20000, "max": 45000},
            "diagnostics": {"min": 8000, "max": 15000},
            "room_per_day": {"min": 2500, "max": 10000},
        },
        "stay_days": {"budget": 6, "mid": 5, "premium": 4},
        "contingency_pct": 0.12,
    },
    "M16.9": {  # Hip Replacement
        "base_components": {
            "procedure": {"min": 150000, "max": 350000},
            "doctor_fee": {"min": 30000, "max": 90000},
            "medication": {"min": 22000, "max": 50000},
            "diagnostics": {"min": 10000, "max": 18000},
            "room_per_day": {"min": 2500, "max": 10000},
        },
        "stay_days": {"budget": 7, "mid": 6, "premium": 5},
        "contingency_pct": 0.12,
    },
    "I25.1": {  # Angioplasty (PTCA)
        "base_components": {
            "procedure": {"min": 90000, "max": 250000},
            "doctor_fee": {"min": 20000, "max": 60000},
            "medication": {"min": 15000, "max": 35000},
            "diagnostics": {"min": 10000, "max": 25000},
            "room_per_day": {"min": 3000, "max": 12000},
        },
        "stay_days": {"budget": 4, "mid": 3, "premium": 3},
        "contingency_pct": 0.15,
    },
    "I34.0": {  # Double Valve Procedure
        "base_components": {
            "procedure": {"min": 200000, "max": 500000},
            "doctor_fee": {"min": 50000, "max": 150000},
            "medication": {"min": 30000, "max": 70000},
            "diagnostics": {"min": 15000, "max": 35000},
            "room_per_day": {"min": 3000, "max": 12000},
        },
        "stay_days": {"budget": 10, "mid": 8, "premium": 7},
        "contingency_pct": 0.15,
    },
    "H26.9": {  # Cataract Surgery
        "base_components": {
            "procedure": {"min": 15000, "max": 60000},
            "doctor_fee": {"min": 5000, "max": 20000},
            "medication": {"min": 2000, "max": 5000},
            "diagnostics": {"min": 2000, "max": 5000},
            "room_per_day": {"min": 0, "max": 3000},
        },
        "stay_days": {"budget": 1, "mid": 1, "premium": 1},
        "contingency_pct": 0.10,
    },
    "K37": {  # Appendectomy
        "base_components": {
            "procedure": {"min": 30000, "max": 80000},
            "doctor_fee": {"min": 10000, "max": 30000},
            "medication": {"min": 5000, "max": 12000},
            "diagnostics": {"min": 3000, "max": 8000},
            "room_per_day": {"min": 2000, "max": 8000},
        },
        "stay_days": {"budget": 4, "mid": 3, "premium": 2},
        "contingency_pct": 0.10,
    },
    "K80.2": {  # Cholecystectomy (Gallbladder)
        "base_components": {
            "procedure": {"min": 40000, "max": 100000},
            "doctor_fee": {"min": 12000, "max": 35000},
            "medication": {"min": 5000, "max": 15000},
            "diagnostics": {"min": 4000, "max": 10000},
            "room_per_day": {"min": 2000, "max": 8000},
        },
        "stay_days": {"budget": 4, "mid": 3, "premium": 2},
        "contingency_pct": 0.10,
    },
    "N20.0": {  # Kidney Stone (PCNL)
        "base_components": {
            "procedure": {"min": 50000, "max": 120000},
            "doctor_fee": {"min": 15000, "max": 40000},
            "medication": {"min": 8000, "max": 20000},
            "diagnostics": {"min": 5000, "max": 12000},
            "room_per_day": {"min": 2000, "max": 8000},
        },
        "stay_days": {"budget": 5, "mid": 4, "premium": 3},
        "contingency_pct": 0.12,
    },
    "Z51.1": {  # Chemotherapy (per cycle)
        "base_components": {
            "procedure": {"min": 20000, "max": 80000},
            "doctor_fee": {"min": 5000, "max": 15000},
            "medication": {"min": 10000, "max": 50000},
            "diagnostics": {"min": 3000, "max": 10000},
            "room_per_day": {"min": 2000, "max": 8000},
        },
        "stay_days": {"budget": 2, "mid": 1, "premium": 1},
        "contingency_pct": 0.10,
    },
    "O82": {  # Caesarean Section
        "base_components": {
            "procedure": {"min": 25000, "max": 70000},
            "doctor_fee": {"min": 10000, "max": 35000},
            "medication": {"min": 5000, "max": 12000},
            "diagnostics": {"min": 3000, "max": 8000},
            "room_per_day": {"min": 2500, "max": 10000},
        },
        "stay_days": {"budget": 5, "mid": 4, "premium": 3},
        "contingency_pct": 0.10,
    },
}

# Private hospital tier multipliers
# Source: Master Document Part 11 — based on Practo/Credihealth/Apollo published data
TIER_MULTIPLIERS = {
    "budget":  {"procedure": 0.65, "doctor": 0.60, "room_rate_idx": 0},  # min room rate
    "mid":     {"procedure": 1.00, "doctor": 1.00, "room_rate_idx": 1},  # mid room rate
    "premium": {"procedure": 1.50, "doctor": 1.60, "room_rate_idx": 2},  # max room rate
}

# ───────────────────────────────────────────────────────────────
# Load procedures.json once at startup (for government rates)
# ───────────────────────────────────────────────────────────────
_PROCEDURES_DB = None

def load_procedures():
    global _PROCEDURES_DB
    if _PROCEDURES_DB is not None:
        return _PROCEDURES_DB
    
    candidates = [
        Path(__file__).parent.parent.parent / "procedures.json",
        Path(__file__).parent.parent / "data" / "procedures.json",
    ]
    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                _PROCEDURES_DB = json.load(f)
            print(f"[CostCalc] Loaded {len(_PROCEDURES_DB)} procedures from {path}")
            return _PROCEDURES_DB
    
    raise FileNotFoundError("procedures.json not found. Run build_procedures.py first.")


def get_city_tier(city: str) -> str:
    return CITY_TIER_MAP.get(city.lower(), CITY_TIER_MAP["default"])


def get_city_multiplier(city: str) -> float:
    return CITY_MULTIPLIERS.get(city.lower(), CITY_MULTIPLIERS["default"])


def find_procedure(icd10_code: str):
    """Look up a procedure by ICD-10 code in our database."""
    db = load_procedures()
    for proc in db:
        if proc["icd10_code"] == icd10_code:
            return proc
    return None


def apply_comorbidity_penalties(base_total: int, comorbidities: list, risk_flags: dict) -> tuple[int, list]:
    """
    Apply comorbidity cost penalty multipliers.
    Returns (adjusted_total, list_of_triggered_flags)
    """
    triggered = []
    adjusted = base_total

    for condition in comorbidities:
        flag = risk_flags.get(condition)
        if flag:
            penalty = flag["cost_penalty_pct"]
            adjusted = round(adjusted * (1 + penalty))
            triggered.append({
                "title": f"{condition} Risk",
                "description": flag["description"],
                "penalty_pct": round(penalty * 100)
            })

    return adjusted, triggered


def calculate_costs(icd10_code: str, city: str, age: int, comorbidities: list) -> dict:
    """
    Government cost calculator — uses PMJAY HBP rates.
    Returns full cost breakdown object with government rates.
    """
    proc = find_procedure(icd10_code)

    if not proc:
        return {
            "found": False,
            "icd10_code": icd10_code,
            "message": "Procedure not in verified database. Showing general consultation estimate.",
            "cost_breakdown": {
                "procedure": {"min": 500, "max": 2000},
                "room_stay": {"min": 0, "max": 0},
                "doctor_fee": {"min": 300, "max": 1500},
                "medication": {"min": 200, "max": 500},
                "diagnostics": {"min": 500, "max": 2000},
                "contingency": {"min": 0, "max": 0},
                "total": {"min": 1500, "max": 6000},
            },
            "pmjay": {"covered": False, "rate": 0},
            "hbp_code": "N/A",
            "risk_flags": [],
        }

    tier = get_city_tier(city)
    tier_breakdown = proc["cost_breakdown"][tier]
    pmjay_info = proc["pmjay"]
    risk_flags = proc.get("risk_flags", {})

    base_total = tier_breakdown["total"]
    adjusted_total, triggered_flags = apply_comorbidity_penalties(
        base_total, comorbidities, risk_flags
    )

    age_penalty = 0
    if age and int(age) >= 65:
        age_penalty = round(adjusted_total * 0.08)
        adjusted_total += age_penalty
        triggered_flags.append({
            "title": "Senior Patient Adjustment",
            "description": "Patients aged 65+ carry higher anesthesia risk and may require longer monitoring.",
            "penalty_pct": 8
        })

    ratio = adjusted_total / base_total if base_total > 0 else 1.0
    implant = tier_breakdown.get("implant", 0)
    
    return {
        "found": True,
        "icd10_code": icd10_code,
        "condition_name": proc["condition_name"],
        "approved_treatment": proc["approved_treatment"],
        "hbp_code": proc["hbp_code"],
        "department": proc["department"],
        "city_tier": tier,
        "cost_breakdown": {
            "procedure":   {"min": round(tier_breakdown["procedure"] * ratio), "max": round(tier_breakdown["procedure"] * ratio * 1.2)},
            "room_stay":   {"min": round(tier_breakdown["room_stay"] * ratio),  "max": round(tier_breakdown["room_stay"] * ratio * 1.2)},
            "doctor_fee":  {"min": round(tier_breakdown["doctor_fee"] * ratio), "max": round(tier_breakdown["doctor_fee"] * ratio * 1.25)},
            "medication":  {"min": round(tier_breakdown["medication"] * ratio), "max": round(tier_breakdown["medication"] * ratio * 1.15)},
            "diagnostics": {"min": round(tier_breakdown["diagnostics"] * ratio),"max": round(tier_breakdown["diagnostics"] * ratio * 1.15)},
            "contingency": {"min": round(tier_breakdown["contingency"] * ratio),"max": round(tier_breakdown["contingency"] * ratio * 1.5)},
            "implant":     {"min": implant, "max": implant},
            "total": {
                "min": adjusted_total,
                "max": round(adjusted_total * 1.2),
            },
        },
        "pmjay": {
            "covered": True,
            "rate": pmjay_info[f"total_with_implant_{tier}"],
            "hbp_code": proc["hbp_code"],
            "implant_covered": pmjay_info["implant_covered"],
        },
        "risk_flags": triggered_flags,
        "source": "PMJAY HBP Schedule 2024 (NHA)",
        "methodology": "PMJAY tier rate × NHA ratio model (52/13/18/9/6/2%) + comorbidity penalties",
    }


def calculate_private_costs(icd10_code: str, hospital_tier: str, city: str, age: int, comorbidities: list,
                            rating: float = 4.0, review_count: int = 1000) -> dict:
    """
    Private hospital cost calculator.
    Uses research-based base costs × tier multiplier × city multiplier × facility factor × patient adjustments.
    The facility_factor ensures that even hospitals within the same tier get different costs
    based on their individual Google rating and review volume.
    Source: Practo, Credihealth, Apollo/Fortis published data.
    """
    proc = find_procedure(icd10_code)
    base_data = PRIVATE_BASE_COSTS.get(icd10_code)
    
    if not proc or not base_data:
        # Fallback: return government costs with a private multiplier
        govt = calculate_costs(icd10_code, city, age, comorbidities)
        mult = {"budget": 2.5, "mid": 4.0, "premium": 6.0}.get(hospital_tier, 3.0)
        if govt.get("found"):
            for k, v in govt["cost_breakdown"].items():
                if isinstance(v, dict):
                    govt["cost_breakdown"][k] = {"min": round(v["min"] * mult), "max": round(v["max"] * mult)}
            govt["source"] = "Estimated Market Rate (derived from PMJAY baseline)"
            govt["methodology"] = f"PMJAY baseline × {mult}x private {hospital_tier} tier multiplier"
        return govt

    tier_mult = TIER_MULTIPLIERS.get(hospital_tier, TIER_MULTIPLIERS["mid"])
    city_mult = get_city_multiplier(city)
    base = base_data["base_components"]
    stay_days = base_data["stay_days"].get(hospital_tier, 5)
    contingency_pct = base_data["contingency_pct"]
    risk_flags = proc.get("risk_flags", {})

    # ─── FACILITY-SPECIFIC VARIANCE ───
    # Higher-rated hospitals with more reviews charge more (better infrastructure, reputation premium).
    # This creates authentic cost differentiation between hospitals in the same tier.
    # Rating contribution: (rating - 3.5) / 1.5 maps 3.5→0.0, 5.0→1.0
    # Review contribution: log-scale review volume, capped
    rating_factor = max(0, min(1.0, (rating - 3.5) / 1.5))  # 0.0 to 1.0
    review_factor = max(0, min(1.0, review_count / 10000))    # 0.0 to 1.0
    # Combined: weighted blend → maps to a 0.92x to 1.08x multiplier (±8% variance)
    facility_factor = 0.92 + (rating_factor * 0.6 + review_factor * 0.4) * 0.16

    # Calculate room cost based on tier
    room_rates = [base["room_per_day"]["min"], 
                  (base["room_per_day"]["min"] + base["room_per_day"]["max"]) // 2,
                  base["room_per_day"]["max"]]
    room_idx = tier_mult["room_rate_idx"]
    room_rate = room_rates[room_idx]

    # Apply tier multipliers × facility factor
    proc_min = round(base["procedure"]["min"] * tier_mult["procedure"] * city_mult * facility_factor)
    proc_max = round(base["procedure"]["max"] * tier_mult["procedure"] * city_mult * facility_factor)
    doc_min = round(base["doctor_fee"]["min"] * tier_mult["doctor"] * city_mult * facility_factor)
    doc_max = round(base["doctor_fee"]["max"] * tier_mult["doctor"] * city_mult * facility_factor)
    med_min = round(base["medication"]["min"] * city_mult * facility_factor)
    med_max = round(base["medication"]["max"] * city_mult * facility_factor)
    diag_min = round(base["diagnostics"]["min"] * city_mult * facility_factor)
    diag_max = round(base["diagnostics"]["max"] * city_mult * facility_factor)
    room_min = round(stay_days * room_rate * 0.8 * city_mult * facility_factor)
    room_max = round(stay_days * room_rate * 1.2 * city_mult * facility_factor)

    subtotal_min = proc_min + doc_min + med_min + diag_min + room_min
    subtotal_max = proc_max + doc_max + med_max + diag_max + room_max

    # Age adjustment
    age_pct = 0
    triggered_flags = []
    if age and age >= 75:
        age_pct = 0.22
        triggered_flags.append({"title": "Senior Patient (75+)", "description": "Significant anesthesia risk, extended monitoring required.", "penalty_pct": 22})
    elif age and age >= 65:
        age_pct = 0.15
        triggered_flags.append({"title": "Senior Patient (65+)", "description": "Higher anesthesia risk, slower recovery.", "penalty_pct": 15})
    elif age and age >= 50:
        age_pct = 0.08
        triggered_flags.append({"title": "Age Adjustment (50+)", "description": "Moderate anesthesia risk increase.", "penalty_pct": 8})

    subtotal_min = round(subtotal_min * (1 + age_pct))
    subtotal_max = round(subtotal_max * (1 + age_pct))

    # Comorbidity adjustments
    for condition in comorbidities:
        flag = risk_flags.get(condition)
        if flag:
            penalty = flag["cost_penalty_pct"]
            subtotal_min = round(subtotal_min * (1 + penalty))
            subtotal_max = round(subtotal_max * (1 + penalty))
            triggered_flags.append({
                "title": f"{condition} Risk",
                "description": flag["description"],
                "penalty_pct": round(penalty * 100)
            })

    # Contingency
    cont_min = round(subtotal_min * contingency_pct)
    cont_max = round(subtotal_max * contingency_pct)
    total_min = subtotal_min + cont_min
    total_max = subtotal_max + cont_max

    return {
        "found": True,
        "icd10_code": icd10_code,
        "condition_name": proc["condition_name"],
        "approved_treatment": proc["approved_treatment"],
        "hbp_code": proc["hbp_code"],
        "department": proc["department"],
        "city_tier": get_city_tier(city),
        "hospital_tier": hospital_tier,
        "cost_breakdown": {
            "procedure":   {"min": proc_min, "max": proc_max},
            "room_stay":   {"min": room_min, "max": room_max},
            "doctor_fee":  {"min": doc_min, "max": doc_max},
            "medication":  {"min": med_min, "max": med_max},
            "diagnostics": {"min": diag_min, "max": diag_max},
            "contingency": {"min": cont_min, "max": cont_max},
            "total": {"min": total_min, "max": total_max},
        },
        "pmjay": {
            "covered": False,
            "rate": 0,
        },
        "risk_flags": triggered_flags,
        "source": "Estimated Market Rate (Practo, Credihealth, hospital published data)",
        "methodology": f"Private base cost × {hospital_tier} tier ({tier_mult['procedure']}x) × {city} city index ({city_mult}x) × facility factor ({facility_factor:.2f}x) + age/comorbidity adjustments",
    }

