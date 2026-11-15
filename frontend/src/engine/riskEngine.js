// ==============================================================================
// Fraud Detection and Risk Assessment System
// Explainable AI (XAI) — 13-Pattern Behavioral Risk Engine (JavaScript Port)
// Matches 100% of Python risk_engine.py rules, scoring, and explanations.
// ==============================================================================

export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 29, label: 'LOW', color: '#facc15' },
  MEDIUM: { min: 30, max: 59, label: 'MEDIUM', color: '#facc15' },
  HIGH: { min: 60, max: 79, label: 'HIGH', color: '#facc15' },
  CRITICAL: { min: 80, max: 100, label: 'CRITICAL', color: '#facc15' },
};

export const PATTERN_DESCRIPTIONS = {
  P1: 'Repeated Same-Amount Transactions (Rapid)',
  P2: 'Doubling/Multiplying Amount to Same Recipient',
  P3: 'Unusual Transaction Frequency Burst',
  P4: 'Amount Outside Historical Range',
  P5: 'New Recipient + Unusual High Amount',
  P6: 'New Recipient + Multiple Rapid Transactions',
  P7: 'Multiple Different Recipients in Short Period',
  P8: 'Unusual Time of Day / Late Night',
  P9: 'Round / Structured Amount to New Recipient',
  P10: 'Device Anomaly (Unrecognized Device)',
  P11: 'Geographic / Location Anomaly',
  P12: 'Rapid Large-Value Transaction Spike',
  P13: 'Small Initial Payment + Unexpected AutoPay/Recurring Debit',
};

export function getRiskLevel(score) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (s < 30) {
    return { level: 'LOW', label: 'Low Risk', badge: 'badge-low', color: '#facc15' };
  } else if (s < 60) {
    return { level: 'MEDIUM', label: 'Medium Risk', badge: 'badge-medium', color: '#facc15' };
  } else if (s < 80) {
    return { level: 'HIGH', label: 'High Risk', badge: 'badge-high', color: '#facc15' };
  } else {
    return { level: 'CRITICAL', label: 'Critical Risk', badge: 'badge-critical', color: '#facc15' };
  }
}

export function getRiskColor(score) {
  return getRiskLevel(score).color;
}

