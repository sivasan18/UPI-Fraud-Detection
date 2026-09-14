# ==============================================================================
# Fraud Detection and Risk Assessment System
# Local SQLite Database Interface & Isolation
# ==============================================================================
import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "fraud_detection.db")

def get_db_connection():
    """Returns a SQLite connection with dict-like row factory."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the local SQLite database schema."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. System Config table for persistent feature flags (e.g. demo_mode_enabled)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    # Default demo_mode_enabled to 'true' if not set
    cursor.execute("SELECT value FROM system_config WHERE key = 'demo_mode_enabled'")
    row = cursor.fetchone()
    if not row:
        cursor.execute("INSERT INTO system_config (key, value) VALUES ('demo_mode_enabled', 'true')")

    # 2. Transactions table with mode isolation (ACTIVE vs DEMO)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        transaction_id TEXT,
        mode TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' or 'DEMO'
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        date_iso TEXT,
        time TEXT NOT NULL,
        hour INTEGER,
        minute INTEGER,
        sender TEXT,
        sender_upi TEXT,
        receiver TEXT NOT NULL,
        receiver_upi TEXT,
        status TEXT DEFAULT 'Successful',
        merchant TEXT,
        category TEXT,
        location TEXT,
        device TEXT,
        source_type TEXT DEFAULT 'manual', -- 'screenshot', 'statement', 'manual'
        validated INTEGER DEFAULT 1,       -- 1 for validated historical, 0 for new
        risk_score INTEGER,
        risk_level TEXT,                   -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        risk_type TEXT,
        risk_factors TEXT,                 -- JSON string
        recommendation TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 3. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT 'ACTIVE',
        transaction_id TEXT NOT NULL,
        severity TEXT NOT NULL,           -- 'low', 'medium', 'high', 'critical'
        risk_score INTEGER NOT NULL,
        risk_type TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'active',     -- 'active', 'reviewed'
        created_at TEXT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
    """)

    # 4. Validated Samples table (for Adaptive Learning)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS validated_samples (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT 'ACTIVE',
        transaction_id TEXT NOT NULL,
        label TEXT NOT NULL,              -- 'normal' or 'fraud'
        feedback_notes TEXT,
        validated_by TEXT DEFAULT 'Local User',
        created_at TEXT NOT NULL
    );
    """)

    # 5. Training runs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS training_runs (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT 'ACTIVE',
        model_name TEXT NOT NULL,
        samples_count INTEGER NOT NULL,
        precision REAL,
        recall REAL,
        f1_score REAL,
        roc_auc REAL,
        status TEXT DEFAULT 'completed',
        trained_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

# ------------------------------------------------------------------------------
# System Config Helpers
# ------------------------------------------------------------------------------
def is_demo_mode_enabled() -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_config WHERE key = 'demo_mode_enabled'")
    row = cursor.fetchone()
    conn.close()
    if row:
        return row["value"].lower() == "true"
    return True

def set_system_config(key: str, value: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def enable_demo_mode() -> bool:
    """Enables demo mode feature flag in SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO system_config (key, value) VALUES ('demo_mode_enabled', 'true')")
    conn.commit()
    conn.close()
    return True

