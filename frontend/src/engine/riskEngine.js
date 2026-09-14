// ============================================
// UPI Sentinel AI — Risk Engine
// Deterministic, rule-based fraud risk scoring
// ============================================

// Configurable thresholds
export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 29, label: 'LOW', color: '#22c55e' },
  MEDIUM: { min: 30, max: 59, label: 'MEDIUM', color: '#f59e0b' },
  HIGH: { min: 60, max: 79, label: 'HIGH', color: '#ef4444' },
  CRITICAL: { min: 80, max: 100, label: 'CRITICAL', color: '#dc2626' },
};

export function getRiskLevel(score) {
  if (score <= RISK_THRESHOLDS.LOW.max) return RISK_THRESHOLDS.LOW;
  if (score <= RISK_THRESHOLDS.MEDIUM.max) return RISK_THRESHOLDS.MEDIUM;
  if (score <= RISK_THRESHOLDS.HIGH.max) return RISK_THRESHOLDS.HIGH;
  return RISK_THRESHOLDS.CRITICAL;
}

export function getRiskColor(score) {
  return getRiskLevel(score).color;
}

export function analyseTransaction(transaction, profile, recentTransactions = []) {
  const factors = [];
  let totalScore = 0;

  // 1. Unusual Amount
  const amountFactor = checkUnusualAmount(transaction, profile);
  factors.push(amountFactor);
  totalScore += amountFactor.contribution;

  // 2. New Recipient
  const recipientFactor = checkNewRecipient(transaction, profile);
  factors.push(recipientFactor);
  totalScore += recipientFactor.contribution;

  // 3. Unusual Time
  const timeFactor = checkUnusualTime(transaction, profile);
  factors.push(timeFactor);
  totalScore += timeFactor.contribution;

  // 4. Rapid Repeated Transaction
  const rapidFactor = checkRapidRepeated(transaction, recentTransactions);
  factors.push(rapidFactor);
  totalScore += rapidFactor.contribution;

  // 5. Frequency Anomaly
  const frequencyFactor = checkFrequencyAnomaly(transaction, recentTransactions, profile);
  factors.push(frequencyFactor);
  totalScore += frequencyFactor.contribution;

  // 6. Repeated Amount Pattern
  const amountPatternFactor = checkRepeatedAmountPattern(transaction, recentTransactions);
  factors.push(amountPatternFactor);
  totalScore += amountPatternFactor.contribution;

  // 7. Behaviour Deviation
  const deviationFactor = checkBehaviourDeviation(transaction, profile);
  factors.push(deviationFactor);
  totalScore += deviationFactor.contribution;

  // 8. Device Anomaly
  const deviceFactor = checkDeviceAnomaly(transaction, profile);
  factors.push(deviceFactor);
  totalScore += deviceFactor.contribution;

  // 9. Location Anomaly
  const locationFactor = checkLocationAnomaly(transaction, profile, recentTransactions);
  factors.push(locationFactor);
  totalScore += locationFactor.contribution;

  // 10. Combined Risk Multiplier
  const activeFacts = factors.filter(f => f.contribution > 0);
  if (activeFacts.length >= 3) {
    const combinedBonus = Math.min(Math.floor(activeFacts.length * 2.5), 15);
    factors.push({
      name: 'Combined Risk Multiplier',
      contribution: combinedBonus,
      description: `${activeFacts.length} risk indicators detected together increase overall risk`,
      severity: 'high',
    });
    totalScore += combinedBonus;
  }

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  const riskLevel = getRiskLevel(totalScore);
  const riskType = determineRiskType(factors, totalScore);
  const recommendation = generateRecommendation(riskLevel.label, factors);

  return {
    score: totalScore,
    level: riskLevel.label,
    levelInfo: riskLevel,
    type: riskType,
    factors: factors.filter(f => f.contribution > 0).sort((a, b) => b.contribution - a.contribution),
    allFactors: factors,
    recommendation,
  };
}

