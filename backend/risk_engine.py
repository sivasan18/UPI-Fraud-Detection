# ==============================================================================
# Fraud Detection and Risk Assessment System
# Explainable AI (XAI) — 12-Pattern Behavioral Risk Engine
# ==============================================================================
from typing import Dict, Any, List, Optional
from datetime import datetime

RISK_THRESHOLDS = {
    "LOW": (0, 29),
    "MEDIUM": (30, 59),
    "HIGH": (60, 79),
    "CRITICAL": (80, 100),
}

PATTERN_DESCRIPTIONS = {
    "P1":  "Repeated Same-Amount Transactions (Rapid)",
    "P2":  "Doubling/Multiplying Amount to Same Recipient",
    "P3":  "Unusual Transaction Frequency Burst",
    "P4":  "Amount Outside Historical Range",
    "P5":  "New Recipient + Unusual High Amount",
    "P6":  "New Recipient + Multiple Rapid Transactions",
    "P7":  "Multiple Different Recipients in Short Period",
    "P8":  "Unusual Time of Day / Late Night",
    "P9":  "Round / Structured Amount to New Recipient",
    "P10": "Device Anomaly (Unrecognized Device)",
    "P11": "Geographic / Location Anomaly",
    "P12": "Rapid Large-Value Transaction Spike",
}


def get_risk_level(score: int) -> Dict[str, Any]:
    s = max(0, min(100, int(score)))
    if s < 30:
        return {"level": "LOW",      "label": "Low Risk",      "badge": "badge-low",      "color": "#10b981"}
    elif s < 60:
        return {"level": "MEDIUM",   "label": "Medium Risk",   "badge": "badge-medium",   "color": "#f59e0b"}
    elif s < 80:
        return {"level": "HIGH",     "label": "High Risk",     "badge": "badge-high",     "color": "#ef4444"}
    else:
        return {"level": "CRITICAL", "label": "Critical Risk", "badge": "badge-critical", "color": "#dc2626"}


def _parse_hour(time_str: str, hour_hint=None) -> int:
    if hour_hint is not None:
        return int(hour_hint)
    try:
        ts = str(time_str).strip()
        if "AM" in ts.upper() or "PM" in ts.upper():
            return datetime.strptime(ts, "%I:%M %p").hour
        return int(ts.split(":")[0])
    except Exception:
        return 12


