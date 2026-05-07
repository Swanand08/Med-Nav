"""
MedNav - Government Rate Compiler
Reads all 70 PMJAY HBP CSV files, extracts key procedures,
maps them to ICD-10 codes, computes itemized cost breakdown,
and outputs procedures.json for the FastAPI backend.

Government Rates ONLY (no private multipliers).
"""

import glob
import csv
import json
import re
import os

CSV_FOLDER = "d:/Engg/HACKATHONS/HEALTHCARE/1776281977865680"
OUTPUT_FILE = "d:/Engg/HACKATHONS/HEALTHCARE/procedures.json"

# ───────────────────────────────────────────────────────────────
# ICD-10 Bridge Map: symptom → ICD-10 + treatment search keyword
# Claude will output one of these ICD-10 codes after reading user input.
# Our code then uses the 'search_keyword' to find the matching
# procedure in the PMJAY CSV files.
# ───────────────────────────────────────────────────────────────
ICD10_BRIDGE = [
    {
        "icd10_code": "M17.9",
        "condition_name": "Osteoarthritis of Knee",
        "search_keyword": "Total Knee Replacement",
        "department": "Orthopedics",
        "risk_flags": {
            "Diabetes": {"description": "Increases risk of post-op infection, may extend ICU stay by 1-2 days.", "cost_penalty_pct": 0.12},
            "Obesity":  {"description": "Higher anesthesia risk and longer surgery time.", "cost_penalty_pct": 0.08}
        }
    },
    {
        "icd10_code": "M16.9",
        "condition_name": "Osteoarthritis of Hip",
        "search_keyword": "Total Hip Replacement",
        "department": "Orthopedics",
        "risk_flags": {
            "Diabetes": {"description": "Risk of delayed wound healing and infection.", "cost_penalty_pct": 0.10},
            "Obesity":  {"description": "Higher mechanical stress, longer recovery.", "cost_penalty_pct": 0.08}
        }
    },
    {
        "icd10_code": "I25.1",
        "condition_name": "Atherosclerotic Heart Disease / Coronary Artery Disease",
        "search_keyword": "PTCA",
        "department": "Cardiology",
        "risk_flags": {
            "Diabetes":     {"description": "Accelerates restenosis. May require repeat procedure.", "cost_penalty_pct": 0.15},
            "Hypertension": {"description": "Increases operative risk; stricter BP management required.", "cost_penalty_pct": 0.07}
        }
    },
    {
        "icd10_code": "I34.0",
        "condition_name": "Mitral Valve Regurgitation / Valve Disease",
        "search_keyword": "Double Valve Procedure",
        "department": "CTVS",
        "risk_flags": {
            "Heart Disease":  {"description": "Prior cardiac history increases surgical risk.", "cost_penalty_pct": 0.15},
            "Hypertension":   {"description": "Must be controlled pre-operatively adding to stay.", "cost_penalty_pct": 0.08}
        }
    },
    {
        "icd10_code": "H26.9",
        "condition_name": "Cataract",
        "search_keyword": "Cataract",
        "department": "Ophthalmology",
        "risk_flags": {
            "Diabetes": {"description": "Diabetic retinopathy may complicate cataract surgery.", "cost_penalty_pct": 0.10}
        }
    },
    {
        "icd10_code": "K37",
        "condition_name": "Appendicitis",
        "search_keyword": "Appendicectomy",
        "department": "General Surgery",
        "risk_flags": {
            "Diabetes": {"description": "Slower wound healing and infection risk post-op.", "cost_penalty_pct": 0.10}
        }
    },
    {
        "icd10_code": "K80.2",
        "condition_name": "Gallstones / Cholelithiasis",
        "search_keyword": "Cholecystectomy",
        "department": "General Surgery",
        "risk_flags": {
            "Obesity": {"description": "Laparoscopic technique may be difficult; may convert to open.", "cost_penalty_pct": 0.12}
        }
    },
    {
        "icd10_code": "N20.0",
        "condition_name": "Kidney Stone (Urolithiasis)",
        "search_keyword": "PCNL",
        "department": "Urology",
        "risk_flags": {
            "Hypertension": {"description": "May affect renal perfusion during procedure.", "cost_penalty_pct": 0.06},
            "Kidney Disease": {"description": "Reduced renal reserve increases surgical risk.", "cost_penalty_pct": 0.15}
        }
    },
    {
        "icd10_code": "Z51.1",
        "condition_name": "Cancer Chemotherapy Support",
        "search_keyword": "CT for",
        "department": "Medical Oncology",
        "risk_flags": {
            "Diabetes": {"description": "Blood glucose must be tightly managed during chemo cycles.", "cost_penalty_pct": 0.10}
        }
    },
    {
        "icd10_code": "O82",
        "condition_name": "Caesarean Section (C-Section)",
        "search_keyword": "Caesarean",
        "department": "Obstetrics & Gynecology",
        "risk_flags": {
            "Hypertension": {"description": "Pre-eclampsia risk mandates closer monitoring.", "cost_penalty_pct": 0.10},
            "Diabetes": {"description": "Gestational diabetes increases neonatal ICU probability.", "cost_penalty_pct": 0.12}
        }
    },
]