function checkUnusualAmount(txn, profile) {
  const amount = txn.amount;
  const avg = profile.averageAmount || 1420;
  const max = profile.maxAmount || 12000;
  const stdDev = profile.amountStdDev || 800;

  let contribution = 0;
  let description = '';

  const deviation = Math.abs(amount - avg) / (stdDev || 1);

  if (amount > max * 2) {
    contribution = 24;
    description = `₹${amount.toLocaleString()} far exceeds normal range (avg ₹${avg.toLocaleString()})`;
  } else if (amount > max * 1.5) {
    contribution = 18;
    description = `₹${amount.toLocaleString()} significantly exceeds normal behaviour`;
  } else if (deviation > 3) {
    contribution = 15;
    description = `₹${amount.toLocaleString()} is ${deviation.toFixed(1)} standard deviations from average`;
  } else if (deviation > 2) {
    contribution = 10;
    description = `₹${amount.toLocaleString()} is somewhat above normal range`;
  } else if (deviation > 1.5) {
    contribution = 5;
    description = `₹${amount.toLocaleString()} is slightly above typical range`;
  } else {
    description = `₹${amount.toLocaleString()} is within normal range (avg ₹${avg.toLocaleString()})`;
  }

  return { name: 'Unusual Amount', contribution, description, severity: contribution > 15 ? 'high' : contribution > 5 ? 'medium' : 'low' };
}

function checkNewRecipient(txn, profile) {
  const recipients = profile.frequentRecipients || [];
  const isKnown = recipients.some(
    r => r.name.toLowerCase() === (txn.receiver || '').toLowerCase() ||
         r.upiId === txn.receiverUpi
  );

  if (isKnown) {
    return { name: 'Known Recipient', contribution: 0, description: `${txn.receiver} is a known recipient`, severity: 'low' };
  }

  return {
    name: 'New Recipient',
    contribution: 18,
    description: `${txn.receiver} has never appeared in transaction history`,
    severity: 'medium',
  };
}

function checkUnusualTime(txn, profile) {
  const hour = txn.hour;
  const normalStart = profile.normalTimeStart || 8;
  const normalEnd = profile.normalTimeEnd || 22;

  if (hour >= normalStart && hour <= normalEnd) {
    return { name: 'Normal Time', contribution: 0, description: `${txn.time} is within normal hours (${normalStart}:00 – ${normalEnd}:00)`, severity: 'low' };
  }

  // Late night / early morning — higher risk
  const hoursOutside = hour < normalStart ? normalStart - hour : hour - normalEnd;
  const contribution = Math.min(hoursOutside * 4, 18);

  return {
    name: 'Unusual Time',
    contribution,
    description: `${txn.time} is outside normal transaction hours (${normalStart}:00 AM – ${normalEnd}:00 PM)`,
    severity: contribution > 10 ? 'high' : 'medium',
  };
}

function checkRapidRepeated(txn, recentTransactions) {
  if (!recentTransactions || recentTransactions.length === 0) {
    return { name: 'Rapid Repeated Transaction', contribution: 0, description: 'No rapid repeated pattern detected', severity: 'low' };
  }

  // Find transactions to same recipient within 5 minutes
  const sameRecipient = recentTransactions.filter(t => {
    const sameReceiver = (t.receiver || '').toLowerCase() === (txn.receiver || '').toLowerCase();
    const sameDate = t.dateISO === txn.dateISO;
    if (!sameReceiver || !sameDate) return false;

    const timeDiff = Math.abs((txn.hour * 60 + txn.minute) - (t.hour * 60 + t.minute));
    return timeDiff <= 5;
  });

  if (sameRecipient.length >= 2) {
    return {
      name: 'Rapid Repeated Transaction',
      contribution: 22,
      description: `${sameRecipient.length + 1} transactions to same recipient within minutes`,
      severity: 'high',
    };
  } else if (sameRecipient.length === 1) {
    return {
      name: 'Rapid Repeated Transaction',
      contribution: 12,
      description: `2 transactions to same recipient within minutes`,
      severity: 'medium',
    };
  }

  return { name: 'Rapid Repeated Transaction', contribution: 0, description: 'No rapid repeated pattern detected', severity: 'low' };
}

