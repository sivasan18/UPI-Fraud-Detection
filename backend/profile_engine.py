# ==============================================================================
# Fraud Detection and Risk Assessment System
# User Behaviour Profiling & Baseline Statistics Engine
# ==============================================================================
from typing import Dict, Any, List
import statistics
from collections import Counter
from datetime import datetime
from database import get_db_connection

def build_behaviour_profile(mode: str = "ACTIVE") -> Dict[str, Any]:
    """
    Computes real statistical baseline profile from SQLite transactions.
    Returns 0/empty profile if no transactions exist in the given mode.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT amount, receiver, receiver_upi, hour, time, date, date_iso, created_at
    FROM transactions
    WHERE mode = ? AND validated = 1
    ORDER BY created_at ASC
    """, (mode.upper(),))
    rows = cursor.fetchall()
    conn.close()

    total_count = len(rows)

    if total_count == 0:
        return {
            "mode": mode.upper(),
            "totalCount": 0,
            "validatedCount": 0,
            "profileReady": False,
            "progressPercent": 0,
            "status": "Not Ready",
            "message": "Recommended minimum history: 100 validated transactions for baseline profile creation.",
            "avgAmount": 0,
            "medianAmount": 0,
            "maxAmount": 0,
            "minAmount": 0,
            "stdDev": 0,
            "hourlyDistribution": [{"hour": f"{h:02d}:00", "count": 0} for h in range(24)],
            "weeklyFrequency": [],
            "frequentRecipients": [],
            "topRecipientsData": [],
            "typicalTimeRange": "None",
            "dailyAvgCount": 0
        }

    amounts = [float(r["amount"]) for r in rows]
    recipients = [str(r["receiver"]) for r in rows if r["receiver"]]
    hours = [int(r["hour"]) if r["hour"] is not None else 12 for r in rows]

    avg_amt = statistics.mean(amounts) if amounts else 0
    med_amt = statistics.median(amounts) if amounts else 0
    max_amt = max(amounts) if amounts else 0
    min_amt = min(amounts) if amounts else 0
    std_amt = statistics.stdev(amounts) if len(amounts) > 1 else (avg_amt * 0.4)

    # Hourly distribution
    hour_counts = Counter(hours)
    hourly_dist = [{"hour": f"{h:02d}:00", "count": hour_counts.get(h, 0)} for h in range(24)]

    # Most active hours
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
    if peak_hours:
        typical_time = f"{peak_hours[0][0]:02d}:00 – {(peak_hours[0][0]+4)%24:02d}:00"
    else:
        typical_time = "10:00 AM – 8:00 PM"

    # Recipient distribution
    recv_counts = Counter(recipients)
    frequent_recipients = [name for name, count in recv_counts.most_common(10)]
    top_recipients_data = [
        {"name": name, "count": count, "percent": round((count / total_count) * 100, 1)}
        for name, count in recv_counts.most_common(6)
    ]

    # Weekly trends grouping
    date_counts = Counter([r["date"] for r in rows])
    weekly_frequency = [
        {"week": date, "count": count}
        for date, count in list(date_counts.items())[-8:]
    ]

    profile_ready = total_count >= 100
    progress_percent = min(100, int((total_count / 100.0) * 100))

    return {
        "mode": mode.upper(),
        "totalCount": total_count,
        "validatedCount": total_count,
        "profileReady": profile_ready,
        "progressPercent": progress_percent,
        "status": "Profile Ready" if profile_ready else "Profile Incomplete",
        "message": (
            "Minimum 100 validated historical transactions achieved. Baseline profile active."
            if profile_ready else
            f"Recommended minimum history: 100 validated transactions ({total_count}/100 recorded)."
        ),
        "avgAmount": round(avg_amt, 2),
        "medianAmount": round(med_amt, 2),
        "maxAmount": round(max_amt, 2),
        "minAmount": round(min_amt, 2),
        "stdDev": round(std_amt, 2),
        "hourlyDistribution": hourly_dist,
        "weeklyFrequency": weekly_frequency,
        "frequentRecipients": frequent_recipients,
        "topRecipientsData": top_recipients_data,
        "typicalTimeRange": typical_time,
        "dailyAvgCount": round(total_count / max(1, len(date_counts)), 1)
    }
