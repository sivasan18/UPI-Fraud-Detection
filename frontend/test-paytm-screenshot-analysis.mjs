// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Method A: End-to-End Browser Upload Analysis for Paytm Transaction Screenshot
// Screenshot: media_1795255561386_4afc4fd8.jpg (Paytm ₹2,300 payment)
// ==============================================================================
import assert from 'node:assert/strict';
import {
  detectUpiApp,
  extractPaytmLayout,
} from './src/engine/ocrEngine.js';
import {
  evaluateTransactionRisk,
  getRiskLevel,
} from './src/engine/riskEngine.js';
import {
  evaluateNotificationLevel,
} from './src/engine/notificationEngine.js';

console.log('🔍 Executing Method A Analysis on Uploaded Paytm Screenshot...\n');

// 1. Text extracted from OCR on the uploaded Paytm screenshot
const rawOcrText = `
9:01 m
Vol) 85%
Paid Successfully
Share Help
Amount
₹2,300
Rupees Two Thousand Three Hundred
Only
Split this Payment
Add Tag
To
Munis Azhar
UPI ID: paytm-70375703@paytm
From
Hemant Dewani
HDFC Bank - 5240
Check Balance
Paid at 03:25 PM, 24 Sep 2023
Order ID: 202309241525070068 Copy
UPI Ref No: 326721250950 Copy
Exclusive rewards
are around the corner
`;

console.log('Step 1: UPI Provider Detection & Confidence...');
const detectedApp = detectUpiApp(rawOcrText);
console.log('  App Detected:  ', detectedApp.name);
console.log('  Confidence:    ', `${(detectedApp.confidence * 100).toFixed(1)}%`);
assert.equal(detectedApp.app, 'paytm');

console.log('\nStep 2: Field Extraction via Layout Parser...');
const lines = rawOcrText.split('\n').map((l) => l.trim()).filter(Boolean);
const extracted = extractPaytmLayout(lines, rawOcrText);

console.log('  Amount:          ₹' + extracted.amount);
console.log('  Status:          ' + extracted.status);
console.log('  Receiver Name:   ' + extracted.receiver);
console.log('  Receiver UPI ID: ' + extracted.receiver_upi);
console.log('  Sender Name:     ' + extracted.sender);
console.log('  Bank / Account:  ' + extracted.bank);
console.log('  Date:            ' + extracted.date);
console.log('  Time:            ' + extracted.time);
console.log('  Order ID:        ' + extracted.order_id);
console.log('  UPI Ref / UTR:   ' + extracted.utr);
console.log('  Payment Mode:    ' + extracted.payment_mode);

assert.equal(extracted.amount, 2300);
assert.equal(extracted.receiver, 'Munis Azhar');
assert.equal(extracted.receiver_upi, 'paytm-70375703@paytm');
assert.equal(extracted.sender, 'Hemant Dewani');
assert.equal(extracted.utr, '326721250950');
assert.equal(extracted.order_id, '202309241525070068');

console.log('\nStep 3: Fraud Detection & Risk Assessment Engine (13 Behavioral Patterns)...');
const history = [
  { amount: 500, receiver: 'Grocery Store', receiver_upi: 'store@upi', date: '2023-09-20', time: '14:00', hour: 14 },
  { amount: 1200, receiver: 'Electricity Board', receiver_upi: 'tneb@upi', date: '2023-09-21', time: '11:30', hour: 11 },
  { amount: 800, receiver: 'Fuel Station', receiver_upi: 'fuel@upi', date: '2023-09-22', time: '18:15', hour: 18 },
  { amount: 1500, receiver: 'Munis Azhar', receiver_upi: 'paytm-70375703@paytm', date: '2023-09-23', time: '16:00', hour: 16 },
];

const profile = {
  average_amount: 1500,
  max_amount: 5000,
  known_merchants: ['Munis Azhar'],
  usual_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  status: 'Active',
};

const analysis = evaluateTransactionRisk(
  {
    amount: extracted.amount,
    receiver: extracted.receiver,
    receiver_upi: extracted.receiver_upi,
    sender: extracted.sender,
    time: extracted.time,
    date: extracted.date,
    payment_mode: extracted.payment_mode,
  },
  profile,
  history
);

console.log('  Risk Score:           ' + analysis.score + ' / 100');
console.log('  Risk Classification:  ' + analysis.level);
console.log('  Risk Label:           ' + analysis.risk_label);
console.log('  Flagged Patterns:     ' + (analysis.detected_patterns?.length ? analysis.detected_patterns.join(', ') : 'None (Within normal spending profile)'));
console.log('  Recommendation:       ' + analysis.recommendation);

console.log('\nStep 4: Email Notification Decision...');
const notifDecision = evaluateNotificationLevel(analysis.score);
console.log('  Notification Level:   ' + notifDecision.level);
console.log('  Send Email Alert:     ' + (notifDecision.sendEmail ? 'YES (High/Critical alert)' : 'NO (Score < 52 within normal boundaries)'));
console.log('  Display Warning:      ' + notifDecision.showWarningPopup);

console.log('\nStep 5: High-Risk Attack Simulation on this Transaction (Burst / Account Draining / P12)...');
const highRiskTxn = {
  amount: 25000,
  receiver: 'Munis Azhar',
  receiver_upi: 'paytm-70375703@paytm',
  sender: 'Hemant Dewani',
  time: '02:30 am',
  date: '24 Sep 2023',
};
const highRiskAnalysis = evaluateTransactionRisk(highRiskTxn, profile, history);
const highRiskNotif = evaluateNotificationLevel(highRiskAnalysis.score);

console.log('  Simulated Attack Score: ' + highRiskAnalysis.score + ' / 100 (' + highRiskAnalysis.level + ')');
console.log('  Simulated Patterns:     ' + highRiskAnalysis.detected_patterns.join(', '));
console.log('  Triggers Resend Email:  ' + highRiskNotif.sendEmail + ' (Level: ' + highRiskNotif.level + ')');
assert.equal(highRiskNotif.sendEmail, true, 'High/Critical risk must trigger email alert');

console.log('\n🎉 METHOD A PAYTM TRANSACTION PROCESSING & RISK ASSESSMENT VERIFIED (100%)!\n');