# ───────────────────────────────────────────────────────────────
# NHA-backed percentage split for cost itemization
# Source: National Health Authority PMJAY Operational Guidelines
# ───────────────────────────────────────────────────────────────
COST_SPLIT = {
    "procedure": 0.52,     # Surgical procedure, OT, theater
    "room_stay": 0.13,     # General ward + ICU bed charges
    "doctor_fee": 0.18,    # Surgeon + anesthesia + consult
    "medication": 0.09,    # Pharmacy, meds, IV fluids
    "diagnostics": 0.06,   # Labs, imaging, pathology
    "contingency": 0.02,   # Administrative buffer
}

# ───────────────────────────────────────────────────────────────
# CSV Column Indexes
# ───────────────────────────────────────────────────────────────
COL_DEPT        = 1
COL_PROC_GROUP  = 2
COL_PROC_NAME   = 3
COL_HBP_CODE    = 4
COL_BASE_RATE   = 5
COL_TIER1       = 8    # NABH Accredited / Tier 1 cities
COL_TIER2       = 9    # Tier 2 cities
COL_TIER3       = 10   # Tier 3 cities (smaller towns)
COL_IMPLANT_VAL = 11
COL_IMPLANT_COV = 12

def clean_number(val):
    """Safely convert a CSV value to integer, stripping commas/spaces."""
    try:
        return int(str(val).replace(",", "").replace(" ", "").strip())
    except (ValueError, AttributeError):
        return 0

def best_subrow(row, keyword):
    """
    Handle multi-procedure rows where columns contain newline-embedded values.
    Split each column on newline, find the sub-row whose proc name matches keyword,
    and return a clean single-procedure column list.
    """
    # Check if any column has newlines (multi-row embedding)
    if not any('\n' in str(c) for c in row):
        return row  # Normal single-procedure row

    # Split all columns by newline to get sub-rows
    split_cols = [str(c).split('\n') for c in row]
    n = max(len(col) for col in split_cols)

    # Reconstruct individual sub-rows
    sub_rows = []
    for i in range(n):
        sub = [col[i].strip() if i < len(col) else '' for col in split_cols]
        sub_rows.append(sub)

    # Find the sub-row whose proc group or proc name contains our keyword
    kw = keyword.lower()
    for sub in sub_rows:
        combined = ' '.join(sub[:5]).lower()
        if kw in combined:
            return sub

    # Fallback: return first sub-row
    return sub_rows[0] if sub_rows else row

def parse_implant_cost(implant_str):
    """Extract the first/minimum number mentioned in the implant column."""
    if not implant_str or implant_str.strip() in ("NA", "", "-"):
        return 0
    numbers = re.findall(r'[\d,]+', implant_str)
    costs = [clean_number(n) for n in numbers if clean_number(n) > 1000]
    return min(costs) if costs else 0

def compute_breakdown(total_rate, implant_cost=0):
    """Apply NHA ratio split to generate itemized breakdown."""
    base = total_rate - implant_cost
    if base <= 0:
        base = total_rate
    return {
        "procedure":   round(base * COST_SPLIT["procedure"]),
        "room_stay":   round(base * COST_SPLIT["room_stay"]),
        "doctor_fee":  round(base * COST_SPLIT["doctor_fee"]),
        "medication":  round(base * COST_SPLIT["medication"]),
        "diagnostics": round(base * COST_SPLIT["diagnostics"]),
        "contingency": round(base * COST_SPLIT["contingency"]),
        "implant":     implant_cost,
        "total":       total_rate,
    }

