# UPI Fraud Detection and Risk Assessment System
> **Undergraduate B.Tech Final-Year Project**  
> *Department of Computer Science & Engineering*

---

## 🌟 Project Overview

**UPI Fraud Detection and Risk Assessment System** is a simple, clean, and elegant academic prototype designed for undergraduate project demonstration and viva evaluation.

The system evaluates UPI transactions against historical user behaviour, checks for simple fraud indicators (such as unusual amounts, new recipients, and rapid repeated transactions), calculates a clear risk score (0–100), and provides actionable safety recommendations.

### 5-Step Project Workflow
```
UPLOAD (Screenshot / Manual)
   ↓
EXTRACT (Local OCR / Regex)
   ↓
VERIFY (Human-in-the-Loop Confirmation)
   ↓
ANALYSE (6 Simple Fraud Indicators + Baseline Comparison)
   ↓
RESULT (Risk Score 0–100 + Why? + What Next?)
```

---

## 💻 Simple Technology Stack

- **Frontend**: React + JSX + CSS (Clean Black + Pink Theme)
- **Backend**: Python + Flask (REST API on `localhost:8000`)
- **Database**: Embedded SQLite (`fraud_detection.db`)
- **Machine Learning & Stats**: scikit-learn, pandas, numpy
- **OCR Engine**: Tesseract OCR (with reliable regex fallback)

> **Zero Cloud Dependencies**: 100% localhost operation. No Firebase, AWS, MongoDB, or Supabase.

---

## 🎨 Visual Design

- **Theme**: Fixed **Black + Pink** student-project style (no light/dark switch).
- **Main Header**: "UPI Fraud Detection System"
- **Browser Title**: "UPI Fraud Detection & Risk Assessment System"
- **Cards & Layout**: Simple cards, tables, and forms with zero clutter.

---

## 🔒 Dual Mode System

1. **ACTIVE MODE (Default)**:
   - Starts with `0 Transactions` (clean state).
   - Stores real/manual user transaction entries in local SQLite.
2. **DEMO MODE (Temporary Academic Sandbox)**:
   - For showing sample scenarios to the professor.
   - Switch with Administrator Password: `admin123`.
   - Clearly marked with `DEMO MODE` and `Synthetic data for project demonstration.`
3. **REMOVE DEMO MODE**:
   - Available in Settings $\rightarrow$ Remove Demo Mode.
   - Requires password `admin123` $\rightarrow$ confirmation dialog $\rightarrow$ purges demo partition, sets `DEMO_MODE_ENABLED=false`.
   - **Never deletes or affects Active Mode data**.

---

## 📊 Risk Score Classification (0–100)

- **0–29**: **LOW RISK** — "Transaction appears consistent with available history. Proceed only if you recognize it."
- **30–59**: **MEDIUM RISK** — "Review the transaction and verify the recipient."
- **60–79**: **HIGH RISK** — "Verify the transaction before proceeding."
- **80–100**: **CRITICAL RISK** — "Do not proceed with an unfamiliar transaction. Verify independently."

---

## 🚀 How to Run on Localhost

### 1. One-Click Startup Script
```bash
./start.sh
```

### 2. Manual Startup

**Terminal 1 — Flask Backend:**
```bash
cd backend
./venv/bin/python3 app.py
```

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🔐 Administrator Password
- Mode Switching & Demo Removal Password: **`admin123`** (all lowercase, no spaces).

---

## ⚠️ Academic Disclaimer
> *This project is an academic prototype for UPI transaction risk assessment. It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.*
# upi-fraud-detection-v-version
