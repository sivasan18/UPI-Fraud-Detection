// ============================================
// UPI Sentinel AI — Behaviour Profile Engine
// ============================================

import { normalizeTransactionDate, safeParseDate } from '../utils/dateUtils.js';

export function buildBehaviourProfile(transactions) {
  if (!transactions || transactions.length === 0) {
    return getEmptyProfile();
  }

  const validated = transactions.filter(
    t => t.validated === 1 || t.validated === true || t.validated === '1' || t.status === 'COMPLETED' || t.status === 'SUCCESS'
  );
  if (validated.length === 0) return getEmptyProfile();

  const amounts = validated.map(t => parseFloat(t.amount) || 0).filter(a => a > 0);
  if (amounts.length === 0) return getEmptyProfile();

  const hours = validated
    .map(t => (t.hour !== undefined && t.hour !== null ? parseInt(t.hour, 10) : null))
    .filter(h => h !== null && !isNaN(h) && h >= 0 && h <= 23);

  const sortedAmounts = [...amounts].sort((a, b) => a - b);

  // Amount stats
  const sum = amounts.reduce((a, b) => a + b, 0);
  const averageAmount = Math.round(sum / amounts.length);
  const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)] || averageAmount;
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);
  const amountStdDev = Math.round(
    Math.sqrt(amounts.reduce((acc, a) => acc + Math.pow(a - averageAmount, 2), 0) / amounts.length)
  );

  // Time stats
  const sortedHours = hours.length > 0 ? [...hours].sort((a, b) => a - b) : [9, 14, 20];
  const normalTimeStart = sortedHours[Math.floor(sortedHours.length * 0.05)] ?? 8;
  const normalTimeEnd = sortedHours[Math.floor(sortedHours.length * 0.95)] ?? 22;

  // Hour distribution
  const hourDistribution = Array(24).fill(0);
  hours.forEach(h => {
    if (h >= 0 && h < 24) hourDistribution[h]++;
  });

  // Day distribution (0 = Sunday, 1 = Monday, ...)
  const dayDistribution = Array(7).fill(0);
  validated.forEach(t => {
    const raw = t.date_iso || t.dateISO || t.date;
    const d = safeParseDate(raw);
    if (d) {
      dayDistribution[d.getUTCDay()]++;
    }
  });

  // Daily frequency
  const dateMap = {};
  validated.forEach(t => {
    const raw = t.date_iso || t.dateISO || t.date;
    const norm = normalizeTransactionDate(raw);
    const key = norm.isValid ? norm.date_iso : (raw || 'unknown');
    dateMap[key] = (dateMap[key] || 0) + 1;
  });
  const dailyCounts = Object.values(dateMap);
  const averageDailyTransactions = dailyCounts.length > 0
    ? Math.max(1, Math.round(dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length))
    : 1;

  // Recipient frequency
  const recipientMap = {};
  validated.forEach(t => {
    const key = (t.receiver || t.merchant || 'Unknown').trim();
    const upi = t.receiver_upi || t.receiverUpi || '';
    if (!recipientMap[key]) {
      recipientMap[key] = { name: key, upiId: upi, count: 0, totalAmount: 0 };
    }
    recipientMap[key].count++;
    recipientMap[key].totalAmount += parseFloat(t.amount) || 0;
  });

  const frequentRecipients = Object.values(recipientMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // New recipient ratio
  const uniqueRecipients = Object.keys(recipientMap).length;
  const totalTxns = validated.length;
  const newRecipientRatio = totalTxns > 0 ? uniqueRecipients / totalTxns : 0.5;

  // Devices
  const deviceMap = {};
  validated.forEach(t => {
    if (t.device) {
      deviceMap[t.device] = (deviceMap[t.device] || 0) + 1;
    }
  });
  const knownDevices = Object.keys(deviceMap);

  // Location
  const locationMap = {};
  validated.forEach(t => {
    if (t.location) {
      locationMap[t.location] = (locationMap[t.location] || 0) + 1;
    }
  });
  const usualLocation = Object.entries(locationMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Local';

  // Amount range (5th to 95th percentile)
  const normalAmountMin = sortedAmounts[Math.floor(sortedAmounts.length * 0.05)] || minAmount;
  const normalAmountMax = sortedAmounts[Math.floor(sortedAmounts.length * 0.95)] || maxAmount;

  // Weekly frequency
  const weekMap = {};
  validated.forEach(t => {
    const raw = t.date_iso || t.dateISO || t.date;
    const d = safeParseDate(raw);
    if (d) {
      const weekStart = new Date(d);
      weekStart.setUTCDate(d.getUTCDate() - d.getUTCDay());
      const key = weekStart.toISOString().split('T')[0];
      weekMap[key] = (weekMap[key] || 0) + 1;
    }
  });
  const weeklyFrequency = Object.entries(weekMap)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Amount distribution buckets
  const amountBuckets = [
    { range: '0-500', count: 0 },
    { range: '500-1K', count: 0 },
    { range: '1K-2K', count: 0 },
    { range: '2K-5K', count: 0 },
    { range: '5K-10K', count: 0 },
    { range: '10K+', count: 0 },
  ];
  amounts.forEach(a => {
    if (a <= 500) amountBuckets[0].count++;
    else if (a <= 1000) amountBuckets[1].count++;
    else if (a <= 2000) amountBuckets[2].count++;
    else if (a <= 5000) amountBuckets[3].count++;
    else if (a <= 10000) amountBuckets[4].count++;
    else amountBuckets[5].count++;
  });

  const profileReady = validated.length >= 100;

  return {
    transactionCount: validated.length,
    averageAmount,
    medianAmount,
    maxAmount,
    minAmount,
    amountStdDev,
    normalAmountMin,
    normalAmountMax,
    normalTimeStart,
    normalTimeEnd,
    averageDailyTransactions,
    hourDistribution,
    dayDistribution,
    frequentRecipients,
    newRecipientRatio: Math.round(newRecipientRatio * 100) / 100,
    knownDevices,
    usualLocation,
    weeklyFrequency,
    amountBuckets,
    profileReady,
    profileStatus: profileReady ? 'READY' : 'SETUP_REQUIRED',
  };
}

function getEmptyProfile() {
  return {
    transactionCount: 0,
    averageAmount: 0,
    medianAmount: 0,
    maxAmount: 0,
    minAmount: 0,
    amountStdDev: 0,
    normalAmountMin: 0,
    normalAmountMax: 0,
    normalTimeStart: 8,
    normalTimeEnd: 22,
    averageDailyTransactions: 0,
    hourDistribution: Array(24).fill(0),
    dayDistribution: Array(7).fill(0),
    frequentRecipients: [],
    newRecipientRatio: 0,
    knownDevices: [],
    usualLocation: 'Unknown',
    weeklyFrequency: [],
    amountBuckets: [
      { range: '0-500', count: 0 },
      { range: '500-1K', count: 0 },
      { range: '1K-2K', count: 0 },
      { range: '2K-5K', count: 0 },
      { range: '5K-10K', count: 0 },
      { range: '10K+', count: 0 },
    ],
    profileReady: false,
    profileStatus: 'SETUP_REQUIRED',
  };
}

export default { buildBehaviourProfile };
