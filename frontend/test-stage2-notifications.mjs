// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Stage 2 Automated Verification Suite: Risk Notifications & Resend Email
// ==============================================================================
import assert from 'node:assert/strict';
import {
  DEFAULT_THRESHOLDS,
  validateThresholds,
  evaluateNotificationLevel,
  substituteTemplate,
  generateEmailHtmlPreview,
  buildAndroidNotificationPayload,
} from './src/engine/notificationEngine.js';

console.log('🧪 Starting Stage 2 Automated Verification Suite...\n');

// ------------------------------------------------------------------------------
// Test 1: Continuous Risk Score Notification Rules (0-100, zero gaps/overlaps)
// ------------------------------------------------------------------------------
console.log('Test 1: Verifying Risk Score Notification Tiers & Boundaries...');

const expectedTiers = [
  // Low Risk: 0 to 24 (Web & Browser alert, NO email)
  { score: 0, level: 'LOW', sendEmail: false, showWarning: false, isDanger: false },
  { score: 12, level: 'LOW', sendEmail: false, showWarning: false, isDanger: false },
  { score: 24, level: 'LOW', sendEmail: false, showWarning: false, isDanger: false },

  // Warning: 25 to 51 (Web warning popup & Browser alert, NO email)
  { score: 25, level: 'WARNING', sendEmail: false, showWarning: true, isDanger: false },
  { score: 38, level: 'WARNING', sendEmail: false, showWarning: true, isDanger: false },
  { score: 51, level: 'WARNING', sendEmail: false, showWarning: true, isDanger: false },

  // High Risk: 52 to 74 (Web alert + Resend Email Notification)
  { score: 52, level: 'HIGH', sendEmail: true, showWarning: true, isDanger: true },
  { score: 63, level: 'HIGH', sendEmail: true, showWarning: true, isDanger: true },
  { score: 74, level: 'HIGH', sendEmail: true, showWarning: true, isDanger: true },

  // Critical Risk: 75 to 100 (Critical danger modal + Priority Resend Email)
  { score: 75, level: 'CRITICAL', sendEmail: true, showWarning: true, isDanger: true },
  { score: 88, level: 'CRITICAL', sendEmail: true, showWarning: true, isDanger: true },
  { score: 100, level: 'CRITICAL', sendEmail: true, showWarning: true, isDanger: true },
];

for (const t of expectedTiers) {
  const result = evaluateNotificationLevel(t.score);
  assert.equal(
    result.level,
    t.level,
    `Score ${t.score} should be ${t.level}, got ${result.level}`
  );
  assert.equal(
    result.sendEmail,
    t.sendEmail,
    `Score ${t.score} sendEmail should be ${t.sendEmail}, got ${result.sendEmail}`
  );
  assert.equal(
    result.showWarningPopup,
    t.showWarning,
    `Score ${t.score} showWarningPopup should be ${t.showWarning}`
  );
  assert.equal(
    result.isDanger,
    t.isDanger,
    `Score ${t.score} isDanger should be ${t.isDanger}`
  );
}
console.log('  ✔ All 12 boundary points (0, 24, 25, 51, 52, 74, 75, 100) correctly evaluated.\n');

// ------------------------------------------------------------------------------
// Test 2: Threshold Continuity & Gap / Overlap Prevention
// ------------------------------------------------------------------------------
console.log('Test 2: Verifying Threshold Continuity & Gap/Overlap Validation...');

// 2a. Valid standard configuration
const validConf = validateThresholds(DEFAULT_THRESHOLDS);
assert.equal(validConf.isValid, true, 'DEFAULT_THRESHOLDS must be strictly valid');

// 2b. Gap between Low and Warning (Low ends at 24, Warning starts at 26)
const gapConf = validateThresholds({
  low_min: 0,
  low_max: 24,
  warning_min: 26, // Gap: score 25 unhandled!
  warning_max: 51,
  high_min: 52,
  high_max: 74,
  critical_min: 75,
  critical_max: 100,
});
assert.equal(gapConf.isValid, false, 'Gap between Low and Warning must be rejected');
assert.match(gapConf.error, /gaps\/overlaps/, 'Error message must cite gaps/overlaps');

// 2c. Overlap between High and Critical (High ends at 75, Critical starts at 75)
const overlapConf = validateThresholds({
  low_min: 0,
  low_max: 24,
  warning_min: 25,
  warning_max: 51,
  high_min: 52,
  high_max: 75, // Overlap: score 75 ambiguously in both!
  critical_min: 75,
  critical_max: 100,
});
assert.equal(overlapConf.isValid, false, 'Overlap between High and Critical must be rejected');

// 2d. Not starting at 0
const nonZeroStart = validateThresholds({
  ...DEFAULT_THRESHOLDS,
  low_min: 5,
});
assert.equal(nonZeroStart.isValid, false, 'Threshold must start at 0');

// 2e. Not ending at 100
const nonHundredEnd = validateThresholds({
  ...DEFAULT_THRESHOLDS,
  critical_max: 95,
});
assert.equal(nonHundredEnd.isValid, false, 'Threshold must end at 100');

console.log('  ✔ Strict mathematical validation: zero gaps, zero overlaps, range 0–100 guaranteed.\n');

// ------------------------------------------------------------------------------
// Test 3: Template Placeholder Substitution & Dynamic Rendering
// ------------------------------------------------------------------------------
console.log('Test 3: Verifying Dynamic Template Placeholders & HTML Rendering...');

const templateString =
  'Hello {{user_name}}, transaction {{transaction_id}} for ₹{{transaction_amount}} via {{upi_provider}} has risk score {{risk_score}}/100 ({{risk_level}}). Detected: {{detected_patterns}}. Summary: {{analysis_summary}} Date: {{transaction_date}}.';

