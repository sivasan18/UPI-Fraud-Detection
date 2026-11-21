// ==============================================================================
// Comprehensive OCR Engine Test Suite for all 4 UPI Providers
// Google Pay, PhonePe, BHIM, and Paytm
// ==============================================================================
import assert from 'node:assert/strict';
import {
  detectUpiApp,
  cleanAmountValue,
  parseDateTimeStrings,
  extractGooglePayLayout,
  extractPhonePeLayout,
  extractBhimLayout,
  extractPaytmLayout,
  extractGeneralLayout,
} from './src/engine/ocrEngine.js';

console.log('--- Starting UPI OCR Engine Comprehensive Tests ---');

// ------------------------------------------------------------------------------
// Test 1: Paytm OCR Extraction
// ------------------------------------------------------------------------------
console.log('\n[Test 1] Paytm Layout & App Detection:');
const paytmText = `
9.01 m
Bl Bl 85%
Share Help
4 Paid Successfully
Amount
¥2,300 &
Rupees Two Thousand Three Hundred
Only
Split this Payment ]   © Add Tog
To
Munis Azhar
UPI ID: paytm-70375703@paytm
From
Hemant Dewani
HOFC Bank - 5240
Check Balance
Paid at 03:25 PM, 24 Sep 2023
Order ID: 202309241525070068 Copy
UPI Ref No: 326721250950 Copy
EU
Exclusive rewards
are around the corner
`;

const paytmApp = detectUpiApp(paytmText);
console.log('  Paytm detected app:', paytmApp);
assert.equal(paytmApp.app, 'paytm', 'Should detect app as paytm');
assert.equal(paytmApp.name, 'Paytm UPI', 'Display name should be Paytm UPI');
assert.ok(paytmApp.confidence >= 0.8, 'Confidence should be >= 0.8');

const paytmLines = paytmText.split('\n').map((l) => l.trim()).filter(Boolean);
const paytmExtracted = extractPaytmLayout(paytmLines, paytmText);
console.log('  Paytm Extracted Data:', paytmExtracted);

assert.equal(paytmExtracted.amount, 2300, 'Amount should be 2300');
assert.equal(paytmExtracted.receiver, 'Munis Azhar', 'Receiver should be Munis Azhar');
assert.equal(paytmExtracted.receiver_upi, 'paytm-70375703@paytm', 'Receiver UPI should match');
assert.equal(paytmExtracted.sender, 'Hemant Dewani', 'Sender should be Hemant Dewani');
assert.equal(paytmExtracted.bank, 'HDFC Bank - 5240', 'Bank should be HDFC Bank - 5240');
assert.equal(paytmExtracted.utr, '326721250950', 'UTR should be 326721250950');
assert.equal(paytmExtracted.order_id, '202309241525070068', 'Order ID should be 202309241525070068');
assert.equal(paytmExtracted.transaction_id, '326721250950', 'Transaction ID should be UTR');
assert.equal(paytmExtracted.date, '24 Sep 2023', 'Date should be 24 Sep 2023');
assert.equal(paytmExtracted.time, '03:25 pm', 'Time should be 03:25 pm');
assert.equal(paytmExtracted.status, 'Completed', 'Status should be Completed');
assert.equal(paytmExtracted.payment_mode, 'Paytm UPI', 'Payment mode should be Paytm UPI');
console.log('  ✓ Paytm OCR Layout test PASSED');

// ------------------------------------------------------------------------------
// Test 2: Google Pay OCR Extraction
// ------------------------------------------------------------------------------
console.log('\n[Test 2] Google Pay Layout & App Detection:');
const gpayText = `
Google Pay
To: ARULMANI ANBU
arulmani@okhdfcbank
₹4,500
Completed
14 May 2026, 02:45 PM
From: user@okaxis
Google Transaction ID
CICAgKDRx87bZw
UPI Transaction ID: 613589240173
`;

const gpayApp = detectUpiApp(gpayText);
console.log('  Google Pay detected app:', gpayApp);
assert.equal(gpayApp.app, 'googlepay', 'Should detect app as googlepay');

const gpayLines = gpayText.split('\n').map((l) => l.trim()).filter(Boolean);
const gpayExtracted = extractGooglePayLayout(gpayLines, gpayText);
console.log('  Google Pay Extracted Data:', gpayExtracted);

