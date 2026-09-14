// ============================================
// UPI Sentinel AI — Demo Data Service
// 120+ synthetic transactions for prototype
// ============================================

const RECIPIENTS = [
  { name: 'ABC Stores', upiId: 'abcstores@upi', category: 'shopping' },
  { name: 'XYZ Services', upiId: 'xyzservices@ybl', category: 'services' },
  { name: 'Family Member', upiId: 'family.member@paytm', category: 'personal' },
  { name: 'Utility Payments', upiId: 'utility.pay@upi', category: 'bills' },
  { name: 'Grocery Mart', upiId: 'grocerymart@oksbi', category: 'groceries' },
  { name: 'Petrol Pump', upiId: 'petrolpump@ybl', category: 'fuel' },
  { name: 'Medical Store', upiId: 'medstore@paytm', category: 'medical' },
  { name: 'Coffee House', upiId: 'coffeehouse@upi', category: 'food' },
  { name: 'Restaurant Delight', upiId: 'restaurant@ybl', category: 'food' },
  { name: 'Telecom Bill', upiId: 'telecom@oksbi', category: 'bills' },
  { name: 'Online Shopping', upiId: 'onlineshop@paytm', category: 'shopping' },
  { name: 'Milk Vendor', upiId: 'milkvendor@upi', category: 'groceries' },
];

const NORMAL_AMOUNTS = [50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000];
const DEVICES = ['Samsung Galaxy S23', 'iPhone 14', 'OnePlus 11', 'Redmi Note 12', 'Pixel 7'];
const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi'];
const STATUSES = ['Successful', 'Successful', 'Successful', 'Successful', 'Successful', 'Pending', 'Failed'];

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) / 10) * 10;
}

function generateTxnId() {
  return 'TXN' + Math.random().toString(36).substr(2, 12).toUpperCase();
}

function generateUTR() {
  return Math.floor(Math.random() * 900000000000) + 100000000000;
}

function randomHour(normalRange = true) {
  if (normalRange) {
    return Math.floor(Math.random() * 14) + 8; // 8 AM - 10 PM
  }
  return Math.floor(Math.random() * 5) + 1; // 1 AM - 5 AM
}

function randomMinute() {
  return Math.floor(Math.random() * 60);
}