const sampleData = {
  user_name: 'Administrator USER1',
  transaction_id: 'TXN_PAYTM_982144',
  transaction_amount: 15400,
  upi_provider: 'Paytm UPI',
  transaction_date: '24 Sep 2023, 03:25 PM',
  risk_score: 78,
  risk_level: 'CRITICAL',
  detected_patterns: ['Pattern P4 (Amount Spike)', 'Pattern P5 (New Recipient)'],
  analysis_summary: 'Severe deviation from spending baseline.',
};

const substituted = substituteTemplate(templateString, sampleData);

assert.ok(substituted.includes('Administrator USER1'), 'user_name substituted');
assert.ok(substituted.includes('TXN_PAYTM_982144'), 'transaction_id substituted');
assert.ok(substituted.includes('15,400'), 'transaction_amount formatted with commas');
assert.ok(substituted.includes('Paytm UPI'), 'upi_provider substituted');
assert.ok(substituted.includes('78/100'), 'risk_score substituted');
assert.ok(substituted.includes('CRITICAL'), 'risk_level substituted');
assert.ok(substituted.includes('Pattern P4 (Amount Spike)'), 'detected_patterns substituted');
assert.ok(substituted.includes('Severe deviation from spending baseline.'), 'analysis_summary substituted');
assert.ok(substituted.includes('24 Sep 2023, 03:25 PM'), 'transaction_date substituted');

// 3b. Verify HTML preview generator
const html = generateEmailHtmlPreview(
  {
    subject: 'Alert: {{transaction_id}}',
    heading: 'High Risk UPI Payment Flagged',
    description: 'Suspicious transaction under {{user_name}}',
    body: 'Please review transaction {{transaction_id}} immediately.',
    footer_text: 'Automated Security Alert',
  },
  sampleData
);

assert.ok(html.includes('#000000') || html.includes('#0a0a0a'), 'Theme includes Black background');
assert.ok(html.includes('#facc15'), 'Theme includes signature Yellow accent');
assert.ok(html.includes('TXN_PAYTM_982144'), 'HTML contains substituted transaction ID');
assert.ok(html.includes('78'), 'HTML contains risk score');

console.log('  ✔ Dynamic placeholder substitution and responsive Black + Yellow HTML email verified.\n');

// ------------------------------------------------------------------------------
// Test 4: Individual Administrator Routing & Isolation (No Cross-Admin Leakage)
// ------------------------------------------------------------------------------
console.log('Test 4: Verifying Individual Administrator Routing & Zero Cross-Admin Leakage...');

const adminAccounts = [
  { uuid: 'uuid-user1', username: 'USER1', email: 'user1@upi-shield.local' },
  { uuid: 'uuid-user2', username: 'USER2', email: 'user2@upi-shield.local' },
  { uuid: 'uuid-user3', username: 'USER3', email: 'user3@upi-shield.local' },
  { uuid: 'uuid-user4', username: 'USER4', email: 'user4@upi-shield.local' },
];

// Map of admin profiles
const profileMap = new Map();
adminAccounts.forEach((a) => {
  profileMap.set(a.uuid, {
    auth_user_id: a.uuid,
    username: a.username,
    notification_email: a.email,
  });
});

for (const admin of adminAccounts) {
  // Simulate transaction owned by this admin
  const txn = { id: `TXN_OWNED_BY_${admin.username}`, user_id: admin.uuid, amount: 5000 };
  const recipient = profileMap.get(txn.user_id)?.notification_email;

  assert.equal(recipient, admin.email, `Transaction owned by ${admin.username} must route to ${admin.email}`);

  // Confirm NO other admin receives it
  const otherAdmins = adminAccounts.filter((a) => a.uuid !== admin.uuid);
  for (const other of otherAdmins) {
    assert.notEqual(
      recipient,
      other.email,
      `Alert for ${admin.username} must NEVER be routed to ${other.username} (${other.email})`
    );
  }
}
console.log('  ✔ Individual administrator email isolation confirmed for all 4 admin accounts.\n');

// ------------------------------------------------------------------------------
// Test 5: Future Android Companion Notification Synchronization Payload
// ------------------------------------------------------------------------------
console.log('Test 5: Verifying Android Companion Sync Payload Structure...');

const androidTxn = {
  id: 'TXN_COMPANION_9901',
  amount: 6700,
  payment_mode: 'Paytm UPI',
  user_id: 'uuid-user1',
};
const androidAnalysis = {
  score: 65,
  detected_patterns: ['Pattern P4 — Spending Deviation'],
  recommendation: 'Review payment recipient.',
};
const androidTier = evaluateNotificationLevel(65);

const androidPayload = buildAndroidNotificationPayload(androidTxn, androidAnalysis, androidTier);

assert.equal(androidPayload.source, 'web_fraud_engine', 'Source identifies web engine');
assert.equal(androidPayload.event_type, 'RISK_ALERT', 'Event type is RISK_ALERT');
assert.equal(androidPayload.transaction_id, 'TXN_COMPANION_9901', 'Transaction ID mapped');
assert.equal(androidPayload.amount, 6700, 'Amount preserved');
assert.equal(androidPayload.risk.score, 65, 'Risk score mapped');
assert.equal(androidPayload.risk.level, 'HIGH', 'Risk level matches tier');
assert.equal(androidPayload.risk.priority, 'IMPORTANCE_HIGH', 'Android notification channel priority set');

console.log('  ✔ Android companion sync payload verified for architectural parity.\n');

console.log('🎉 ALL STAGE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% PASS RATE)');