assert.equal(gpayExtracted.amount, 4500, 'Amount should be 4500');
assert.equal(gpayExtracted.receiver, 'ARULMANI ANBU', 'Receiver should be ARULMANI ANBU');
assert.equal(gpayExtracted.receiver_upi, 'arulmani@okhdfcbank', 'Receiver UPI should match');
assert.equal(gpayExtracted.sender_upi, 'user@okaxis', 'Sender UPI should match');
assert.equal(gpayExtracted.date, '14 May 2026', 'Date should be 14 May 2026');
assert.equal(gpayExtracted.payment_mode, 'Google Pay UPI', 'Payment mode should be Google Pay UPI');
console.log('  ✓ Google Pay OCR Layout test PASSED');

// ------------------------------------------------------------------------------
// Test 3: PhonePe OCR Extraction
// ------------------------------------------------------------------------------
console.log('\n[Test 3] PhonePe Layout & App Detection:');
const phonepeText = `
PhonePe
Transfer Details
Transaction Successful
Paid to
Kavitha Raman
kavitha@oksbi
₹3,200
Debited from
State Bank of India
PhonePe Transaction ID
T2605151240192847192039
UTR : 613612849102
15 May 2026, 12:40 PM
`;

const phonepeApp = detectUpiApp(phonepeText);
console.log('  PhonePe detected app:', phonepeApp);
assert.equal(phonepeApp.app, 'phonepe', 'Should detect app as phonepe');

const phonepeLines = phonepeText.split('\n').map((l) => l.trim()).filter(Boolean);
const phonepeExtracted = extractPhonePeLayout(phonepeLines, phonepeText);
console.log('  PhonePe Extracted Data:', phonepeExtracted);

assert.equal(phonepeExtracted.amount, 3200, 'Amount should be 3200');
assert.equal(phonepeExtracted.receiver, 'Kavitha Raman', 'Receiver should be Kavitha Raman');
assert.equal(phonepeExtracted.receiver_upi, 'kavitha@oksbi', 'Receiver UPI should match');
assert.equal(phonepeExtracted.utr, '613612849102', 'UTR should match');
assert.equal(phonepeExtracted.payment_mode, 'PhonePe UPI', 'Payment mode should be PhonePe UPI');
console.log('  ✓ PhonePe OCR Layout test PASSED');

// ------------------------------------------------------------------------------
// Test 4: BHIM UPI OCR Extraction
// ------------------------------------------------------------------------------
console.log('\n[Test 4] BHIM Layout & App Detection:');
const bhimText = `
BHIM
Paid
₹1,850
Banking Name
Suresh Kumar
To UPI ID: suresh@upi
From UPI ID: sender@upi
UPI Ref ID: 613794120381
INDIAN OVERSEAS BANK
16 May 2026, 10:15 AM
`;

const bhimApp = detectUpiApp(bhimText);
console.log('  BHIM detected app:', bhimApp);
assert.equal(bhimApp.app, 'bhim', 'Should detect app as bhim');

const bhimLines = bhimText.split('\n').map((l) => l.trim()).filter(Boolean);
const bhimExtracted = extractBhimLayout(bhimLines, bhimText);
console.log('  BHIM Extracted Data:', bhimExtracted);

assert.equal(bhimExtracted.amount, 1850, 'Amount should be 1850');
assert.equal(bhimExtracted.receiver, 'Suresh Kumar', 'Receiver should be Suresh Kumar');
assert.equal(bhimExtracted.bank, 'INDIAN OVERSEAS BANK', 'Bank should match');
assert.equal(bhimExtracted.payment_mode, 'BHIM UPI', 'Payment mode should be BHIM UPI');
console.log('  ✓ BHIM OCR Layout test PASSED');

// ------------------------------------------------------------------------------
// Test 5: Amount Cleaning & Edge Cases
// ------------------------------------------------------------------------------
console.log('\n[Test 5] Amount cleaning edge cases:');
assert.equal(cleanAmountValue('₹2,300'), 2300);
assert.equal(cleanAmountValue('¥2,300 &'), 2300);
assert.equal(cleanAmountValue('Rs. 15,000.50'), 15000.5);
assert.equal(cleanAmountValue('INR 500'), 500);
assert.equal(cleanAmountValue('Paid ₹1,200'), 1200);
assert.equal(cleanAmountValue('+91 9876543210'), null);
assert.equal(cleanAmountValue('10 Sep 2026'), null);
assert.equal(cleanAmountValue('12:06 pm'), null);
console.log('  ✓ cleanAmountValue tests PASSED');

console.log('\n=== ALL 4 UPI PROVIDER OCR TESTS COMPLETED SUCCESSFULLY! ===\n');
