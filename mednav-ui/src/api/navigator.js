/**
 * MedNav — Real API Client
 * Connects to FastAPI backend at http://localhost:8000
 * Replaces the mock setTimeout-based functions.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Main analysis function — calls the real 3-layer pipeline.
 * Replaces mapCondition + searchHospitals + getFullAnalysis mocks.
 */
export const analyzeQuery = async ({ query, city, age, budget, comorbidities, persona, userLat, userLng }) => {
  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      city: city || "Pune",
      age: age ? parseInt(age) : null,
      budget: budget ? parseFloat(budget) : null,
      comorbidities: comorbidities || [],
      persona: persona || "patient",
      user_lat: userLat || null,
      user_lng: userLng || null,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Analysis failed");
  }

  return result; // { success, emergency, data }
};

// ─── Legacy function signatures kept for backward compatibility ──────────────
// These now go through the single real backend endpoint.

export const mapCondition = async (query, age, comorbidities) => {
  // Called by App.jsx as Step 1 — now is a no-op; real call is in handleSearchSubmit
  return { query, age, comorbidities };
};

export const searchHospitals = async (params) => {
  // Called by App.jsx as Step 2 — delegated to full analyze call
  return params;
};

export const getFullAnalysis = async (params) => {
  // Called by App.jsx as Step 3 — delegated to full analyze call
  return params;
};
