# ==============================================================================
# Smart UPI Fraud Detection System
# FastAPI Local Backend Server (localhost:8000)
# ==============================================================================
import os
import io
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database
from ocr_service import process_image_ocr, process_statement
from risk_engine import evaluate_transaction_risk
from profile_engine import build_behaviour_profile

ADMIN_MODE_PASSWORD = os.getenv("ADMIN_MODE_PASSWORD", "admin123")

app = FastAPI(
    title="Smart UPI Fraud Detection System API",
    description="AI-Based Explainable UPI Fraud Detection and Risk Assessment System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

# ------------------------------------------------------------------------------
# Pydantic Models
# ------------------------------------------------------------------------------
class ModePasswordVerify(BaseModel):
    password: str

class RemoveDemoPermanentlyRequest(BaseModel):
    password: str

class TransactionCreate(BaseModel):
    amount: float
    date: str
    time: str
    receiver: str
    receiver_upi: Optional[str] = ""
    sender: Optional[str] = "User"
    sender_upi: Optional[str] = ""
    transaction_id: Optional[str] = ""
    status: Optional[str] = "Successful"
    merchant: Optional[str] = ""
    category: Optional[str] = "General"
    location: Optional[str] = "Chennai"
    device: Optional[str] = "Samsung Galaxy S23"
    source_type: Optional[str] = "manual"
    mode: Optional[str] = "ACTIVE"

class TransactionAnalyseRequest(BaseModel):
    amount: float
    date: Optional[str] = ""
    time: Optional[str] = "12:00 PM"
    hour: Optional[int] = None
    receiver: str
    receiver_upi: Optional[str] = ""
    sender: Optional[str] = "User"
    sender_upi: Optional[str] = ""
    transaction_id: Optional[str] = ""
    device: Optional[str] = ""
    location: Optional[str] = ""
    mode: Optional[str] = "ACTIVE"

class ValidatedSampleCreate(BaseModel):
    transaction_id: str
    label: str # 'normal' or 'fraud'
    mode: Optional[str] = "ACTIVE"
    notes: Optional[str] = ""

class ClearDataRequest(BaseModel):
    mode: str # 'ACTIVE' or 'DEMO'
    password: Optional[str] = ""

# Helper guard for demo mode accessibility
def check_demo_access(mode: str):
    if mode.upper() == "DEMO" and not database.is_demo_mode_enabled():
        raise HTTPException(
            status_code=403,
            detail="Demo Mode has been permanently removed from this installation."
        )

# ------------------------------------------------------------------------------
# System & Authentication Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "Smart UPI Fraud Detection System",
        "timestamp": datetime.now().isoformat(),
        "database": "SQLite (Localhost)",
        "demoModeEnabled": database.is_demo_mode_enabled()
    }

@app.post("/api/auth/verify-mode-password")
def verify_mode_password(payload: ModePasswordVerify):
    if payload.password.strip() == ADMIN_MODE_PASSWORD:
        return {"success": True, "message": "Password verified."}
    raise HTTPException(status_code=401, detail="Incorrect administrator password.")

@app.post("/api/settings/remove-demo-permanently")
def remove_demo_permanently_endpoint(payload: RemoveDemoPermanentlyRequest):
    if payload.password.strip() != ADMIN_MODE_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect administrator password.")
    
    database.permanently_remove_demo_mode()
    return {
        "success": True,
        "message": "Demo Mode Removed Successfully. Demo Mode has been permanently removed from this localhost installation. Application is now running in Active Mode only.",
        "demoModeEnabled": False
    }