function checkFrequencyAnomaly(txn, recentTransactions, profile) {
  const avgDaily = profile.averageDailyTransactions || 4;
  const todayTxns = recentTransactions.filter(t => t.dateISO === txn.dateISO);
  const todayCount = todayTxns.length + 1;

  if (todayCount > avgDaily * 3) {
    return {
      name: 'Frequency Anomaly',
      contribution: 15,
      description: `${todayCount} transactions today, normal is ~${avgDaily}/day`,
      severity: 'high',
    };
  } else if (todayCount > avgDaily * 2) {
    return {
      name: 'Frequency Anomaly',
      contribution: 8,
      description: `${todayCount} transactions today, somewhat above normal (~${avgDaily}/day)`,
      severity: 'medium',
    };
  }

  return { name: 'Normal Frequency', contribution: 0, description: `Transaction frequency is consistent with profile`, severity: 'low' };
}

function checkRepeatedAmountPattern(txn, recentTransactions) {
  if (!recentTransactions || recentTransactions.length < 2) {
    return { name: 'Amount Pattern', contribution: 0, description: 'No repeated amount pattern', severity: 'low' };
  }

  const sameAmount = recentTransactions.filter(t =>
    t.amount === txn.amount && t.dateISO === txn.dateISO
  );

  if (sameAmount.length >= 2) {
    return {
      name: 'Repeated Amount Pattern',
      contribution: 12,
      description: `₹${txn.amount.toLocaleString()} repeated ${sameAmount.length + 1} times today`,
      severity: 'medium',
    };
  } else if (sameAmount.length === 1) {
    return {
      name: 'Repeated Amount Pattern',
      contribution: 5,
      description: `₹${txn.amount.toLocaleString()} appears twice today`,
      severity: 'low',
    };
  }

  return { name: 'Amount Pattern', contribution: 0, description: 'No repeated amount pattern', severity: 'low' };
}

function checkBehaviourDeviation(txn, profile) {
  let deviationCount = 0;

  // Amount check
  if (txn.amount > (profile.maxAmount || 12000) * 1.5) deviationCount++;
  // Time check
  if (txn.hour < (profile.normalTimeStart || 8) || txn.hour > (profile.normalTimeEnd || 22)) deviationCount++;
  // Recipient check
  const knownRecipients = profile.frequentRecipients || [];
  const isKnown = knownRecipients.some(r => r.name.toLowerCase() === (txn.receiver || '').toLowerCase());
  if (!isKnown) deviationCount++;

  if (deviationCount >= 3) {
    return {
      name: 'Behaviour Deviation',
      contribution: 15,
      description: 'Overall behaviour significantly deviates from established profile',
      severity: 'high',
    };
  } else if (deviationCount === 2) {
    return {
      name: 'Behaviour Deviation',
      contribution: 10,
      description: 'Transaction shows moderate deviation from behaviour profile',
      severity: 'medium',
    };
  } else if (deviationCount === 1) {
    return {
      name: 'Behaviour Deviation',
      contribution: 5,
      description: 'Minor deviation from behaviour profile',
      severity: 'low',
    };
  }

  return { name: 'Behaviour Match', contribution: 0, description: 'Overall behaviour matches profile', severity: 'low' };
}

function checkDeviceAnomaly(txn, profile) {
  if (!txn.device) {
    return { name: 'Device Info', contribution: 0, description: 'Device data unavailable', severity: 'low' };
  }

  const knownDevices = profile.knownDevices || ['Samsung Galaxy S23', 'iPhone 14'];
  const isKnown = knownDevices.some(d => d.toLowerCase() === txn.device.toLowerCase());

  if (!isKnown) {
    return {
      name: 'New Device',
      contribution: 10,
      description: `${txn.device} has not been seen before`,
      severity: 'medium',
    };
  }

  return { name: 'Known Device', contribution: 0, description: `${txn.device} is a known device`, severity: 'low' };
}