function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(hour, minute) {
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export function generateHistoricalTransactions(count = 120) {
  const transactions = [];
  const today = new Date(2026, 7, 24); // Aug 24, 2026

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // last 3 months
    const txnDate = new Date(today);
    txnDate.setDate(txnDate.getDate() - daysAgo);

    const recipient = randomPick(RECIPIENTS);
    const hour = randomHour(true);
    const minute = randomMinute();
    const amount = randomPick(NORMAL_AMOUNTS);

    transactions.push({
      id: `hist-${i + 1}`,
      amount,
      date: formatDate(txnDate),
      dateISO: formatDateISO(txnDate),
      time: formatTime(hour, minute),
      hour,
      minute,
      sender: 'Demo User',
      senderUpi: 'demouser@upi',
      receiver: recipient.name,
      receiverUpi: recipient.upiId,
      transactionId: generateTxnId(),
      utr: generateUTR().toString(),
      status: randomPick(STATUSES),
      merchant: recipient.name,
      category: recipient.category,
      device: randomPick(DEVICES),
      location: 'Chennai',
      sourceType: 'demo',
      isDemo: true,
      validated: true,
      riskScore: null,
      riskLevel: null,
      riskType: null,
      createdAt: txnDate.toISOString(),
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

  return transactions;
}

// Three built-in demo scenarios
export const DEMO_SCENARIOS = [
  {
    id: 'demo-normal',
    name: 'Normal Transaction',
    description: 'A typical low-risk transaction matching historical behaviour.',
    transaction: {
      id: 'demo-txn-normal',
      amount: 1500,
      date: '24 Aug 2026',
      dateISO: '2026-08-24',
      time: '2:30 PM',
      hour: 14,
      minute: 30,
      sender: 'Demo User',
      senderUpi: 'demouser@upi',
      receiver: 'ABC Stores',
      receiverUpi: 'abcstores@upi',
      transactionId: 'TXNDEMO001NORMAL',
      utr: '324567891234',
      status: 'Successful',
      merchant: 'ABC Stores',
      category: 'shopping',
      device: 'Samsung Galaxy S23',
      location: 'Chennai',
      sourceType: 'demo',
      isDemo: true,
      validated: true,
    },
    expectedRisk: {
      score: 12,
      level: 'LOW',
      type: 'Normal Transaction',
      factors: [
        { name: 'Known Recipient', contribution: 0, description: 'ABC Stores is a frequent recipient' },
        { name: 'Normal Amount', contribution: 2, description: '₹1,500 is within normal range (₹50 – ₹3,000)' },
        { name: 'Normal Time', contribution: 0, description: '2:30 PM is within normal hours (8 AM – 10 PM)' },
        { name: 'Known Device', contribution: 0, description: 'Samsung Galaxy S23 is previously seen' },
        { name: 'Normal Frequency', contribution: 5, description: 'Transaction frequency is consistent' },
        { name: 'Behaviour Match', contribution: 5, description: 'Overall behaviour matches profile' },
      ],
      recommendation: 'No significant suspicious indicators were detected by the current prototype.'
    }
  },
  {
    id: 'demo-high-value',
    name: 'High-Value Unusual Transaction',
    description: 'A large transaction to a new recipient at an unusual time.',
    transaction: {
      id: 'demo-txn-highval',
      amount: 25000,
      date: '24 Aug 2026',
      dateISO: '2026-08-24',
      time: '2:15 AM',
      hour: 2,
      minute: 15,
      sender: 'Demo User',
      senderUpi: 'demouser@upi',
      receiver: 'UNKNOWN_RECIPIENT',
      receiverUpi: 'unknown.recv@ybl',
      transactionId: 'TXNDEMO002HIGHVAL',
      utr: '876543219876',
      status: 'Successful',
      merchant: 'Unknown',
      category: 'unknown',
      device: 'New Device X',
      location: 'Delhi',
      sourceType: 'demo',
      isDemo: true,
      validated: true,
    },
    expectedRisk: {
      score: 92,
      level: 'CRITICAL',
      type: 'Combined High-Risk Pattern',
      factors: [
        { name: 'Unusual Amount', contribution: 24, description: '₹25,000 far exceeds normal range (avg ₹1,420)' },
        { name: 'New Recipient', contribution: 18, description: 'UNKNOWN_RECIPIENT has never appeared before' },
        { name: 'Unusual Time', contribution: 15, description: '2:15 AM is outside normal hours (8 AM – 10 PM)' },
        { name: 'New Device', contribution: 12, description: 'New Device X has not been seen before' },
        { name: 'Location Anomaly', contribution: 10, description: 'Transaction from Delhi, usual location is Chennai' },
        { name: 'Behaviour Deviation', contribution: 13, description: 'Overall behaviour significantly deviates from profile' },
      ],
      recommendation: 'Verify the recipient. Do not approve an unfamiliar transaction. If you did not initiate the transaction, contact your bank/payment provider through an official channel. Review recent account activity.'
    }
  },
  {
    id: 'demo-rapid',
    name: 'Rapid Repeated Transactions',
    description: 'Multiple transactions to the same recipient within minutes.',
    relatedTransactions: [
      {
        id: 'demo-txn-rapid-1',
        amount: 1000,
        date: '24 Aug 2026',
        dateISO: '2026-08-24',
        time: '10:20 AM',
        hour: 10,
        minute: 20,
        sender: 'Demo User',
        senderUpi: 'demouser@upi',
        receiver: 'NEW USER',
        receiverUpi: 'newuser@paytm',
        transactionId: 'TXNDEMO003RAP1',
        utr: '111222333444',
        status: 'Successful',
        merchant: 'New User',
        category: 'unknown',
        device: 'Samsung Galaxy S23',
        location: 'Chennai',
        sourceType: 'demo',
        isDemo: true,
        validated: true,
      },
      {
        id: 'demo-txn-rapid-2',
        amount: 2000,
        date: '24 Aug 2026',
        dateISO: '2026-08-24',
        time: '10:21 AM',
        hour: 10,
        minute: 21,
        sender: 'Demo User',
        senderUpi: 'demouser@upi',
        receiver: 'NEW USER',
        receiverUpi: 'newuser@paytm',
        transactionId: 'TXNDEMO003RAP2',
        utr: '111222333445',
        status: 'Successful',
        merchant: 'New User',
        category: 'unknown',
        device: 'Samsung Galaxy S23',
        location: 'Chennai',
        sourceType: 'demo',
        isDemo: true,
        validated: true,
      },
    ],
    transaction: {
      id: 'demo-txn-rapid-3',
      amount: 2000,
      date: '24 Aug 2026',
      dateISO: '2026-08-24',
      time: '10:22 AM',
      hour: 10,
      minute: 22,
      sender: 'Demo User',
      senderUpi: 'demouser@upi',
      receiver: 'NEW USER',
      receiverUpi: 'newuser@paytm',
      transactionId: 'TXNDEMO003RAP3',
      utr: '111222333446',
      status: 'Successful',
      merchant: 'New User',
      category: 'unknown',
      device: 'Samsung Galaxy S23',
      location: 'Chennai',
      sourceType: 'demo',
      isDemo: true,
      validated: true,
    },
    expectedRisk: {
      score: 82,
      level: 'CRITICAL',
      type: 'Repeated Rapid Transaction',
      factors: [
        { name: 'Rapid Repeated Transaction', contribution: 22, description: '3 transactions to same recipient within 2 minutes' },
        { name: 'New Recipient', contribution: 18, description: 'NEW USER has never appeared before' },
        { name: 'Repeated Amount Pattern', contribution: 12, description: 'Repeated ₹2,000 amounts detected' },
        { name: 'Frequency Anomaly', contribution: 15, description: '3 transactions in 2 minutes is abnormal' },
        { name: 'Behaviour Deviation', contribution: 15, description: 'Overall pattern deviates from profile' },
      ],
      recommendation: 'Rapid repeated transaction pattern detected. Verify the recipient. Do not approve an unfamiliar transaction. If you did not initiate these transactions, contact your bank/payment provider through an official channel.'
    }
  }
];

export function generateMockOCRResult(scenario = 'normal') {
  const scenarios = {
    normal: {
      amount: '₹4,000',
      amountNum: 4000,
      date: '24 Aug 2026',
      time: '10:42 AM',
      recipient: 'ABC STORES',
      upiId: 'abcstores@upi',
      transactionId: 'TXN987654321',
      status: 'Successful',
      confidence: 0.94,
    },
    suspicious: {
      amount: '₹25,000',
      amountNum: 25000,
      date: '24 Aug 2026',
      time: '2:15 AM',
      recipient: 'UNKNOWN_RECIPIENT',
      upiId: 'unknown.recv@ybl',
      transactionId: 'TXN123456789',
      status: 'Successful',
      confidence: 0.91,
    },
    rapid: {
      amount: '₹2,000',
      amountNum: 2000,
      date: '24 Aug 2026',
      time: '10:22 AM',
      recipient: 'NEW USER',
      upiId: 'newuser@paytm',
      transactionId: 'TXN555666777',
      status: 'Successful',
      confidence: 0.88,
    }
  };
  return scenarios[scenario] || scenarios.normal;
}

// Summary stats helper
export function computeDemoStats(transactions) {
  const validated = transactions.filter(t => t.validated);
  const amounts = validated.map(t => t.amount);
  const total = amounts.reduce((a, b) => a + b, 0);

  return {
    totalTransactions: transactions.length,
    validatedTransactions: validated.length,
    averageAmount: Math.round(total / amounts.length),
    medianAmount: amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)],
    maxAmount: Math.max(...amounts),
    minAmount: Math.min(...amounts),
    totalAmount: total,
  };
}

export default {
  generateHistoricalTransactions,
  DEMO_SCENARIOS,
  generateMockOCRResult,
  computeDemoStats,
};