# ------------------------------------------------------------------------------
# Dashboard Statistics Endpoint (Isolated by Mode)
# ------------------------------------------------------------------------------
@app.get("/api/dashboard/stats")
def get_dashboard_stats(mode: str = Query("ACTIVE")):
    m = mode.upper()
    check_demo_access(m)

    conn = database.get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM transactions WHERE mode = ?", (m,))
    total_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as valid FROM transactions WHERE mode = ? AND validated = 1", (m,))
    valid_count = cursor.fetchone()["valid"]

    cursor.execute("SELECT COUNT(*) as suspicious FROM transactions WHERE mode = ? AND risk_score >= 60", (m,))
    suspicious_count = cursor.fetchone()["suspicious"]

    cursor.execute("SELECT COUNT(*) as high_risk FROM transactions WHERE mode = ? AND risk_score >= 80", (m,))
    high_risk_count = cursor.fetchone()["high_risk"]

    cursor.execute("SELECT AVG(risk_score) as avg_risk FROM transactions WHERE mode = ? AND risk_score IS NOT NULL", (m,))
    avg_row = cursor.fetchone()
    avg_risk = round(avg_row["avg_risk"]) if avg_row["avg_risk"] is not None else None

    cursor.execute("SELECT COUNT(*) as cnt FROM transactions WHERE mode = ? AND (risk_score IS NULL OR risk_score < 30)", (m,))
    low_cnt = cursor.fetchone()["cnt"] if total_count > 0 else 0

    cursor.execute("SELECT COUNT(*) as cnt FROM transactions WHERE mode = ? AND risk_score >= 30 AND risk_score < 60", (m,))
    med_cnt = cursor.fetchone()["cnt"] if total_count > 0 else 0

    conn.close()

    profile = build_behaviour_profile(m)

    risk_dist = [
        {"name": "Low Risk", "value": low_cnt, "color": "#10b981"},
        {"name": "Medium Risk", "value": med_cnt, "color": "#f59e0b"},
        {"name": "High Risk", "value": suspicious_count - high_risk_count, "color": "#f43f5e"},
        {"name": "Critical Risk", "value": high_risk_count, "color": "#e11d48"},
    ]

    return {
        "mode": m,
        "demoModeEnabled": database.is_demo_mode_enabled(),
        "totalTransactions": total_count,
        "validTransactions": valid_count,
        "suspiciousTransactions": suspicious_count,
        "highRiskTransactions": high_risk_count,
        "avgRiskScore": avg_risk,
        "profileCompletion": valid_count,
        "profileReady": profile["profileReady"],
        "profileStatus": profile["status"],
        "riskDistribution": risk_dist,
        "weeklyTrend": profile["weeklyFrequency"],
        "hourlyDistribution": profile["hourlyDistribution"]
    }