function parseHour(timeStr, hourHint) {
  if (hourHint !== undefined && hourHint !== null && !isNaN(Number(hourHint))) {
    return parseInt(hourHint, 10);
  }
  try {
    const ts = String(timeStr || '').trim();
    if (!ts) return null;
    const isAm = ts.toUpperCase().includes('AM');
    const isPm = ts.toUpperCase().includes('PM');
    if (isAm || isPm) {
      const match = ts.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
        return h;
      }
    }
    const parts = ts.split(':');
    if (parts.length > 0 && !isNaN(parseInt(parts[0], 10))) {
      return parseInt(parts[0], 10);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Evaluates a transaction against behavioral profile & history using 13 Suspicious Patterns (P1-P13).
 */
export function evaluateTransactionRisk(transaction = {}, profile = null, recentTransactions = []) {
  const amount = parseFloat(transaction.amount || 0);
  const receiver = String(transaction.receiver || transaction.merchant || '').trim();
  const _receiverUpi = String(transaction.receiver_upi || transaction.receiverUpi || '').trim().toLowerCase();
  const timeStr = String(transaction.time || '');
  const device = String(transaction.device || '');
  const location = String(transaction.location || '');

  // Contextual mandate & text fields
  const remarks = String(transaction.remarks || transaction.notes || '');
  const paymentMode = String(transaction.payment_mode || transaction.paymentMode || '');
  const category = String(transaction.category || '');
  const autopayMandate = String(transaction.autopay_mandate || transaction.autopayMandate || '');
  let expectedRecurring = parseFloat(transaction.expected_recurring_amount || transaction.expectedRecurringAmount || 0);

  const hour = parseHour(timeStr, transaction.hour);
  const recent = Array.isArray(recentTransactions) ? recentTransactions : [];

  const factors = [];
  const detectedPatterns = [];
  const patternStatus = {};

  // Initialize all 13 patterns as Not Detected
  for (const [pid, pname] of Object.entries(PATTERN_DESCRIPTIONS)) {
    patternStatus[pid] = {
      id: pid,
      name: `Pattern ${pid.slice(1)} — ${pname}`,
      detected: false,
      status: 'Not Detected',
      reason: `No anomalous behavior matching ${pname} was observed.`,
    };
  }

  // Combined text for keyword scanning (used in P13)
  const textCorpus = `${remarks} ${paymentMode} ${category} ${autopayMandate} ${receiver}`.toLowerCase();
  const autopayKeywords = [
    'autopay', 'mandate', 'recurring', 'subscription', 'e-mandate',
    'standing instruction', 'auto-debit', 'auto debit', 'si ',
  ];
  const hasAutopayEvidence = autopayKeywords.some((kw) => textCorpus.includes(kw)) ||
    (Boolean(autopayMandate) && !['none', 'no', 'false', '0'].includes(autopayMandate.toLowerCase()));

  // Extract recurring amount from text if not provided
  if (!expectedRecurring) {
    const amtMatch = textCorpus.match(/(?:₹|rs\.?|inr)?\s*([1-9]\d{1,4})\s*(?:\/|\s*(?:per|mo|month|recur|debit))?/);
    if (amtMatch) {
      const val = parseFloat(amtMatch[1]);
      if (val >= 99 && val !== amount) {
        expectedRecurring = val;
      }
    }
  }

  // --------------------------------------------------------------------------
  // P13 Evaluation — Small Initial Payment + Unexpected AutoPay/Recurring Debit
  // --------------------------------------------------------------------------
  let p13Detected = false;
  let p13Reason = '';
  let p13Contrib = 0;

  if (amount <= 10.0 && amount > 0) {
    if (hasAutopayEvidence || expectedRecurring > 0) {
      p13Detected = true;
      p13Contrib = 30;
      p13Reason = `Small initial payment of ₹${amount.toLocaleString()} is accompanied by an unexpected AutoPay/recurring mandate (${expectedRecurring ? '₹' + expectedRecurring.toLocaleString() : 'subsequent recurring debit'}). Deceptive subscription/mandate establishment pattern detected.`;
    } else {
      const subsequentLarge = recent.filter(
        (t) => String(t.receiver || '').toLowerCase() === receiver.toLowerCase() && parseFloat(t.amount || 0) >= 100.0
      );
      if (subsequentLarge.length > 0) {
        p13Detected = true;
        p13Contrib = 30;
        const firstSub = subsequentLarge[0];
        p13Reason = `Small initial payment (₹${amount.toLocaleString()}) to '${receiver}' is linked to a subsequent larger debit of ₹${parseFloat(firstSub.amount).toLocaleString()}. Deceptive trial-to-recurring debit relationship detected.`;
      } else {
        patternStatus.P13.status = 'Not Detected / Insufficient Data';
        patternStatus.P13.reason = `Small amount (₹${amount.toLocaleString()}) observed, but no AutoPay mandate, recurring subscription, or subsequent larger debit evidence was found. Marked as Not Detected / Insufficient Data.`;
      }
    }
  } else if (amount >= 100.0) {
    const earlierSmall = recent.filter(
      (t) => String(t.receiver || '').toLowerCase() === receiver.toLowerCase() && parseFloat(t.amount || 0) > 0 && parseFloat(t.amount || 0) <= 10.0
    );
    if (earlierSmall.length > 0) {
      p13Detected = true;
      p13Contrib = 28;
      p13Reason = `Subsequent debit of ₹${amount.toLocaleString()} to '${receiver}' follows an earlier small verification payment of ₹${parseFloat(earlierSmall[0].amount).toLocaleString()}. Deceptive AutoPay activation pattern.`;
    } else if (hasAutopayEvidence && [199, 299, 399, 499, 599, 799, 999].includes(Math.round(amount))) {
      p13Detected = true;
      p13Contrib = 24;
      p13Reason = `Recurring mandate debit of ₹${amount.toLocaleString()} flagged under AutoPay subscription. Verify this matches an explicitly approved ongoing mandate.`;
    } else {
      patternStatus.P13.reason = 'Transaction does not exhibit deceptive initial trial or unexpected recurring debit relationship.';
    }
  } else {
    patternStatus.P13.reason = 'No AutoPay/mandate setup or recurring debit relationship found.';
  }

  if (p13Detected) {
    factors.push({
      name: 'Deceptive AutoPay/Mandate Debit (P13)',
      contribution: p13Contrib,
      pattern: 'P13',
      description: p13Reason,
    });
    detectedPatterns.push('P13');
    patternStatus.P13.detected = true;
    patternStatus.P13.status = 'Detected';
    patternStatus.P13.reason = p13Reason;
  }

  // --------------------------------------------------------------------------
  // Cold Start Evaluation (no verified user profile history)
  // --------------------------------------------------------------------------
  const totalProfileTxns = profile?.totalTransactions || profile?.totalCount || 0;
  if (!profile || totalProfileTxns === 0) {
    if (amount > 20000) {
      factors.push({
        name: 'High Value Transaction (Unprofiled)',
        contribution: 35,
        pattern: 'P4',
        description: `₹${amount.toLocaleString()} is an elevated amount with no established spending baseline.`,
      });
      detectedPatterns.push('P4');
      patternStatus.P4.detected = true;
      patternStatus.P4.status = 'Detected';
      patternStatus.P4.reason = `₹${amount.toLocaleString()} exceeds cold-start baseline threshold.`;
    } else {
      factors.push({
        name: 'Baseline Verification',
        contribution: 10,
        pattern: '--',
        description: 'Transaction evaluated under initial cold-start parameters (no history yet).',
      });
      patternStatus.P4.reason = `₹${amount.toLocaleString()} is within safe cold-start bounds.`;
    }

    if (hour !== null && (hour < 5 || hour >= 23)) {
      factors.push({
        name: 'Late Night Activity',
        contribution: 20,
        pattern: 'P8',
        description: `Transaction initiated at ${timeStr} — outside normal active daytime hours.`,
      });
      detectedPatterns.push('P8');
      patternStatus.P8.detected = true;
      patternStatus.P8.status = 'Detected';
      patternStatus.P8.reason = `Transaction initiated at ${timeStr} (outside 5 AM – 11 PM).`;
    } else if (hour !== null) {
      patternStatus.P8.reason = `Transaction at ${timeStr} is within normal active daytime hours.`;
    } else {
      patternStatus.P8.reason = 'Time information is unavailable; this indicator was not assessed.';
    }

    const rawScore = factors.reduce((acc, f) => acc + f.contribution, 0);
    const score = Math.max(5, Math.min(95, rawScore));
    const riskInfo = getRiskLevel(score);
    return buildResult(score, riskInfo, detectedPatterns, factors, 'Cold Start (No Profile)', patternStatus);
  }

  // --------------------------------------------------------------------------
  // Profile Parameters & Established Baseline
  // --------------------------------------------------------------------------
  const avgAmt = parseFloat(profile.avgAmount || profile.averageAmount || 1500);
  const maxAmt = parseFloat(profile.maxAmount || 10000);
  const stdDev = parseFloat(profile.stdDev || profile.amountStdDev || (avgAmt * 0.5) || 500);
  const knownRecipients = (profile.frequentRecipients || []).map((r) =>
    (typeof r === 'string' ? r : r.name || r.upiId || '').toLowerCase()
  );

  const isKnown = Boolean(receiver) && knownRecipients.some(
    (k) => receiver.toLowerCase().includes(k) || k.includes(receiver.toLowerCase())
  );

  // P4 -- Amount Outside Historical Range
  if (amount > maxAmt * 1.8 || (stdDev > 0 && amount > avgAmt + 3.5 * stdDev)) {
    const desc = `₹${amount.toLocaleString()} is ${(amount / (avgAmt || 1)).toFixed(1)}x your average (₹${avgAmt.toLocaleString()}) and exceeds your highest recorded amount.`;
    factors.push({
      name: 'Severe Amount Deviation (P4)',
      contribution: 28,
      pattern: 'P4',
      description: desc,
    });
    detectedPatterns.push('P4');
    patternStatus.P4.detected = true;
    patternStatus.P4.status = 'Detected';
    patternStatus.P4.reason = desc;
  } else if (stdDev > 0 && amount > avgAmt + 2 * stdDev) {
    const desc = `₹${amount.toLocaleString()} noticeably exceeds typical spending variance (avg ₹${avgAmt.toLocaleString()}).`;
    factors.push({
      name: 'Elevated Transaction Amount (P4)',
      contribution: 15,
      pattern: 'P4',
      description: desc,
    });
    detectedPatterns.push('P4');
    patternStatus.P4.detected = true;
    patternStatus.P4.status = 'Detected';
    patternStatus.P4.reason = desc;
  } else {
    patternStatus.P4.reason = `₹${amount.toLocaleString()} is consistent with user historical average (₹${avgAmt.toLocaleString()}).`;
    factors.push({
      name: 'Normal Amount Range',
      contribution: 2,
      pattern: '--',
      description: `₹${amount.toLocaleString()} is consistent with typical range (avg ₹${avgAmt.toLocaleString()}).`,
    });
  }

  // P1 -- Repeated Same-Amount Transactions (Rapid)
  if (recent.length > 0) {
    const sameAmountCount = recent.slice(0, 10).filter(
      (t) => Math.abs(parseFloat(t.amount || -1) - amount) < 1.0
    ).length;

    if (sameAmountCount >= 2) {
      const contrib = Math.min(25, 10 + sameAmountCount * 5);
      const desc = `₹${amount.toLocaleString()} was sent ${sameAmountCount + 1} times in quick succession. Repeated identical amounts are a common indicator of automated fraud.`;
      factors.push({
        name: `Repeated Same-Amount Burst (P1) x${sameAmountCount + 1}`,
        contribution: contrib,
        pattern: 'P1',
        description: desc,
      });
      detectedPatterns.push('P1');
      patternStatus.P1.detected = true;
      patternStatus.P1.status = 'Detected';
      patternStatus.P1.reason = desc;
    } else {
      patternStatus.P1.reason = 'No repeated identical amount burst found in recent transactions.';
    }
  } else {
    patternStatus.P1.reason = 'No recent transactions found for identical-amount comparison.';
  }

  // P2 -- Doubling/Multiplying Amount to Same Recipient
  if (recent.length > 0 && receiver) {
    const sameRecvAmounts = recent
      .slice(0, 8)
      .filter((t) => String(t.receiver || '').toLowerCase() === receiver.toLowerCase())
      .map((t) => parseFloat(t.amount || 0))
      .sort((a, b) => b - a);

    if (sameRecvAmounts.length >= 2) {
      const prev = sameRecvAmounts[0];
      if (prev > 0 && amount / prev >= 1.7 && amount / prev <= 2.5) {
        const desc = `Amount to '${receiver}' roughly doubled: ₹${prev.toLocaleString()} to ₹${amount.toLocaleString()}. Escalating amounts are a known fraud indicator.`;
        factors.push({
          name: 'Doubling Amount Pattern (P2)',
          contribution: 22,
          pattern: 'P2',
          description: desc,
        });
        detectedPatterns.push('P2');
        patternStatus.P2.detected = true;
        patternStatus.P2.status = 'Detected';
        patternStatus.P2.reason = desc;
      } else {
        patternStatus.P2.reason = `No doubling/multiplying escalation ratio observed to '${receiver}'.`;
      }
    } else {
      patternStatus.P2.reason = `Insufficient repeat transactions to '${receiver}' to establish a multiplier pattern.`;
    }
  } else {
    patternStatus.P2.reason = 'No repeat recipient history found for escalation analysis.';
  }

  // P3 -- Transaction Frequency Burst
  if (recent.length > 0) {
    const burstCount = recent.slice(0, 15).length;
    const dailyAvg = parseFloat(profile.dailyAvgCount || profile.averageDailyTransactions || 3);
    if (burstCount >= Math.max(5, dailyAvg * 2.5)) {
      const desc = `Detected ${burstCount} recent transactions vs. daily average of ${Math.round(dailyAvg)}. A sudden burst may indicate account compromise.`;
      factors.push({
        name: `High Frequency Burst (P3) — ${burstCount} recent txns`,
        contribution: 20,
        pattern: 'P3',
        description: desc,
      });
      detectedPatterns.push('P3');
      patternStatus.P3.detected = true;
      patternStatus.P3.status = 'Detected';
      patternStatus.P3.reason = desc;
    } else {
      patternStatus.P3.reason = `Transaction frequency (${burstCount} in window) is within normal limits.`;
    }
  } else {
    patternStatus.P3.reason = 'No rapid velocity burst detected.';
  }

  // P5 -- New Recipient + Unusual High Amount
  if (!isKnown && receiver && amount > avgAmt * 1.5) {
    const desc = `'${receiver}' is a first-time recipient and ₹${amount.toLocaleString()} is ${(amount / avgAmt).toFixed(1)}x your average — high combined risk.`;
    factors.push({
      name: 'New Recipient + High Amount (P5)',
      contribution: 25,
      pattern: 'P5',
      description: desc,
    });
    detectedPatterns.push('P5');
    patternStatus.P5.detected = true;
    patternStatus.P5.status = 'Detected';
    patternStatus.P5.reason = desc;
  } else if (!isKnown && receiver) {
    factors.push({
      name: 'New / First-Time Recipient',
      contribution: 18,
      pattern: '--',
      description: `'${receiver}' has never appeared in your verified transaction history.`,
    });
    patternStatus.P5.reason = `'${receiver}' is new, but the amount (₹${amount.toLocaleString()}) is not unusually elevated.`;
  } else {
    patternStatus.P5.reason = `'${receiver}' is a known, previously verified recipient.`;
    factors.push({
      name: 'Known Frequent Recipient',
      contribution: 0,
      pattern: '--',
      description: `'${receiver}' matches a verified frequent contact.`,
    });
  }

  // P6 -- New Recipient + Multiple Rapid Transactions
  if (!isKnown && recent.length > 0) {
    const rapidSameRecv = recent.slice(0, 6).filter(
      (t) => String(t.receiver || '').toLowerCase() === receiver.toLowerCase()
    ).length;

    if (rapidSameRecv >= 2) {
      const desc = `'${receiver}' is a new contact with ${rapidSameRecv + 1} rapid consecutive transactions — strong indicator of social-engineering fraud.`;
      factors.push({
        name: `New Recipient + Rapid Repeat (P6) x${rapidSameRecv + 1}`,
        contribution: 22,
        pattern: 'P6',
        description: desc,
      });
      detectedPatterns.push('P6');
      patternStatus.P6.detected = true;
      patternStatus.P6.status = 'Detected';
      patternStatus.P6.reason = desc;
    } else {
      patternStatus.P6.reason = 'No rapid repeated attempts to a new recipient detected.';
    }
  } else if (recent.length > 0) {
    const sameRecvCount = recent.slice(0, 5).filter(
      (t) => String(t.receiver || '').toLowerCase() === receiver.toLowerCase()
    ).length;

    if (sameRecvCount >= 2 && !detectedPatterns.includes('P6')) {
      const desc = `Detected ${sameRecvCount + 1} transactions to '${receiver}' in a short window.`;
      factors.push({
        name: `Rapid Repeated Transaction (P6) x${sameRecvCount + 1}`,
        contribution: 18,
        pattern: 'P6',
        description: desc,
      });
      detectedPatterns.push('P6');
      patternStatus.P6.detected = true;
      patternStatus.P6.status = 'Detected';
      patternStatus.P6.reason = desc;
    } else {
      patternStatus.P6.reason = 'No rapid repeated transactions observed.';
    }
  } else {
    patternStatus.P6.reason = 'No multiple rapid transactions to new recipient found.';
  }

  // P7 -- Multiple Different Recipients in Short Period
  if (recent.length > 0) {
    const uniqueRecentReceivers = new Set(
      recent.slice(0, 8).map((t) => String(t.receiver || '').toLowerCase()).filter(Boolean)
    );
    if (uniqueRecentReceivers.size >= 4) {
      const desc = `Payments to ${uniqueRecentReceivers.size} different recipients in a short period. Scatter pattern may indicate account takeover.`;
      factors.push({
        name: `Multiple Recipients Burst (P7) — ${uniqueRecentReceivers.size} different`,
        contribution: 18,
        pattern: 'P7',
        description: desc,
      });
      detectedPatterns.push('P7');
      patternStatus.P7.detected = true;
      patternStatus.P7.status = 'Detected';
      patternStatus.P7.reason = desc;
    } else {
      patternStatus.P7.reason = `Recipients count (${uniqueRecentReceivers.size}) in window is within normal scatter threshold.`;
    }
  } else {
    patternStatus.P7.reason = 'No scattered multi-recipient activity detected.';
  }

  // P8 -- Unusual Time of Day
  if (hour === null) {
    patternStatus.P8.reason = 'Time information is unavailable; this indicator was not assessed.';
  } else if (hour < 5 || hour >= 23) {
    const desc = `Transaction at ${timeStr} is outside normal active hours (5 AM to 11 PM).`;
    factors.push({
      name: 'Late Night / Very Early Morning (P8)',
      contribution: 18,
      pattern: 'P8',
      description: desc,
    });
    detectedPatterns.push('P8');
    patternStatus.P8.detected = true;
    patternStatus.P8.status = 'Detected';
    patternStatus.P8.reason = desc;
  } else if (hour < 7) {
    const desc = `Transaction at ${timeStr} is in an infrequent usage period (5-7 AM).`;
    factors.push({
      name: 'Early Morning Activity (P8)',
      contribution: 8,
      pattern: 'P8',
      description: desc,
    });
    patternStatus.P8.reason = desc;
  } else {
    patternStatus.P8.reason = `Transaction at ${timeStr} is within standard active hours.`;
  }

  // P9 -- Round/Structured Amount to Unknown Recipient
  const roundValues = new Set([1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000]);
  if (roundValues.has(Math.round(amount)) && !isKnown) {
    const desc = `Exact round amount ₹${amount.toLocaleString()} sent to an unverified recipient. Common in structuring or test-fraud.`;
    factors.push({
      name: 'Structured Round Amount to Unknown Recipient (P9)',
      contribution: 12,
      pattern: 'P9',
      description: desc,
    });
    detectedPatterns.push('P9');
    patternStatus.P9.detected = true;
    patternStatus.P9.status = 'Detected';
    patternStatus.P9.reason = desc;
  } else {
    patternStatus.P9.reason = 'Amount is not a suspicious structured round figure to an unknown counterparty.';
  }

  // P10 -- Device Anomaly
  if (device && device.toLowerCase().includes('new device')) {
    const desc = `Transaction from '${device}' — device not previously seen in your profile.`;
    factors.push({
      name: 'Unrecognized Device (P10)',
      contribution: 12,
      pattern: 'P10',
      description: desc,
    });
    detectedPatterns.push('P10');
    patternStatus.P10.detected = true;
    patternStatus.P10.status = 'Detected';
    patternStatus.P10.reason = desc;
  } else if (device) {
    patternStatus.P10.reason = `Device '${device}' has no unusual indicator in the supplied details.`;
  } else {
    patternStatus.P10.reason = 'Device information is unavailable; this indicator was not assessed.';
  }

  // P11 -- Geographic/Location Anomaly
  if (location && (location.toLowerCase().includes('unknown') || location.toLowerCase().includes('new location'))) {
    const desc = `Location '${location}' is unusual compared to your verified geography.`;
    factors.push({
      name: 'Location Anomaly (P11)',
      contribution: 10,
      pattern: 'P11',
      description: desc,
    });
    detectedPatterns.push('P11');
    patternStatus.P11.detected = true;
    patternStatus.P11.status = 'Detected';
    patternStatus.P11.reason = desc;
  } else if (location) {
    patternStatus.P11.reason = `Location '${location}' has no unusual indicator in the supplied details.`;
  } else {
    patternStatus.P11.reason = 'Location information is unavailable; this indicator was not assessed.';
  }

  // P12 -- Sudden Large-Value Spike vs. Recent Average
  if (recent.length >= 3) {
    const recentAmounts = recent.slice(0, 5).map((t) => parseFloat(t.amount || 0)).filter((a) => a > 0);
    if (recentAmounts.length > 0) {
      const recentAvg = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length;
      if (recentAvg > 0 && amount > recentAvg * 3) {
        const desc = `₹${amount.toLocaleString()} is ${(amount / recentAvg).toFixed(1)}x your recent session average (₹${recentAvg.toLocaleString()}). Sudden escalation is a key fraud signal.`;
        factors.push({
          name: `Sudden Value Spike (P12) — ${(amount / recentAvg).toFixed(1)}x recent avg`,
          contribution: 20,
          pattern: 'P12',
          description: desc,
        });
        detectedPatterns.push('P12');
        patternStatus.P12.detected = true;
        patternStatus.P12.status = 'Detected';
        patternStatus.P12.reason = desc;
      } else {
        patternStatus.P12.reason = `Amount is within normal range of recent session average (₹${recentAvg.toLocaleString()}).`;
      }
    } else {
      patternStatus.P12.reason = 'No recent non-zero amounts found for spike comparison.';
    }
  } else {
    patternStatus.P12.reason = 'Insufficient recent transactions to calculate a short-term spike.';
  }

  // Aggregate Risk Score
  const rawScore = factors.reduce((sum, f) => sum + (f.contribution || 0), 0);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const riskInfo = getRiskLevel(score);

  return buildResult(score, riskInfo, detectedPatterns, factors, profile.status || 'Active', patternStatus);
}

function buildResult(score, riskInfo, detectedPatterns, factors, profileStatus, patternStatus) {
  let riskType = 'Normal Transaction';
  if (score >= 80) {
    riskType = detectedPatterns.length > 1
      ? 'Combined High-Risk Pattern'
      : (PATTERN_DESCRIPTIONS[detectedPatterns[0]] || 'Critical Anomaly');
  } else if (score >= 60) {
    riskType = PATTERN_DESCRIPTIONS[detectedPatterns[0]] || 'High Anomaly Score';
  } else if (score >= 30) {
    riskType = PATTERN_DESCRIPTIONS[detectedPatterns[0]] || 'Moderate Variance';
  }

  const enrichedPatterns = detectedPatterns.map((pid) => `${pid}: ${PATTERN_DESCRIPTIONS[pid] || pid}`);

  const detectedDetails = detectedPatterns
    .filter((pid) => patternStatus[pid])
    .map((pid) => ({
      id: pid,
      name: `Pattern ${pid.slice(1)} — ${PATTERN_DESCRIPTIONS[pid] || pid}`,
      description: patternStatus[pid].reason,
      contribution: factors.find((f) => f.pattern === pid)?.contribution || 20,
    }));

  const patternKeys = Array.from({ length: 13 }, (_, i) => `P${i + 1}`);

  const notDetectedList = patternKeys
    .filter((pid) => patternStatus[pid] && !patternStatus[pid].detected)
    .map((pid) => patternStatus[pid]);

  const allPatternsList = patternKeys
    .filter((pid) => patternStatus[pid])
    .map((pid) => patternStatus[pid]);

  return {
    score,
    level: riskInfo.level,
    levelInfo: riskInfo,
    type: riskType,
    detected_patterns: enrichedPatterns.length > 0 ? enrichedPatterns : ['No anomalies detected'],
    pattern_ids: detectedPatterns,
    detected_patterns_details: detectedDetails,
    not_detected_patterns: notDetectedList,
    all_patterns_checked: allPatternsList,
    factors,
    profile_status: profileStatus,
    why: factors.filter((f) => f.contribution > 0).map((f) => f.description),
    recommendation: generateRecommendation(score, factors, detectedPatterns),
  };
}

function generateRecommendation(score, _factors, _detectedPatterns) {
  if (score >= 80) {
    return 'CRITICAL WARNING: High fraud probability detected. Immediately verify the recipient through an independent channel. Do not enter UPI PIN or approve pending mandates.';
  } else if (score >= 60) {
    return 'HIGH ALERT: Elevated risk indicators found. Check recipient UPI ID and transaction amount carefully before completing the payment.';
  } else if (score >= 30) {
    return 'MODERATE RISK: Some deviations from typical spending behavior detected. Review transaction details.';
  }
  return 'LOW RISK: Transaction appears consistent with established patterns.';
}

export function analyseTransaction(transaction, profile, recentTransactions = []) {
  return evaluateTransactionRisk(transaction, profile, recentTransactions);
}

export default {
  evaluateTransactionRisk,
  analyseTransaction,
  getRiskLevel,
  getRiskColor,
  RISK_THRESHOLDS,
  PATTERN_DESCRIPTIONS,
};