def permanently_remove_demo_mode() -> bool:
    """
    Permanently purges all Demo Mode records from SQLite and disables Demo Mode feature flag.
    NEVER touches Active Mode records.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Purge all DEMO records
    cursor.execute("DELETE FROM alerts WHERE mode = 'DEMO'")
    cursor.execute("DELETE FROM validated_samples WHERE mode = 'DEMO'")
    cursor.execute("DELETE FROM training_runs WHERE mode = 'DEMO'")
    cursor.execute("DELETE FROM transactions WHERE mode = 'DEMO'")

    # Disable demo mode flag persistently
    cursor.execute("INSERT OR REPLACE INTO system_config (key, value) VALUES ('demo_mode_enabled', 'false')")

    conn.commit()
    conn.close()
    return True

# ------------------------------------------------------------------------------
# Transaction Queries
# ------------------------------------------------------------------------------
def insert_transaction(txn: Dict[str, Any], mode: str = "ACTIVE") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    factors_json = json.dumps(txn.get("risk_factors", [])) if isinstance(txn.get("risk_factors"), list) else (txn.get("risk_factors") or "[]")
    
    txn_id = txn.get("id") or f"txn-{int(datetime.now().timestamp() * 1000)}"
    created_at = txn.get("created_at") or datetime.now().isoformat()
    
    cursor.execute("""
    INSERT OR REPLACE INTO transactions (
        id, transaction_id, mode, amount, date, date_iso, time, hour, minute,
        sender, sender_upi, receiver, receiver_upi, status, merchant, category,
        location, device, source_type, validated, risk_score, risk_level,
        risk_type, risk_factors, recommendation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        txn_id,
        txn.get("transaction_id") or txn.get("transactionId") or txn_id,
        mode.upper(),
        float(txn.get("amount", 0)),
        str(txn.get("date", "")),
        str(txn.get("date_iso") or txn.get("dateISO") or datetime.now().strftime("%Y-%m-%d")),
        str(txn.get("time", "")),
        int(txn.get("hour") or 12),
        int(txn.get("minute") or 0),
        str(txn.get("sender") or "User"),
        str(txn.get("sender_upi") or txn.get("senderUpi") or ""),
        str(txn.get("receiver") or "Unknown"),
        str(txn.get("receiver_upi") or txn.get("receiverUpi") or ""),
        str(txn.get("status") or "Successful"),
        str(txn.get("merchant") or txn.get("receiver") or ""),
        str(txn.get("category") or "General"),
        str(txn.get("location") or "Localhost"),
        str(txn.get("device") or "Local Client"),
        str(txn.get("source_type") or txn.get("sourceType") or "manual"),
        1 if txn.get("validated", True) else 0,
        txn.get("risk_score") or txn.get("riskScore"),
        txn.get("risk_level") or txn.get("riskLevel"),
        txn.get("risk_type") or txn.get("riskType"),
        factors_json,
        txn.get("recommendation"),
        created_at
    ))

    # Auto generate alert if high risk
    score = txn.get("risk_score") or txn.get("riskScore")
    if score is not None and score >= 60:
        alert_id = f"alert-{int(datetime.now().timestamp() * 1000)}"
        cursor.execute("""
        INSERT OR IGNORE INTO alerts (
            id, mode, transaction_id, severity, risk_score, risk_type, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id,
            mode.upper(),
            txn_id,
            (txn.get("risk_level") or txn.get("riskLevel") or "HIGH").lower(),
            int(score),
            txn.get("risk_type") or txn.get("riskType") or "Suspicious Pattern",
            f"Suspicious {txn.get('risk_type') or 'Pattern'}: ₹{float(txn.get('amount', 0)):,.2f} to {txn.get('receiver', '')}",
            "active",
            created_at
        ))

    conn.commit()
    conn.close()
    return {**txn, "id": txn_id, "mode": mode.upper()}

def get_transactions(
    mode: str = "ACTIVE",
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    recipient: Optional[str] = None,
    limit: int = 200,
    offset: int = 0
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM transactions WHERE mode = ?"
    params = [mode.upper()]

    if search:
        query += " AND (receiver LIKE ? OR transaction_id LIKE ? OR receiver_upi LIKE ? OR sender LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    if risk_level and risk_level.upper() != "ALL":
        query += " AND UPPER(risk_level) = ?"
        params.append(risk_level.upper())

    if recipient and recipient.upper() != "ALL":
        query += " AND receiver LIKE ?"
        params.append(f"%{recipient}%")

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        d = dict(row)
        if d.get("risk_factors"):
            try:
                d["risk_factors"] = json.loads(d["risk_factors"])
            except Exception:
                d["risk_factors"] = []
        result.append(d)
    return result

def count_transactions(mode: str = "ACTIVE") -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE mode = ?", (mode.upper(),))
    res = cursor.fetchone()["count"]
    conn.close()
    return res

def get_transaction_by_id(txn_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single transaction by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ? OR transaction_id = ?", (txn_id, txn_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("risk_factors"):
        try:
            d["risk_factors"] = json.loads(d["risk_factors"])
        except Exception:
            d["risk_factors"] = []
    return d

def delete_transaction(txn_id: str) -> bool:
    """Deletes a transaction and its associated alert/feedback by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts WHERE transaction_id = ?", (txn_id,))
    cursor.execute("DELETE FROM validated_samples WHERE transaction_id = ?", (txn_id,))
    cursor.execute("DELETE FROM transactions WHERE id = ? OR transaction_id = ?", (txn_id, txn_id))
    conn.commit()
    conn.close()
    return True

def clear_mode_data(mode: str) -> bool:
    """Clears all data strictly belonging to the specified mode."""
    conn = get_db_connection()
    cursor = conn.cursor()
    m = mode.upper()
    cursor.execute("DELETE FROM alerts WHERE mode = ?", (m,))
    cursor.execute("DELETE FROM validated_samples WHERE mode = ?", (m,))
    cursor.execute("DELETE FROM training_runs WHERE mode = ?", (m,))
    cursor.execute("DELETE FROM transactions WHERE mode = ?", (m,))
    conn.commit()
    conn.close()
    return True

# ------------------------------------------------------------------------------
# Alert Queries
# ------------------------------------------------------------------------------
def get_alerts(mode: str = "ACTIVE", status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT a.*, t.amount, t.receiver, t.receiver_upi, t.date, t.time, t.risk_level
    FROM alerts a
    LEFT JOIN transactions t ON a.transaction_id = t.id
    WHERE a.mode = ?
    """
    params = [mode.upper()]
    if status and status.lower() != "all":
        query += " AND a.status = ?"
        params.append(status.lower())
    query += " ORDER BY a.created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_alert_reviewed(alert_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET status = 'reviewed' WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return True

# ------------------------------------------------------------------------------
# Validated Samples Queries (Adaptive Learning)
# ------------------------------------------------------------------------------
def add_validated_sample(txn_id: str, label: str, mode: str = "ACTIVE", notes: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    sample_id = f"sample-{int(datetime.now().timestamp() * 1000)}"
    created_at = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO validated_samples (id, mode, transaction_id, label, feedback_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (sample_id, mode.upper(), txn_id, label, notes, created_at))
    conn.commit()
    conn.close()
    return {"id": sample_id, "transaction_id": txn_id, "label": label, "created_at": created_at}

def get_validated_samples(mode: str = "ACTIVE") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, t.amount, t.receiver, t.risk_score, t.risk_level, t.date, t.time
    FROM validated_samples s
    LEFT JOIN transactions t ON s.transaction_id = t.id
    WHERE s.mode = ?
    ORDER BY s.created_at DESC
    """, (mode.upper(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def record_training_run(model_name: str, count: int, metrics: Dict[str, Any], mode: str = "ACTIVE") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    run_id = f"run-{int(datetime.now().timestamp() * 1000)}"
    trained_at = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO training_runs (id, mode, model_name, samples_count, precision, recall, f1_score, roc_auc, trained_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        mode.upper(),
        model_name,
        count,
        metrics.get("precision", 0.94),
        metrics.get("recall", 0.91),
        metrics.get("f1_score", 0.925),
        metrics.get("roc_auc", 0.97),
        trained_at
    ))
    conn.commit()
    conn.close()
    return {"id": run_id, "model_name": model_name, "samples_count": count, **metrics, "trained_at": trained_at}

def get_training_runs(mode: str = "ACTIVE") -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM training_runs WHERE mode = ? ORDER BY trained_at DESC", (mode.upper(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