def evaluate_transaction_risk(
    transaction: Dict[str, Any],
    profile: Optional[Dict[str, Any]] = None,
    recent_transactions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates a UPI transaction against the user's behavioral profile
    using 12 configurable fraud/suspicion patterns (P1-P12).
    """
    amount = float(transaction.get("amount", 0))
    receiver = str(transaction.get("receiver", "")).strip()
    receiver_upi = str(
        transaction.get("receiver_upi") or transaction.get("receiverUpi") or ""
    ).strip().lower()
    time_str = str(transaction.get("time", "12:00 PM"))
    device = str(transaction.get("device") or "")
    location = str(transaction.get("location") or "")

    hour = _parse_hour(time_str, transaction.get("hour"))
    recent = recent_transactions or []

    factors: List[Dict[str, Any]] = []
    detected_patterns: List[str] = []

    # COLD START
    if not profile or profile.get("totalCount", 0) == 0:
        if amount > 20000:
            factors.append({
                "name": "High Value Transaction (Unprofiled)",
                "contribution": 35,
                "pattern": "P4",
                "description": f"Rs.{amount:,.2f} is an elevated amount with no established spending baseline."
            })
            detected_patterns.append("P4")
        else:
            factors.append({
                "name": "Baseline Verification",
                "contribution": 10,
                "pattern": "--",
                "description": "Transaction evaluated under initial cold-start parameters (no history yet)."
            })

        if hour < 5 or hour >= 23:
            factors.append({
                "name": "Late Night Activity",
                "contribution": 20,
                "pattern": "P8",
                "description": f"Transaction initiated at {time_str} -- outside normal active hours."
            })
            detected_patterns.append("P8")

        raw_score = sum(f["contribution"] for f in factors)
        score = max(5, min(95, raw_score))
        risk_info = get_risk_level(score)
        return _build_result(score, risk_info, detected_patterns, factors, "Cold Start (No Profile)")

    # Profile parameters
    avg_amt = float(profile.get("avgAmount", 1500))
    max_amt = float(profile.get("maxAmount", 10000))
    std_dev = float(profile.get("stdDev", avg_amt * 0.5 or 500))
    known_recipients = [r.lower() for r in profile.get("frequentRecipients", [])]

    is_known = bool(receiver) and any(
        receiver.lower() in k or k in receiver.lower() for k in known_recipients
    )

    # P4 -- Amount Outside Historical Range
    if amount > max_amt * 1.8 or (std_dev > 0 and amount > avg_amt + 3.5 * std_dev):
        factors.append({
            "name": "Severe Amount Deviation (P4)",
            "contribution": 28,
            "pattern": "P4",
            "description": (
                f"Rs.{amount:,.2f} is {amount/(avg_amt or 1):.1f}x your average "
                f"(Rs.{avg_amt:,.2f}) and exceeds your highest recorded amount."
            )
        })
        detected_patterns.append("P4")
    elif std_dev > 0 and amount > avg_amt + 2 * std_dev:
        factors.append({
            "name": "Elevated Transaction Amount (P4)",
            "contribution": 15,
            "pattern": "P4",
            "description": f"Rs.{amount:,.2f} noticeably exceeds typical spending variance (avg Rs.{avg_amt:,.2f})."
        })
        detected_patterns.append("P4")
    else:
        factors.append({
            "name": "Normal Amount Range",
            "contribution": 2,
            "pattern": "--",
            "description": f"Rs.{amount:,.2f} is consistent with typical range (avg Rs.{avg_amt:,.2f})."
        })

    # P1 -- Repeated Same-Amount Transactions (Rapid)
    if recent:
        same_amount_count = sum(
            1 for t in recent[:10] if abs(float(t.get("amount", -1)) - amount) < 1.0
        )
        if same_amount_count >= 2:
            contrib = min(25, 10 + same_amount_count * 5)
            factors.append({
                "name": f"Repeated Same-Amount Burst (P1) x{same_amount_count + 1}",
                "contribution": contrib,
                "pattern": "P1",
                "description": (
                    f"Rs.{amount:,.2f} was sent {same_amount_count + 1} times in quick succession. "
                    "Repeated identical amounts are a common indicator of automated fraud."
                )
            })
            detected_patterns.append("P1")

    # P2 -- Doubling/Multiplying Amount to Same Recipient
    if recent and receiver:
        same_recv_amounts = sorted(
            [float(t.get("amount", 0)) for t in recent[:8] if str(t.get("receiver", "")).lower() == receiver.lower()],
            reverse=True
        )
        if len(same_recv_amounts) >= 2:
            prev = same_recv_amounts[0]
            if prev > 0 and 1.7 <= (amount / prev) <= 2.5:
                factors.append({
                    "name": "Doubling Amount Pattern (P2)",
                    "contribution": 22,
                    "pattern": "P2",
                    "description": (
                        f"Amount to '{receiver}' roughly doubled: Rs.{prev:,.2f} to Rs.{amount:,.2f}. "
                        "Escalating amounts are a known fraud indicator."
                    )
                })
                detected_patterns.append("P2")

    # P3 -- Transaction Frequency Burst
    if recent:
        burst_count = len(recent[:15])
        daily_avg = float(profile.get("dailyAvgCount", 3))
        if burst_count >= max(5, daily_avg * 2.5):
            factors.append({
                "name": f"High Frequency Burst (P3) -- {burst_count} recent txns",
                "contribution": 20,
                "pattern": "P3",
                "description": (
                    f"Detected {burst_count} recent transactions vs. daily average of {daily_avg:.0f}. "
                    "A sudden burst may indicate account compromise."
                )
            })
            detected_patterns.append("P3")

    # P5 -- New Recipient + Unusual High Amount
    if not is_known and receiver and amount > avg_amt * 1.5:
        factors.append({
            "name": "New Recipient + High Amount (P5)",
            "contribution": 25,
            "pattern": "P5",
            "description": (
                f"'{receiver}' is a first-time recipient and Rs.{amount:,.2f} "
                f"is {amount/avg_amt:.1f}x your average -- high combined risk."
            )
        })
        detected_patterns.append("P5")
    elif not is_known and receiver:
        factors.append({
            "name": "New / First-Time Recipient",
            "contribution": 18,
            "pattern": "--",
            "description": f"'{receiver}' has never appeared in your verified transaction history."
        })
    else:
        factors.append({
            "name": "Known Frequent Recipient",
            "contribution": 0,
            "pattern": "--",
            "description": f"'{receiver}' matches a verified frequent contact."
        })

    # P6 -- New Recipient + Multiple Rapid Transactions
    if not is_known and recent:
        rapid_same_recv = sum(
            1 for t in recent[:6] if str(t.get("receiver", "")).lower() == receiver.lower()
        )
        if rapid_same_recv >= 2:
            factors.append({
                "name": f"New Recipient + Rapid Repeat (P6) x{rapid_same_recv + 1}",
                "contribution": 22,
                "pattern": "P6",
                "description": (
                    f"'{receiver}' is a new contact with {rapid_same_recv + 1} rapid consecutive "
                    "transactions -- strong indicator of social-engineering fraud."
                )
            })
            detected_patterns.append("P6")
    elif recent:
        same_recv_count = sum(
            1 for t in recent[:5] if str(t.get("receiver", "")).lower() == receiver.lower()
        )
        if same_recv_count >= 2 and "P6" not in detected_patterns:
            factors.append({
                "name": f"Rapid Repeated Transaction (P6) x{same_recv_count + 1}",
                "contribution": 18,
                "pattern": "P6",
                "description": f"Detected {same_recv_count + 1} transactions to '{receiver}' in a short window."
            })
            detected_patterns.append("P6")

    # P7 -- Multiple Different Recipients in Short Period
    if recent:
        unique_recent_receivers = set(
            str(t.get("receiver", "")).lower() for t in recent[:8] if t.get("receiver")
        )
        if len(unique_recent_receivers) >= 4:
            factors.append({
                "name": f"Multiple Recipients Burst (P7) -- {len(unique_recent_receivers)} different",
                "contribution": 18,
                "pattern": "P7",
                "description": (
                    f"Payments to {len(unique_recent_receivers)} different recipients in a short period. "
                    "Scatter pattern may indicate account takeover."
                )
            })
            detected_patterns.append("P7")

    # P8 -- Unusual Time of Day
    if hour < 5 or hour >= 23:
        factors.append({
            "name": "Late Night / Very Early Morning (P8)",
            "contribution": 18,
            "pattern": "P8",
            "description": f"Transaction at {time_str} is outside normal active hours (5 AM to 11 PM)."
        })
        detected_patterns.append("P8")
    elif hour < 7:
        factors.append({
            "name": "Early Morning Activity (P8)",
            "contribution": 8,
            "pattern": "P8",
            "description": f"Transaction at {time_str} is in an infrequent usage period (5-7 AM)."
        })

    # P9 -- Round/Structured Amount to Unknown Recipient
    round_values = {1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000}
    if amount in round_values and not is_known:
        factors.append({
            "name": "Structured Round Amount to Unknown Recipient (P9)",
            "contribution": 12,
            "pattern": "P9",
            "description": (
                f"Exact round amount Rs.{amount:,.0f} sent to an unverified recipient. "
                "Common in structuring or test-fraud."
            )
        })
        detected_patterns.append("P9")

    # P10 -- Device Anomaly
    if device and "new device" in device.lower():
        factors.append({
            "name": "Unrecognized Device (P10)",
            "contribution": 12,
            "pattern": "P10",
            "description": f"Transaction from '{device}' -- device not previously seen in your profile."
        })
        detected_patterns.append("P10")

    # P11 -- Geographic/Location Anomaly
    if location and ("unknown" in location.lower() or "new location" in location.lower()):
        factors.append({
            "name": "Location Anomaly (P11)",
            "contribution": 10,
            "pattern": "P11",
            "description": f"Location '{location}' is unusual compared to your verified geography."
        })
        detected_patterns.append("P11")

    # P12 -- Sudden Large-Value Spike vs. Recent Average
    if recent and len(recent) >= 3:
        recent_amounts = [float(t.get("amount", 0)) for t in recent[:5] if float(t.get("amount", 0)) > 0]
        if recent_amounts:
            recent_avg = sum(recent_amounts) / len(recent_amounts)
            if recent_avg > 0 and amount > recent_avg * 3:
                factors.append({
                    "name": f"Sudden Value Spike (P12) -- {amount/recent_avg:.1f}x recent avg",
                    "contribution": 20,
                    "pattern": "P12",
                    "description": (
                        f"Rs.{amount:,.2f} is {amount/recent_avg:.1f}x your recent session average "
                        f"(Rs.{recent_avg:,.2f}). Sudden escalation is a key fraud signal."
                    )
                })
                detected_patterns.append("P12")

    # Aggregate
    raw_score = sum(f["contribution"] for f in factors)
    score = min(100, max(0, int(raw_score)))
    risk_info = get_risk_level(score)

    return _build_result(score, risk_info, detected_patterns, factors, profile.get("status", "Active"))


def _build_result(
    score: int,
    risk_info: Dict[str, Any],
    detected_patterns: List[str],
    factors: List[Dict[str, Any]],
    profile_status: str
) -> Dict[str, Any]:
    if score >= 80:
        risk_type = (
            "Combined High-Risk Pattern"
            if len(detected_patterns) > 1
            else (PATTERN_DESCRIPTIONS.get(detected_patterns[0], "Critical Anomaly") if detected_patterns else "Critical Anomaly")
        )
    elif score >= 60:
        risk_type = PATTERN_DESCRIPTIONS.get(detected_patterns[0], "High Anomaly Score") if detected_patterns else "High Anomaly Score"
    elif score >= 30:
        risk_type = PATTERN_DESCRIPTIONS.get(detected_patterns[0], "Moderate Variance") if detected_patterns else "Moderate Variance"
    else:
        risk_type = "Normal Transaction"

    enriched_patterns = [
        f"{pid}: {PATTERN_DESCRIPTIONS.get(pid, pid)}" for pid in detected_patterns
    ]

    return {
        "score": score,
        "level": risk_info["level"],
        "type": risk_type,
        "detected_patterns": enriched_patterns if enriched_patterns else ["No anomalies detected"],
        "pattern_ids": detected_patterns,
        "factors": factors,
        "profile_status": profile_status,
        "why": [f["description"] for f in factors if f.get("contribution", 0) > 0],
        "recommendation": generate_recommendation(score, factors)
    }


def generate_recommendation(score: int, factors: List[Dict[str, Any]]) -> str:
    if score < 30:
        return (
            "No significant suspicious indicators detected. "
            "Always confirm the recipient name before authorizing any payment."
        )
    elif score < 60:
        return (
            "Moderate behavioral variance detected. "
            "Verify the recipient identity and review the transaction details before completing the transfer."
        )
    elif score < 80:
        return (
            "High anomaly detected. Verify the recipient before proceeding. "
            "If you did not initiate this transaction, do NOT share your UPI PIN or OTP -- "
            "contact your bank through an official channel immediately."
        )
    else:
        return (
            "CRITICAL: Multiple severe fraud signals detected. Do NOT approve or continue. "
            "Independently verify this transaction and report to your bank's official fraud helpline immediately."
        )
