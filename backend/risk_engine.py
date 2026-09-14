# ==============================================================================
# Fraud Detection and Risk Assessment System
# Explainable AI (XAI) — 13-Pattern Behavioral Risk Engine
# ==============================================================================
import re
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
    "P13": "Small Initial Payment + Unexpected AutoPay/Recurring Debit",
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
    using 13 configurable fraud/suspicion patterns (P1-P13).
    Returns complete breakdown of detected and non-detected patterns.
    """
    amount = float(transaction.get("amount", 0))
    receiver = str(transaction.get("receiver") or transaction.get("merchant") or "").strip()
    receiver_upi = str(
        transaction.get("receiver_upi") or transaction.get("receiverUpi") or ""
    ).strip().lower()
    time_str = str(transaction.get("time", "12:00 PM"))
    device = str(transaction.get("device") or "")
    location = str(transaction.get("location") or "")

    # Contextual mandate & text fields
    remarks = str(transaction.get("remarks") or transaction.get("notes") or "")
    payment_mode = str(transaction.get("payment_mode") or transaction.get("paymentMode") or "")
    category = str(transaction.get("category") or "")
    autopay_mandate = str(transaction.get("autopay_mandate") or transaction.get("autopayMandate") or "")
    expected_recurring = float(transaction.get("expected_recurring_amount") or transaction.get("expectedRecurringAmount") or 0)

    hour = _parse_hour(time_str, transaction.get("hour"))
    recent = recent_transactions or []

    factors: List[Dict[str, Any]] = []
    detected_patterns: List[str] = []
    pattern_status: Dict[str, Dict[str, Any]] = {}

    # Initialize all 13 patterns as not detected with default baseline explanation
    for pid, pname in PATTERN_DESCRIPTIONS.items():
        pattern_status[pid] = {
            "id": pid,
            "name": f"Pattern {pid[1:]} — {pname}",
            "detected": False,
            "status": "Not Detected",
            "reason": f"No anomalous behavior matching {pname} was observed."
        }

    # Combined text for keyword scanning (used in P13)
    text_corpus = f"{remarks} {payment_mode} {category} {autopay_mandate} {receiver}".lower()
    autopay_keywords = ["autopay", "mandate", "recurring", "subscription", "e-mandate", "standing instruction", "auto-debit", "auto debit", "si "]
    has_autopay_evidence = any(kw in text_corpus for kw in autopay_keywords) or bool(autopay_mandate and autopay_mandate.lower() not in ["none", "no", "false", "0"])

    # Extract recurring amount from text if not explicitly provided
    if not expected_recurring:
        amt_match = re.search(r'(?:₹|rs\.?|inr)?\s*([1-9]\d{1,4})\s*(?:/|\s*(?:per|mo|month|recur|debit))?', text_corpus)
        if amt_match:
            try:
                val = float(amt_match.group(1))
                if val >= 99 and val != amount:
                    expected_recurring = val
            except Exception:
                pass

    # --------------------------------------------------------------------------
    # P13 Evaluation — Small Initial Payment + Unexpected AutoPay/Recurring Debit
    # --------------------------------------------------------------------------
    p13_detected = False
    p13_reason = ""
    p13_contrib = 0

    # Indicator A: Small initial payment (e.g. ₹1 or <= ₹10) with AutoPay / Mandate evidence or recurring amount
    if amount <= 10.0 and amount > 0:
        if has_autopay_evidence or expected_recurring > 0:
            p13_detected = True
            p13_contrib = 30
            p13_reason = (
                f"Small initial payment of ₹{amount:,.2f} is accompanied by an unexpected AutoPay/recurring mandate "
                f"({f'₹{expected_recurring:,.2f}' if expected_recurring else 'subsequent recurring debit'}). "
                "Deceptive subscription/mandate establishment pattern detected."
            )
        else:
            # Check history: did this small payment lead to a larger subsequent debit to the same receiver?
            subsequent_large = [
                t for t in recent
                if str(t.get("receiver", "")).lower() == receiver.lower()
                and float(t.get("amount", 0)) >= 100.0
            ]
            if subsequent_large:
                p13_detected = True
                p13_contrib = 30
                first_sub = subsequent_large[0]
                p13_reason = (
                    f"Small initial payment (₹{amount:,.2f}) to '{receiver}' is linked to a subsequent larger debit "
                    f"of ₹{float(first_sub.get('amount', 0)):,.2f}. Deceptive trial-to-recurring debit relationship detected."
                )
            else:
                # SAFEGUARD: Do NOT classify every ₹1 transaction as fraud alone!
                pattern_status["P13"]["status"] = "Not Detected / Insufficient Data"
                pattern_status["P13"]["reason"] = (
                    f"Small amount (₹{amount:,.2f}) observed, but no AutoPay mandate, recurring subscription, "
                    "or subsequent larger debit evidence was found. Marked as Not Detected / Insufficient Data."
                )
    elif amount >= 100.0:
        # Indicator B: Current transaction is a larger debit (e.g. ₹399/₹599) following an earlier small ₹1 token
        earlier_small = [
            t for t in recent
            if str(t.get("receiver", "")).lower() == receiver.lower()
            and 0 < float(t.get("amount", 0)) <= 10.0
        ]
        if earlier_small:
            p13_detected = True
            p13_contrib = 28
            p13_reason = (
                f"Subsequent debit of ₹{amount:,.2f} to '{receiver}' follows an earlier small verification payment "
                f"of ₹{float(earlier_small[0].get('amount', 0)):,.2f}. Deceptive AutoPay activation pattern."
            )
        elif has_autopay_evidence and amount in [199, 299, 399, 499, 599, 799, 999]:
            p13_detected = True
            p13_contrib = 24
            p13_reason = (
                f"Recurring mandate debit of ₹{amount:,.2f} flagged under AutoPay subscription. "
                "Verify this matches an explicitly approved ongoing mandate."
            )
        else:
            pattern_status["P13"]["reason"] = "Transaction does not exhibit deceptive initial trial or unexpected recurring debit relationship."
    else:
        pattern_status["P13"]["reason"] = "No AutoPay/mandate setup or recurring debit relationship found."

    if p13_detected:
        factors.append({
            "name": "Deceptive AutoPay/Mandate Debit (P13)",
            "contribution": p13_contrib,
            "pattern": "P13",
            "description": p13_reason
        })
        detected_patterns.append("P13")
        pattern_status["P13"]["detected"] = True
        pattern_status["P13"]["status"] = "Detected"
        pattern_status["P13"]["reason"] = p13_reason

    # --------------------------------------------------------------------------
    # Cold Start Evaluation (no verified user profile history)
    # --------------------------------------------------------------------------
    if not profile or profile.get("totalCount", 0) == 0:
        if amount > 20000:
            factors.append({
                "name": "High Value Transaction (Unprofiled)",
                "contribution": 35,
                "pattern": "P4",
                "description": f"₹{amount:,.2f} is an elevated amount with no established spending baseline."
            })
            detected_patterns.append("P4")
            pattern_status["P4"]["detected"] = True
            pattern_status["P4"]["status"] = "Detected"
            pattern_status["P4"]["reason"] = f"₹{amount:,.2f} exceeds cold-start baseline threshold."
        else:
            factors.append({
                "name": "Baseline Verification",
                "contribution": 10,
                "pattern": "--",
                "description": "Transaction evaluated under initial cold-start parameters (no history yet)."
            })
            pattern_status["P4"]["reason"] = f"₹{amount:,.2f} is within safe cold-start bounds."

        if hour < 5 or hour >= 23:
            factors.append({
                "name": "Late Night Activity",
                "contribution": 20,
                "pattern": "P8",
                "description": f"Transaction initiated at {time_str} — outside normal active daytime hours."
            })
            detected_patterns.append("P8")
            pattern_status["P8"]["detected"] = True
            pattern_status["P8"]["status"] = "Detected"
            pattern_status["P8"]["reason"] = f"Transaction initiated at {time_str} (outside 5 AM – 11 PM)."
        else:
            pattern_status["P8"]["reason"] = f"Transaction at {time_str} is within normal active daytime hours."

        raw_score = sum(f["contribution"] for f in factors)
        score = max(5, min(95, raw_score))
        risk_info = get_risk_level(score)
        return _build_result(score, risk_info, detected_patterns, factors, "Cold Start (No Profile)", pattern_status)

    # --------------------------------------------------------------------------
    # Profile Parameters & Established Baseline
    # --------------------------------------------------------------------------
    avg_amt = float(profile.get("avgAmount", 1500))
    max_amt = float(profile.get("maxAmount", 10000))
    std_dev = float(profile.get("stdDev", avg_amt * 0.5 or 500))
    known_recipients = [r.lower() for r in profile.get("frequentRecipients", [])]

    is_known = bool(receiver) and any(
        receiver.lower() in k or k in receiver.lower() for k in known_recipients
    )

    # P4 -- Amount Outside Historical Range
    if amount > max_amt * 1.8 or (std_dev > 0 and amount > avg_amt + 3.5 * std_dev):
        desc = (
            f"₹{amount:,.2f} is {amount/(avg_amt or 1):.1f}x your average "
            f"(₹{avg_amt:,.2f}) and exceeds your highest recorded amount."
        )
        factors.append({
            "name": "Severe Amount Deviation (P4)",
            "contribution": 28,
            "pattern": "P4",
            "description": desc
        })
        detected_patterns.append("P4")
        pattern_status["P4"]["detected"] = True
        pattern_status["P4"]["status"] = "Detected"
        pattern_status["P4"]["reason"] = desc
    elif std_dev > 0 and amount > avg_amt + 2 * std_dev:
        desc = f"₹{amount:,.2f} noticeably exceeds typical spending variance (avg ₹{avg_amt:,.2f})."
        factors.append({
            "name": "Elevated Transaction Amount (P4)",
            "contribution": 15,
            "pattern": "P4",
            "description": desc
        })
        detected_patterns.append("P4")
        pattern_status["P4"]["detected"] = True
        pattern_status["P4"]["status"] = "Detected"
        pattern_status["P4"]["reason"] = desc
    else:
        pattern_status["P4"]["reason"] = f"₹{amount:,.2f} is consistent with user historical average (₹{avg_amt:,.2f})."
        factors.append({
            "name": "Normal Amount Range",
            "contribution": 2,
            "pattern": "--",
            "description": f"₹{amount:,.2f} is consistent with typical range (avg ₹{avg_amt:,.2f})."
        })

    # P1 -- Repeated Same-Amount Transactions (Rapid)
    if recent:
        same_amount_count = sum(
            1 for t in recent[:10] if abs(float(t.get("amount", -1)) - amount) < 1.0
        )
        if same_amount_count >= 2:
            contrib = min(25, 10 + same_amount_count * 5)
            desc = (
                f"₹{amount:,.2f} was sent {same_amount_count + 1} times in quick succession. "
                "Repeated identical amounts are a common indicator of automated fraud."
            )
            factors.append({
                "name": f"Repeated Same-Amount Burst (P1) x{same_amount_count + 1}",
                "contribution": contrib,
                "pattern": "P1",
                "description": desc
            })
            detected_patterns.append("P1")
            pattern_status["P1"]["detected"] = True
            pattern_status["P1"]["status"] = "Detected"
            pattern_status["P1"]["reason"] = desc
        else:
            pattern_status["P1"]["reason"] = "No repeated identical amount burst found in recent transactions."
    else:
        pattern_status["P1"]["reason"] = "No recent transactions found for identical-amount comparison."

    # P2 -- Doubling/Multiplying Amount to Same Recipient
    if recent and receiver:
        same_recv_amounts = sorted(
            [float(t.get("amount", 0)) for t in recent[:8] if str(t.get("receiver", "")).lower() == receiver.lower()],
            reverse=True
        )
        if len(same_recv_amounts) >= 2:
            prev = same_recv_amounts[0]
            if prev > 0 and 1.7 <= (amount / prev) <= 2.5:
                desc = (
                    f"Amount to '{receiver}' roughly doubled: ₹{prev:,.2f} to ₹{amount:,.2f}. "
                    "Escalating amounts are a known fraud indicator."
                )
                factors.append({
                    "name": "Doubling Amount Pattern (P2)",
                    "contribution": 22,
                    "pattern": "P2",
                    "description": desc
                })
                detected_patterns.append("P2")
                pattern_status["P2"]["detected"] = True
                pattern_status["P2"]["status"] = "Detected"
                pattern_status["P2"]["reason"] = desc
            else:
                pattern_status["P2"]["reason"] = f"No doubling/multiplying escalation ratio observed to '{receiver}'."
        else:
            pattern_status["P2"]["reason"] = f"Insufficient repeat transactions to '{receiver}' to establish a multiplier pattern."
    else:
        pattern_status["P2"]["reason"] = "No repeat recipient history found for escalation analysis."

    # P3 -- Transaction Frequency Burst
    if recent:
        burst_count = len(recent[:15])
        daily_avg = float(profile.get("dailyAvgCount", 3))
        if burst_count >= max(5, daily_avg * 2.5):
            desc = (
                f"Detected {burst_count} recent transactions vs. daily average of {daily_avg:.0f}. "
                "A sudden burst may indicate account compromise."
            )
            factors.append({
                "name": f"High Frequency Burst (P3) — {burst_count} recent txns",
                "contribution": 20,
                "pattern": "P3",
                "description": desc
            })
            detected_patterns.append("P3")
            pattern_status["P3"]["detected"] = True
            pattern_status["P3"]["status"] = "Detected"
            pattern_status["P3"]["reason"] = desc
        else:
            pattern_status["P3"]["reason"] = f"Transaction frequency ({burst_count} in window) is within normal limits."
    else:
        pattern_status["P3"]["reason"] = "No rapid velocity burst detected."

    # P5 -- New Recipient + Unusual High Amount
    if not is_known and receiver and amount > avg_amt * 1.5:
        desc = (
            f"'{receiver}' is a first-time recipient and ₹{amount:,.2f} "
            f"is {amount/avg_amt:.1f}x your average — high combined risk."
        )
        factors.append({
            "name": "New Recipient + High Amount (P5)",
            "contribution": 25,
            "pattern": "P5",
            "description": desc
        })
        detected_patterns.append("P5")
        pattern_status["P5"]["detected"] = True
        pattern_status["P5"]["status"] = "Detected"
        pattern_status["P5"]["reason"] = desc
    elif not is_known and receiver:
        factors.append({
            "name": "New / First-Time Recipient",
            "contribution": 18,
            "pattern": "--",
            "description": f"'{receiver}' has never appeared in your verified transaction history."
        })
        pattern_status["P5"]["reason"] = f"'{receiver}' is new, but the amount (₹{amount:,.2f}) is not unusually elevated."
    else:
        pattern_status["P5"]["reason"] = f"'{receiver}' is a known, previously verified recipient."
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
            desc = (
                f"'{receiver}' is a new contact with {rapid_same_recv + 1} rapid consecutive "
                "transactions — strong indicator of social-engineering fraud."
            )
            factors.append({
                "name": f"New Recipient + Rapid Repeat (P6) x{rapid_same_recv + 1}",
                "contribution": 22,
                "pattern": "P6",
                "description": desc
            })
            detected_patterns.append("P6")
            pattern_status["P6"]["detected"] = True
            pattern_status["P6"]["status"] = "Detected"
            pattern_status["P6"]["reason"] = desc
        else:
            pattern_status["P6"]["reason"] = "No rapid repeated attempts to a new recipient detected."
    elif recent:
        same_recv_count = sum(
            1 for t in recent[:5] if str(t.get("receiver", "")).lower() == receiver.lower()
        )
        if same_recv_count >= 2 and "P6" not in detected_patterns:
            desc = f"Detected {same_recv_count + 1} transactions to '{receiver}' in a short window."
            factors.append({
                "name": f"Rapid Repeated Transaction (P6) x{same_recv_count + 1}",
                "contribution": 18,
                "pattern": "P6",
                "description": desc
            })
            detected_patterns.append("P6")
            pattern_status["P6"]["detected"] = True
            pattern_status["P6"]["status"] = "Detected"
            pattern_status["P6"]["reason"] = desc
        else:
            pattern_status["P6"]["reason"] = "No rapid repeated transactions observed."
    else:
        pattern_status["P6"]["reason"] = "No multiple rapid transactions to new recipient found."

    # P7 -- Multiple Different Recipients in Short Period
    if recent:
        unique_recent_receivers = set(
            str(t.get("receiver", "")).lower() for t in recent[:8] if t.get("receiver")
        )
        if len(unique_recent_receivers) >= 4:
            desc = (
                f"Payments to {len(unique_recent_receivers)} different recipients in a short period. "
                "Scatter pattern may indicate account takeover."
            )
            factors.append({
                "name": f"Multiple Recipients Burst (P7) — {len(unique_recent_receivers)} different",
                "contribution": 18,
                "pattern": "P7",
                "description": desc
            })
            detected_patterns.append("P7")
            pattern_status["P7"]["detected"] = True
            pattern_status["P7"]["status"] = "Detected"
            pattern_status["P7"]["reason"] = desc
        else:
            pattern_status["P7"]["reason"] = f"Recipients count ({len(unique_recent_receivers)}) in window is within normal scatter threshold."
    else:
        pattern_status["P7"]["reason"] = "No scattered multi-recipient activity detected."

    # P8 -- Unusual Time of Day
    if hour < 5 or hour >= 23:
        desc = f"Transaction at {time_str} is outside normal active hours (5 AM to 11 PM)."
        factors.append({
            "name": "Late Night / Very Early Morning (P8)",
            "contribution": 18,
            "pattern": "P8",
            "description": desc
        })
        detected_patterns.append("P8")
        pattern_status["P8"]["detected"] = True
        pattern_status["P8"]["status"] = "Detected"
        pattern_status["P8"]["reason"] = desc
    elif hour < 7:
        desc = f"Transaction at {time_str} is in an infrequent usage period (5-7 AM)."
        factors.append({
            "name": "Early Morning Activity (P8)",
            "contribution": 8,
            "pattern": "P8",
            "description": desc
        })
        pattern_status["P8"]["reason"] = desc
    else:
        pattern_status["P8"]["reason"] = f"Transaction at {time_str} is within standard active hours."

    # P9 -- Round/Structured Amount to Unknown Recipient
    round_values = {1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000}
    if amount in round_values and not is_known:
        desc = (
            f"Exact round amount ₹{amount:,.0f} sent to an unverified recipient. "
            "Common in structuring or test-fraud."
        )
        factors.append({
            "name": "Structured Round Amount to Unknown Recipient (P9)",
            "contribution": 12,
            "pattern": "P9",
            "description": desc
        })
        detected_patterns.append("P9")
        pattern_status["P9"]["detected"] = True
        pattern_status["P9"]["status"] = "Detected"
        pattern_status["P9"]["reason"] = desc
    else:
        pattern_status["P9"]["reason"] = "Amount is not a suspicious structured round figure to an unknown counterparty."

    # P10 -- Device Anomaly
    if device and "new device" in device.lower():
        desc = f"Transaction from '{device}' — device not previously seen in your profile."
        factors.append({
            "name": "Unrecognized Device (P10)",
            "contribution": 12,
            "pattern": "P10",
            "description": desc
        })
        detected_patterns.append("P10")
        pattern_status["P10"]["detected"] = True
        pattern_status["P10"]["status"] = "Detected"
        pattern_status["P10"]["reason"] = desc
    else:
        pattern_status["P10"]["reason"] = f"Device '{device or 'Standard Client'}' matches verified usage environment."

    # P11 -- Geographic/Location Anomaly
    if location and ("unknown" in location.lower() or "new location" in location.lower()):
        desc = f"Location '{location}' is unusual compared to your verified geography."
        factors.append({
            "name": "Location Anomaly (P11)",
            "contribution": 10,
            "pattern": "P11",
            "description": desc
        })
        detected_patterns.append("P11")
        pattern_status["P11"]["detected"] = True
        pattern_status["P11"]["status"] = "Detected"
        pattern_status["P11"]["reason"] = desc
    else:
        pattern_status["P11"]["reason"] = f"Location '{location or 'Localhost'}' is consistent with established geography."

    # P12 -- Sudden Large-Value Spike vs. Recent Average
    if recent and len(recent) >= 3:
        recent_amounts = [float(t.get("amount", 0)) for t in recent[:5] if float(t.get("amount", 0)) > 0]
        if recent_amounts:
            recent_avg = sum(recent_amounts) / len(recent_amounts)
            if recent_avg > 0 and amount > recent_avg * 3:
                desc = (
                    f"₹{amount:,.2f} is {amount/recent_avg:.1f}x your recent session average "
                    f"(₹{recent_avg:,.2f}). Sudden escalation is a key fraud signal."
                )
                factors.append({
                    "name": f"Sudden Value Spike (P12) — {amount/recent_avg:.1f}x recent avg",
                    "contribution": 20,
                    "pattern": "P12",
                    "description": desc
                })
                detected_patterns.append("P12")
                pattern_status["P12"]["detected"] = True
                pattern_status["P12"]["status"] = "Detected"
                pattern_status["P12"]["reason"] = desc
            else:
                pattern_status["P12"]["reason"] = f"Amount is within normal range of recent session average (₹{recent_avg:,.2f})."
        else:
            pattern_status["P12"]["reason"] = "No recent non-zero amounts found for spike comparison."
    else:
        pattern_status["P12"]["reason"] = "Insufficient recent transactions to calculate a short-term spike."

    # Aggregate Risk Score
    raw_score = sum(f["contribution"] for f in factors)
    score = min(100, max(0, int(raw_score)))
    risk_info = get_risk_level(score)

    return _build_result(score, risk_info, detected_patterns, factors, profile.get("status", "Active"), pattern_status)


def _build_result(
    score: int,
    risk_info: Dict[str, Any],
    detected_patterns: List[str],
    factors: List[Dict[str, Any]],
    profile_status: str,
    pattern_status: Dict[str, Dict[str, Any]]
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

    detected_details = [
        {
            "id": pid,
            "name": f"Pattern {pid[1:]} — {PATTERN_DESCRIPTIONS.get(pid, pid)}",
            "description": pattern_status[pid]["reason"],
            "contribution": next((f["contribution"] for f in factors if f.get("pattern") == pid), 20)
        }
        for pid in detected_patterns if pid in pattern_status
    ]

    not_detected_list = [
        pattern_status[pid]
        for pid in [f"P{i}" for i in range(1, 14)]
        if pid in pattern_status and not pattern_status[pid]["detected"]
    ]

    all_patterns_list = [
        pattern_status[pid]
        for pid in [f"P{i}" for i in range(1, 14)]
        if pid in pattern_status
    ]

    return {
        "score": score,
        "level": risk_info["level"],
        "type": risk_type,
        "detected_patterns": enriched_patterns if enriched_patterns else ["No anomalies detected"],
        "pattern_ids": detected_patterns,
        "detected_patterns_details": detected_details,
        "not_detected_patterns": not_detected_list,
        "all_patterns_checked": all_patterns_list,
        "factors": factors,
        "profile_status": profile_status,
        "why": [f["description"] for f in factors if f.get("contribution", 0) > 0],
        "recommendation": generate_recommendation(score, factors, detected_patterns)
    }


def generate_recommendation(score: int, factors: List[Dict[str, Any]], detected_patterns: List[str] = None) -> str:
    detected_patterns = detected_patterns or []

    # Specific recommendation for Pattern 13 (AutoPay / Deceptive Mandate)
    if "P13" in detected_patterns:
        return (
            "CRITICAL AUTOPAY ALERT: An unexpected recurring AutoPay or subscription mandate was detected. "
            "Open your UPI application (Google Pay / PhonePe / BHIM), navigate to 'AutoPay / Mandates' in settings, "
            "and immediately revoke or cancel any unrecognized mandate before the scheduled debit date."
        )

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
            "If you did not initiate this transaction, do NOT share your UPI PIN or OTP — "
            "contact your bank through an official channel immediately."
        )
    else:
        return (
            "CRITICAL: Multiple severe fraud signals detected. Do NOT approve or continue. "
            "Independently verify this transaction and report to your bank's official fraud helpline immediately."
        )