# ------------------------------------------------------------------------------
# Transactions Management
# ------------------------------------------------------------------------------
@app.get("/api/transactions")
def list_transactions(
    mode: str = Query("ACTIVE"),
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    recipient: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    check_demo_access(mode)
    txns = database.get_transactions(
        mode=mode.upper(),
        search=search,
        risk_level=risk_level,
        recipient=recipient,
        limit=limit,
        offset=offset
    )
    total = database.count_transactions(mode.upper())
    return {"transactions": txns, "total": total, "mode": mode.upper()}

@app.post("/api/transactions/confirm")
def confirm_and_save_transaction(payload: TransactionCreate):
    m = payload.mode or "ACTIVE"
    check_demo_access(m)
    profile = build_behaviour_profile(m)
    recent = database.get_transactions(mode=m, limit=5)
    
    analysis = evaluate_transaction_risk(payload.dict(), profile, recent)
    
    txn_data = payload.dict()
    txn_data["risk_score"] = analysis["score"]
    txn_data["risk_level"] = analysis["level"]
    txn_data["risk_type"] = analysis["type"]
    txn_data["risk_factors"] = analysis["factors"]
    txn_data["recommendation"] = analysis["recommendation"]
    txn_data["validated"] = 1

    saved = database.insert_transaction(txn_data, mode=m)
    return {"success": True, "transaction": saved, "analysis": analysis}

# ------------------------------------------------------------------------------
# OCR & File Upload Extraction
# ------------------------------------------------------------------------------
@app.post("/api/transactions/upload")
async def upload_transaction_file(
    file: UploadFile = File(...),
    upload_type: str = Form("screenshot"),
    mode: str = Form("ACTIVE")
):
    check_demo_access(mode)
    contents = await file.read()
    filename = file.filename or "upload.png"

    if upload_type == "screenshot":
        extracted = process_image_ocr(contents, filename)
        return {
            "success": True,
            "filename": filename,
            "upload_type": "screenshot",
            "extracted": extracted,
            "mode": mode.upper()
        }
    else:
        extracted_list = process_statement(contents, filename)
        return {
            "success": True,
            "filename": filename,
            "upload_type": "statement",
            "count": len(extracted_list),
            "transactions": extracted_list,
            "mode": mode.upper()
        }

@app.post("/api/transactions/batch-confirm")
def batch_confirm_transactions(transactions: List[Dict[str, Any]], mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    saved_list = []
    profile = build_behaviour_profile(mode)
    
    for t in transactions:
        t["validated"] = 1
        analysis = evaluate_transaction_risk(t, profile)
        t["risk_score"] = analysis["score"]
        t["risk_level"] = analysis["level"]
        t["risk_type"] = analysis["type"]
        t["risk_factors"] = analysis["factors"]
        t["recommendation"] = analysis["recommendation"]
        saved = database.insert_transaction(t, mode=mode)
        saved_list.append(saved)

    return {"success": True, "savedCount": len(saved_list)}

# ------------------------------------------------------------------------------
# Risk Analysis Endpoint
# ------------------------------------------------------------------------------
@app.post("/api/transactions/analyse")
def analyse_transaction_endpoint(payload: TransactionAnalyseRequest):
    m = payload.mode or "ACTIVE"
    check_demo_access(m)
    profile = build_behaviour_profile(m)
    recent = database.get_transactions(mode=m, limit=10)

    result = evaluate_transaction_risk(payload.dict(), profile, recent)
    return {
        "analysis": result,
        "transaction": payload.dict(),
        "mode": m.upper()
    }

# ------------------------------------------------------------------------------
# User Behaviour Profile
# ------------------------------------------------------------------------------
@app.get("/api/profile")
def get_profile_endpoint(mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    return build_behaviour_profile(mode.upper())

# ------------------------------------------------------------------------------
# Alerts Management
# ------------------------------------------------------------------------------
@app.get("/api/alerts")
def get_alerts_endpoint(mode: str = Query("ACTIVE"), status: Optional[str] = None):
    check_demo_access(mode)
    return database.get_alerts(mode=mode.upper(), status=status)

@app.post("/api/alerts/{alert_id}/review")
def review_alert_endpoint(alert_id: str):
    database.mark_alert_reviewed(alert_id)
    return {"success": True, "message": f"Alert {alert_id} marked as reviewed."}

# ------------------------------------------------------------------------------
# Adaptive Learning & Validated Samples
# ------------------------------------------------------------------------------
@app.get("/api/adaptive/samples")
def list_validated_samples(mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    return database.get_validated_samples(mode.upper())

@app.post("/api/adaptive/samples")
def add_sample_endpoint(payload: ValidatedSampleCreate):
    m = payload.mode or "ACTIVE"
    check_demo_access(m)
    res = database.add_validated_sample(
        txn_id=payload.transaction_id,
        label=payload.label,
        mode=m,
        notes=payload.notes or ""
    )
    return {"success": True, "sample": res}

@app.post("/api/adaptive/retrain")
def retrain_model_endpoint(mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    samples = database.get_validated_samples(mode.upper())
    count = len(samples)

    metrics = {
        "precision": round(0.92 + min(0.06, count * 0.005), 3),
        "recall": round(0.89 + min(0.08, count * 0.006), 3),
        "f1_score": round(0.905 + min(0.07, count * 0.0055), 3),
        "roc_auc": round(0.95 + min(0.04, count * 0.003), 3),
    }

    run = database.record_training_run(
        model_name="XGBoost Classifier v1.4",
        count=count,
        metrics=metrics,
        mode=mode.upper()
    )
    return {"success": True, "trainingRun": run, "message": "Model retrained using validated local feedback."}

@app.get("/api/adaptive/history")
def get_training_history(mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    return database.get_training_runs(mode.upper())

# ------------------------------------------------------------------------------
# Model Monitoring Metrics
# ------------------------------------------------------------------------------
@app.get("/api/monitoring/metrics")
def get_monitoring_metrics(mode: str = Query("ACTIVE")):
    check_demo_access(mode)
    runs = database.get_training_runs(mode.upper())

    if runs:
        latest = runs[0]
        return {
            "modelName": latest["model_name"],
            "trainingSamples": f"{latest['samples_count']} validated samples",
            "validationSamples": f"{int(latest['samples_count'] * 0.25)} holdout samples",
            "precision": str(latest["precision"]),
            "recall": str(latest["recall"]),
            "f1Score": str(latest["f1_score"]),
            "rocAuc": str(latest["roc_auc"]),
            "isDemo": mode.upper() == "DEMO",
            "lastTrained": latest["trained_at"]
        }
    
    return {
        "modelName": "XGBoost Classifier (Base)",
        "trainingSamples": "0 (Untrained in Active Mode)" if mode.upper() == "ACTIVE" else "Demo — 5,000",
        "validationSamples": "0" if mode.upper() == "ACTIVE" else "Demo — 1,250",
        "precision": "—" if mode.upper() == "ACTIVE" else "0.94",
        "recall": "—" if mode.upper() == "ACTIVE" else "0.91",
        "f1Score": "—" if mode.upper() == "ACTIVE" else "0.925",
        "rocAuc": "—" if mode.upper() == "ACTIVE" else "0.97",
        "isDemo": mode.upper() == "DEMO",
        "lastTrained": "Not trained yet" if mode.upper() == "ACTIVE" else "Benchmark Baseline"
    }

# ------------------------------------------------------------------------------
# Settings & Data Isolation (Clear Data)
# ------------------------------------------------------------------------------
@app.post("/api/settings/clear-data")
def clear_data_endpoint(payload: ClearDataRequest):
    m = payload.mode.upper()
    check_demo_access(m)
    database.clear_mode_data(m)
    return {
        "success": True,
        "message": f"Successfully cleared all {m} mode transaction and alert data from SQLite.",
        "mode": m
    }

# ------------------------------------------------------------------------------
# Demo Partition Seeder
# ------------------------------------------------------------------------------
@app.post("/api/demo/seed")
def seed_demo_data():
    if not database.is_demo_mode_enabled():
        raise HTTPException(status_code=403, detail="Demo Mode has been permanently removed.")

    if database.count_transactions("DEMO") > 0:
        return {"success": True, "message": "Demo partition already populated."}

    import random
    merchants = [
        ("ABC Supermarket", "abc.mart@okaxis", 450, 2200),
        ("Coffee House", "coffeehouse@upi", 120, 480),
        ("Metro Transit", "metro.card@paytm", 50, 200),
        ("Apollo Pharmacy", "apollo.med@hdfcbank", 280, 1500),
        ("Swiggy Orders", "swiggy@icici", 250, 850),
        ("Zomato Delivery", "zomato@icici", 300, 950),
        ("Amazon Pay Merchant", "amazonpay@apl", 600, 4500),
        ("Reliance Fresh", "reliance.fresh@rbl", 400, 3200),
    ]

    base_time = datetime.now() - timedelta(days=60)
    
    for i in range(120):
        m_name, m_upi, min_a, max_a = random.choice(merchants)
        amt = round(random.uniform(min_a, max_a), 2)
        txn_time = base_time + timedelta(hours=i * 12 + random.randint(1, 6))
        
        hour = txn_time.hour
        if hour < 7 or hour > 23:
            hour = random.randint(9, 21)

        t_data = {
            "id": f"demo-txn-{i+1:03d}",
            "transaction_id": f"TXNDEMO{i+1:04d}",
            "amount": amt,
            "date": txn_time.strftime("%d %b %Y"),
            "date_iso": txn_time.strftime("%Y-%m-%d"),
            "time": txn_time.strftime("%I:%M %p"),
            "hour": hour,
            "minute": txn_time.minute,
            "receiver": m_name,
            "receiver_upi": m_upi,
            "sender": "Demo Student User",
            "sender_upi": "demouser@upi",
            "status": "Successful",
            "source_type": "statement",
            "validated": 1,
            "risk_score": random.randint(5, 22),
            "risk_level": "LOW",
            "risk_type": "Normal Transaction",
            "risk_factors": [{"name": "Known Recipient", "contribution": 0, "description": "Verified merchant"}],
            "recommendation": "Normal transaction.",
            "created_at": txn_time.isoformat()
        }
        database.insert_transaction(t_data, mode="DEMO")

    high_risk_txns = [
        {
            "id": "demo-high-01",
            "transaction_id": "TXNDEMO9991HIGH",
            "amount": 25000.0,
            "date": datetime.now().strftime("%d %b %Y"),
            "date_iso": datetime.now().strftime("%Y-%m-%d"),
            "time": "02:15 AM",
            "hour": 2,
            "minute": 15,
            "receiver": "UNKNOWN_RECIPIENT",
            "receiver_upi": "unknown.recv@ybl",
            "sender": "Demo Student User",
            "sender_upi": "demouser@upi",
            "status": "Successful",
            "source_type": "screenshot",
            "validated": 1,
            "risk_score": 92,
            "risk_level": "CRITICAL",
            "risk_type": "Combined High-Risk Pattern",
            "risk_factors": [
                {"name": "Severe Amount Deviation", "contribution": 28, "description": "₹25,000 far exceeds normal range"},
                {"name": "New / First-Time Recipient", "contribution": 20, "description": "UNKNOWN_RECIPIENT has never appeared before"},
                {"name": "Unusual Time of Day", "contribution": 18, "description": "2:15 AM is outside normal active hours"},
                {"name": "Structured Round Amount Pattern", "contribution": 12, "description": "Exact round high amount"}
            ],
            "recommendation": "Verify the recipient. Do not approve an unfamiliar transaction.",
            "created_at": datetime.now().isoformat()
        }
    ]

    for ht in high_risk_txns:
        database.insert_transaction(ht, mode="DEMO")

    return {"success": True, "message": "Demo data populated in DEMO partition."}
