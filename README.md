# UPI Fraud Detection and Risk Assessment System
> **Undergraduate B.Tech Final-Year Project**  
> *Department of Computer Science & Engineering*

---

## 🌟 Project Overview

**UPI Fraud Detection and Risk Assessment System** is a clean, explainable academic cybersecurity prototype for analyzing UPI transactions against user behavioural baselines.

The system features:
1. **Local App-Aware OCR Engine (PaddleOCR)**: Automatically detects whether a transaction screenshot is from **BHIM**, **PhonePe**, or **Google Pay**, and extracts amount, recipient, transaction ID / UTR, date/time, UPI ID, bank account, and remarks using layout-specific region rules.
2. **13 Behavioral Fraud Patterns (P1–P13)**: Explains exact behavioral indicators (rapid bursts, repeated same-amount transactions, amount deviations, new recipients, and deceptive AutoPay / recurring mandate setups).
3. **Transparent Explainability (XAI)**: Generates human-readable "Why?" explanations and actionable safety recommendations.
4. **Active Mode vs Demo Mode Isolation**: Permanent Active Mode with real local SQLite persistence, plus an isolated password-protected (`admin123`) Demo Mode for academic evaluations.

---

## 🔄 End-to-End Workflow

```
Upload Screenshot
   ↓
Detect App (BHIM / PhonePe / Google Pay)
   ↓
PaddleOCR Reads Text & Bounding Boxes
   ↓
App-Specific Region/Field Mapping
   ↓
Data Validation & Confidence Scoring
   ↓
User Verification & Confirmation
   ↓
Transaction Saved to Local SQLite
   ↓
Fraud Risk & Behavioral Pattern Analysis
```

---

## 💻 Technology Stack

- **Frontend**: React 19 + Vite (Cybersecurity Black + Pink theme)
- **Backend**: Python 3.9+ with Flask (REST API on `localhost:8000`)
- **Database**: Embedded SQLite (`backend/fraud_detection.db`)
- **OCR Engine**: PaddleOCR (100% Local Inference, no cloud APIs)
- **Analytics**: pandas, scikit-learn, numpy

> **Zero Cloud Dependencies**: 100% localhost operation. No Firebase, AWS, MongoDB, or external cloud services.

---

## 🚀 One-Click Setup & Launch

Clone the repository and run the self-bootstrapping launcher:

```bash
git clone https://github.com/sivasan18/UPI-Fraud-Detection.git
cd UPI-Fraud-Detection
chmod +x start.sh
./start.sh
```

`./start.sh` will automatically:
1. Create `backend/venv` and install all dependencies from `requirements.txt`.
2. Install frontend packages with `npm install` if not present.
3. Start the Flask backend on `http://localhost:8000`.
4. Start the React frontend on `http://localhost:5173`.

---

## 🛠️ Manual Installation (Alternative)

### Backend Setup:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

Visit: **`http://localhost:5173`**

---

## 📁 Project Structure

```
├── .gitignore                     # Git rules (excludes venv, node_modules, temp files)
├── README.md                      # Project documentation and setup guide
├── start.sh                       # One-click startup & dependency bootstrapper
├── backend/
│   ├── app.py                     # Flask REST API endpoints
│   ├── database.py                # SQLite database management
│   ├── ocr_service.py             # PaddleOCR engine & app-specific extractors
│   ├── risk_engine.py             # 13-pattern behavioural fraud detection engine
│   ├── profile_engine.py          # User spending baseline profiling
│   ├── requirements.txt           # Python backend dependencies
│   ├── fraud_detection.db         # Local SQLite database
│   └── reference_samples/         # Ground-truth layout reference screenshots
│       ├── bhim/bhim_sample.jpg
│       ├── phonepe/phonepe_sample.jpg
│       └── googlepay/googlepay_sample.jpg
└── frontend/
    ├── package.json               # Frontend dependencies
    ├── vite.config.js             # Vite development server config
    └── src/
        ├── context/AppContext.jsx # Application state & Active/Demo mode logic
        ├── pages/                 # React UI pages (Upload, OCR, Analysis, History, etc.)
        └── components/            # Reusable UI components & layouts
```

---


## 🔬 OCR Setup

### How OCR Models Are Managed

The system uses **PaddleOCR** (local inference, no cloud API). Model files (~177 MB) are downloaded **once** on first run and cached at `backend/models/paddlex/`. They are **not committed to git** (too large), but are **automatically re-downloaded** whenever the marker file `backend/models/paddlex/official_models/.ready` is missing.

### Fresh Clone (Automatic — Recommended)

```bash
git clone https://github.com/sivasan18/UPI-Fraud-Detection.git
cd UPI-Fraud-Detection
chmod +x start.sh
./start.sh
```

`start.sh` automatically detects whether OCR models are present and downloads them if not. No manual steps required.

### Manual OCR Model Download (if needed)

If OCR fails after a restart, you can force a fresh model download:

```bash
cd backend
venv/bin/python3 download_models.py
```

This script:
1. Sets `PADDLE_PDX_CACHE_HOME` to `backend/models/paddlex/` (project-local).
2. Downloads and verifies all required OCR models.
3. Runs a smoke test to confirm the engine works.

### Why OCR Is Persistent After Restart

- `PADDLE_PDX_CACHE_HOME` is set to a **project-relative absolute path** (`backend/models/paddlex/`) inside `ocr_service.py` at module load time — before any PaddleOCR imports.
- This means it is **independent of the shell session, current working directory, or any environment variable** you set externally.
- The Flask backend also **pre-warms the OCR engine on startup**, so any model failure is immediately visible in the terminal log.

### Verifying OCR Is Working

Check the Flask startup log. You should see:
```
[Startup] Pre-warming PaddleOCR engine from: .../backend/models/paddlex
[Startup] PaddleOCR engine is ready.
```

Or call the health API:
```bash
curl http://localhost:8000/api/health
```

A healthy response includes:
```json
{ "ocr_ready": true, "ocr_model_dir": "...", "ocr_error": null }
```

---
## 🔐 Administrator Password
- Administrator password for switching to Demo Mode and removing Demo data: **`admin123`**

---

## ⚠️ Academic Disclaimer
*This project is an academic research prototype developed for B.Tech CSE final-year evaluation. It operates strictly locally on user-submitted or synthetic transaction records and does not connect to real banking networks or payment gateways.*