function checkLocationAnomaly(txn, profile, recentTransactions) {
  if (!txn.location) {
    return { name: 'Location Info', contribution: 0, description: 'Location data unavailable', severity: 'low' };
  }

  const usualLocation = profile.usualLocation || 'Chennai';
  if (txn.location.toLowerCase() === usualLocation.toLowerCase()) {
    return { name: 'Normal Location', contribution: 0, description: `Transaction from ${txn.location} (usual location)`, severity: 'low' };
  }

  // Check for impossible travel
  if (recentTransactions.length > 0) {
    const lastTxn = recentTransactions[0];
    if (lastTxn.location && lastTxn.location.toLowerCase() !== txn.location.toLowerCase()) {
      const timeDiff = Math.abs((txn.hour * 60 + txn.minute) - (lastTxn.hour * 60 + lastTxn.minute));
      if (timeDiff < 30 && lastTxn.dateISO === txn.dateISO) {
        return {
          name: 'Location Anomaly',
          contribution: 15,
          description: `Potential impossible-travel: ${lastTxn.location} to ${txn.location} in ${timeDiff} minutes`,
          severity: 'high',
        };
      }
    }
  }

  return {
    name: 'Location Anomaly',
    contribution: 8,
    description: `Transaction from ${txn.location}, usual location is ${usualLocation}`,
    severity: 'medium',
  };
}

function determineRiskType(factors, score) {
  const activeFactors = factors.filter(f => f.contribution > 0).map(f => f.name);

  if (activeFactors.includes('Rapid Repeated Transaction') && score >= 60) {
    return 'Repeated Rapid Transaction';
  }
  if (activeFactors.includes('Location Anomaly') && activeFactors.includes('Unusual Time')) {
    return 'Velocity / Frequency Anomaly';
  }
  if (activeFactors.length >= 3 && score >= 80) {
    return 'Combined High-Risk Pattern';
  }
  if (activeFactors.includes('Unusual Amount') && factors.find(f => f.name === 'Unusual Amount')?.contribution >= 18) {
    return 'Unusual Amount Pattern';
  }
  if (activeFactors.includes('New Recipient') && activeFactors.includes('Unusual Time')) {
    return 'Potential Scam Pattern';
  }
  if (activeFactors.includes('Frequency Anomaly')) {
    return 'Velocity / Frequency Anomaly';
  }
  if (activeFactors.includes('Unusual Time')) {
    return 'Time-Based Behaviour Anomaly';
  }
  if (activeFactors.includes('New Recipient')) {
    return 'New Recipient Risk';
  }
  if (activeFactors.includes('Behaviour Deviation')) {
    return 'Behavioural Deviation';
  }
  if (score <= 29) {
    return 'Normal Transaction';
  }
  return 'General Risk Pattern';
}

function generateRecommendation(level, factors) {
  const activeFactorNames = factors.filter(f => f.contribution > 0).map(f => f.name);

  if (level === 'LOW') {
    return 'No significant suspicious indicators were detected by the current prototype.';
  }

  if (level === 'MEDIUM') {
    return 'Some unusual indicators were detected. Review the transaction details before proceeding.';
  }

  const recommendations = ['Verify the recipient.'];

  if (activeFactorNames.includes('New Recipient') || activeFactorNames.includes('Unusual Amount')) {
    recommendations.push('Do not approve an unfamiliar transaction.');
  }

  recommendations.push('If you did not initiate the transaction, contact your bank/payment provider through an official channel.');
  recommendations.push('Review recent account activity.');

  if (activeFactorNames.includes('Rapid Repeated Transaction')) {
    recommendations.unshift('Rapid repeated transaction pattern detected.');
  }

  return recommendations.join(' ');
}

export default {
  analyseTransaction,
  getRiskLevel,
  getRiskColor,
  RISK_THRESHOLDS,
};
