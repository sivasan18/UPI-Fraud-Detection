// ============================================
// UPI Sentinel AI — Behaviour Profile Engine
// ============================================

export function buildBehaviourProfile(transactions) {
  if (!transactions || transactions.length === 0) {
    return getEmptyProfile();
  }

  const validated = transactions.filter(t => t.validated);
  if (validated.length === 0) return getEmptyProfile();

  const amounts = validated.map(t => t.amount);
  const hours = validated.map(t => t.hour);
  const sortedAmounts = [...amounts].sort((a, b) => a - b);

  // Amount stats
  const sum = amounts.reduce((a, b) => a + b, 0);
  const averageAmount = Math.round(sum / amounts.length);
  const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);
  const amountStdDev = Math.round(
    Math.sqrt(amounts.reduce((acc, a) => acc + Math.pow(a - averageAmount, 2), 0) / amounts.length)
  );

  // Time stats
  const sortedHours = [...hours].sort((a, b) => a - b);
  const normalTimeStart = sortedHours[Math.floor(sortedHours.length * 0.05)] || 8;
  const normalTimeEnd = sortedHours[Math.floor(sortedHours.length * 0.95)] || 22;

  // Hour distribution
  const hourDistribution = Array(24).fill(0);
  hours.forEach(h => hourDistribution[h]++);

  // Day distribution
  const dayDistribution = Array(7).fill(0);
  validated.forEach(t => {
    const d = new Date(t.dateISO);
    dayDistribution[d.getDay()]++;
  });

  // Daily frequency
  const dateMap = {};
  validated.forEach(t => {
    dateMap[t.dateISO] = (dateMap[t.dateISO] || 0) + 1;
  });
  const dailyCounts = Object.values(dateMap);
  const averageDailyTransactions = Math.round(
    dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length
  );

  // Recipient frequency
  const recipientMap = {};
  validated.forEach(t => {
    const key = t.receiver || 'Unknown';
    if (!recipientMap[key]) {
      recipientMap[key] = { name: key, upiId: t.receiverUpi, count: 0, totalAmount: 0 };
    }
    recipientMap[key].count++;
    recipientMap[key].totalAmount += t.amount;
  });

  const frequentRecipients = Object.values(recipientMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // New recipient ratio
  const uniqueRecipients = Object.keys(recipientMap).length;
  const totalTxns = validated.length;
  const newRecipientRatio = uniqueRecipients / totalTxns;

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
  const usualLocation = Object.entries(locationMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Amount range (5th to 95th percentile)
  const normalAmountMin = sortedAmounts[Math.floor(sortedAmounts.length * 0.05)] || minAmount;
  const normalAmountMax = sortedAmounts[Math.floor(sortedAmounts.length * 0.95)] || maxAmount;

  // Weekly frequency
  const weekMap = {};
  validated.forEach(t => {
    const d = new Date(t.dateISO);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekMap[key] = (weekMap[key] || 0) + 1;
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