# ───────────────────────────────────────────────────────────────
# Main Compilation
# ───────────────────────────────────────────────────────────────
def compile_procedures():
    csv_files = sorted(glob.glob(os.path.join(CSV_FOLDER, "*.csv")))
    print(f"Found {len(csv_files)} CSV files.")

    # Load all rows into memory
    all_rows = []
    for filepath in csv_files:
        with open(filepath, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 13:
                    all_rows.append(row)

    print(f"Total rows loaded: {len(all_rows)}")

    results = []

    for bridge in ICD10_BRIDGE:
        keyword = bridge["search_keyword"].lower()
        matched_rows = []

        for row in all_rows:
            proc_group = row[COL_PROC_GROUP].lower()
            proc_name  = row[COL_PROC_NAME].lower()
            combined   = proc_group + " " + proc_name

            if keyword in combined:
                matched_rows.append(row)

        if not matched_rows:
            print(f"  [WARN] No match for: {bridge['search_keyword']}")
            continue

        # Take the most representative row (first clean one with rates)
        # Apply sub-row extraction for multi-embedded rows
        best_row = None
        for row in matched_rows:
            candidate = best_subrow(row, keyword)
            t1 = clean_number(candidate[COL_TIER1])
            t2 = clean_number(candidate[COL_TIER2])
            t3 = clean_number(candidate[COL_TIER3])
            if t1 > 0 and t2 > 0 and t3 > 0:
                best_row = candidate
                break

        if not best_row:
            best_row = best_subrow(matched_rows[0], keyword)

        t1 = clean_number(best_row[COL_TIER1])
        t2 = clean_number(best_row[COL_TIER2])
        t3 = clean_number(best_row[COL_TIER3])
        base = clean_number(best_row[COL_BASE_RATE])
        implant_cost = parse_implant_cost(best_row[COL_IMPLANT_VAL] if len(best_row) > COL_IMPLANT_VAL else "")
        implant_covered = (best_row[COL_IMPLANT_COV].strip().lower() == "yes") if len(best_row) > COL_IMPLANT_COV else False

        entry = {
            "icd10_code":        bridge["icd10_code"],
            "condition_name":    bridge["condition_name"],
            "approved_treatment": best_row[COL_PROC_GROUP].replace("\n", " ").strip(),
            "procedure_detail":   best_row[COL_PROC_NAME].replace("\n", " ").strip(),
            "hbp_code":           best_row[COL_HBP_CODE].replace("\n", " ").strip(),
            "department":         bridge["department"],
            "pmjay": {
                "base_rate":        base,
                "tier1_rate":       t1,   # Major metros (Pune, Mumbai, Delhi)
                "tier2_rate":       t2,   # Mid cities (Nagpur)
                "tier3_rate":       t3,   # Smaller cities
                "implant_cost":     implant_cost,
                "implant_covered":  implant_covered,
                "total_with_implant_tier1": t1 + (implant_cost if not implant_covered else 0),
                "total_with_implant_tier2": t2 + (implant_cost if not implant_covered else 0),
                "total_with_implant_tier3": t3 + (implant_cost if not implant_covered else 0),
            },
            "cost_breakdown": {
                "tier1": compute_breakdown(t1, implant_cost if not implant_covered else 0),
                "tier2": compute_breakdown(t2, implant_cost if not implant_covered else 0),
                "tier3": compute_breakdown(t3, implant_cost if not implant_covered else 0),
            },
            "risk_flags":    bridge["risk_flags"],
            "search_keyword": bridge["search_keyword"],
        }

        print(f"  [OK] {bridge['condition_name']} -> {entry['hbp_code']} | Tier1: Rs{t1:,} | Tier2: Rs{t2:,} | Implant: Rs{implant_cost:,}")
        results.append(entry)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Wrote {len(results)} procedures to: {OUTPUT_FILE}")
    return results

if __name__ == "__main__":
    compile_procedures()
