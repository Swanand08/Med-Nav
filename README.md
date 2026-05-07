<div align="center">

# 🏥 MedNav — AI-Powered Clinical Healthcare Navigator

### _Bringing transparency, AI precision, and genuine empathy back into the hands of the patient._

[![Built at TenzorX](https://img.shields.io/badge/Hackathon-TenzorX%20by%20Poonawalla%20Group-blue?style=for-the-badge)](https://unstop.com/o/7ulMpit?lb=wYNNhK4K)
[![Python](https://img.shields.io/badge/Backend-FastAPI%20(Python)-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%202.0-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

</div>

---

## 🚨 The Problem

Navigating the Indian healthcare system is broken for patients:

1.  **Medical Jargon Maze** — Patients experience symptoms but don't know clinical terminologies or required procedures.
2.  **Zero Price Transparency** — Hospital pricing is a black box with hidden fees (diagnostics, contingencies, surgeon fees). Patients have no idea what the fair market rate or the officially regulated government baseline is.
3.  **Information Overload** — Generic 5-star Google ratings mean nothing when choosing a hospital for a life-saving procedure.

---

## 💡 The Solution

**MedNav** is an intelligent, end-to-end healthcare concierge that acts as an **Intelligent Decision Layer** on top of the healthcare infrastructure. By simply typing symptoms in plain English, patients receive an instant, transparent, and actionable clinical pathway.

> **MedNav is NOT a chatbot.** It is a structured clinical and financial engine that cross-references government pricing schedules, real-time geospatial data, and live hospital sentiment to produce a mathematically sound recommendation.

---

## ✨ Core Features

### 🧠 AI Clinical Intent Extractor
Users type symptoms in conversational language (e.g., _"My dad's knee has been hurting for months"_). Our AI triage system translates this into standardized **ICD-10 clinical diagnostic codes** and maps out the exact required procedure (e.g., Osteoarthritis → Total Knee Replacement).

### ⚖️ Dual-Track Cost Analysis (Anchored in PMJAY)
MedNav's pricing engine is directly integrated with the official **PMJAY (Pradhan Mantri Jan Arogya Yojana) Health Benefit Package 2024 Schedule**. We provide a side-by-side breakdown:
- **Government Baseline**: Official PMJAY-regulated costs
- **Private Market Average**: Estimated costs adjusted via city-tier multipliers and facility-specific variance

Hidden fees (Room Stay, ICU, Doctor Fees, Pharmacy, Contingency) are mathematically exposed.

### 📊 Decoding Ratings into Real-World Clinical Facts
Instead of showing a meaningless 4.5-star average, MedNav dynamically scrapes **live Google Places reviews** and runs NLP sentiment analysis to extract clinical operational realities:
- ✅ _"Fast Cardiac Admission"_
- ⚠️ _"Long OPD Wait Times"_

### 📍 Intelligent Hospital Ranking Engine
Computes a localized **"Fit Score"** for nearby hospitals by combining:
- Haversine GPS distance tracking
- PMJAY-empanelment verification
- Live sentiment scores
- Budget constraints

### 🚨 'Red SOS' Emergency Override Protocol
If life-threatening symptoms (like a stroke or cardiac event) are detected, MedNav **forces a halt** on the standard workflow. It bypasses cost estimates and triggers a high-contrast **Red SOS screen** directing the patient to immediate emergency care.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React.js Frontend                       │
│            (Tailwind CSS + Framer Motion)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                   FastAPI Backend                            │
│              (Async + High Concurrency)                     │
├─────────────┬───────────────┬───────────────┬───────────────┤
│   Intent    │     Cost      │   Hospital    │   Review      │
│  Extractor  │  Calculator   │   Finder      │  Analyzer     │
│  (Gemini)   │  (PMJAY HBP)  │ (Google Maps) │  (Gemini NLP) │
└─────────────┴───────────────┴───────────────┴───────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Google Gemini   Google Places   PMJAY HBP 2024
   2.0 Flash API      API          Schedule Data
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI (Python), Async I/O |
| **AI Engine** | Google Gemini 2.0 Flash API |
| **Geospatial & Reviews** | Google Places API |
| **Government Data** | PMJAY Health Benefit Package 2024 |
| **Concurrency** | `asyncio.gather` with API jitter limits |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API Key
- Google Places API Key

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd mednav-ui
npm install
cp .env.example .env
# Set VITE_API_URL in .env
npm run dev
```

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── services/
│   │   ├── intent_extractor.py  # Gemini-powered symptom → ICD-10 mapping
│   │   ├── cost_calculator.py   # PMJAY + Private cost engine
│   │   ├── hospital_finder.py   # Google Places + Haversine ranking
│   │   ├── review_analyzer.py   # Live sentiment analysis
│   │   └── ranker.py            # Fit Score computation
│   └── requirements.txt
├── mednav-ui/
│   ├── src/
│   │   ├── components/          # React UI components
│   │   ├── api/                 # API client
│   │   └── App.jsx              # Main application
│   └── package.json
├── data/
│   └── pmjay_hbp_2024/          # Official PMJAY pricing data
└── procedures.json              # Procedure mapping database
```

---

## 👥 Team Arjuna

| Name | Role |
|------|------|
| **Atharva Joshi** | Full-Stack Development, AI Integration |
| **Siddhant Sonawane** | Backend & Data Engineering |
| **Swanand Nalawade** | Frontend & UI/UX Design |

---

## 🏆 Built at TenzorX Hackathon

This project was built for the **TenzorX Hackathon** organized by the **Poonawalla Group** on [Unstop](https://unstop.com/o/7ulMpit?lb=wYNNhK4K).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by Team Arjuna**

_If this project helped or inspired you, consider giving it a ⭐!_

</div>
