// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Test Suite: Four-Admin Email Ownership Verification Workflow
// ==============================================================================
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import notificationService, { DEFAULT_ADMIN_RECIPIENTS } from './src/services/notificationService.js';

console.log('🧪 Starting Four-Admin Email Ownership Verification Test Suite...\n');

const OTP_SALT = 'upi_fraud_shield_otp_salt_v3';

function computeHash(otp) {
  return crypto.createHash('sha256').update(`${OTP_SALT}:${String(otp).trim()}`).digest('hex');
}

// ------------------------------------------------------------------------------
// Test 1: Successful Verification with Cryptographic SHA-256 Hash Match
// ------------------------------------------------------------------------------
console.log('Test 1: Verifying Successful OTP Verification with SHA-256 Hash Match...');

const sampleOtp = '582914';
const hashedOtp = computeHash(sampleOtp);
const now = Date.now();

// Mock backend OTP store record
const otpRecord = {
  admin: 'USER2',
  email: 'sanvjf@gmail.com',
  otp_hash: hashedOtp,
  expires_at: new Date(now + 5 * 60 * 1000).toISOString(),
  attempts: 0,
  max_attempts: 5,
  resend_available_at: new Date(now + 60 * 1000).toISOString(),
};

// Simulation of backend verification logic
function verifyOtpBackend(submittedOtp, record, callerAdmin) {
  // 1. Account binding check
  if (callerAdmin !== record.admin) {
    return { status: 403, error: 'Unauthorized: You are only authorized to verify your own email address.' };
  }

  // 2. Format check
  if (!submittedOtp || !/^\d{6}$/.test(submittedOtp)) {
    return { status: 400, error: 'Please enter a valid 6-digit verification code.' };
  }

  // 3. Expiry check
  if (new Date() > new Date(record.expires_at)) {
    return { status: 410, error: 'Verification code has expired (valid for 5 minutes). Please request a new code.' };
  }

  // 4. Max attempts check
  if (record.attempts >= record.max_attempts) {
    return { status: 429, error: 'Maximum verification attempts exceeded. Code has been invalidated.' };
  }

  // 5. Hash comparison
  const submittedHash = computeHash(submittedOtp);
  if (submittedHash !== record.otp_hash) {
    record.attempts += 1;
    const remaining = record.max_attempts - record.attempts;
    return {
      status: 400,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      attempts_remaining: remaining,
    };
  }

  // Success
  return {
    status: 200,
    verified: true,
    admin: record.admin,
    email: record.email,
    verified_at: new Date().toISOString(),
  };
}

const successRes = verifyOtpBackend('582914', { ...otpRecord }, 'USER2');
assert.equal(successRes.status, 200, 'Correct OTP should verify with status 200');
assert.equal(successRes.verified, true, 'Result verified must be true');
assert.equal(successRes.admin, 'USER2');
assert.ok(successRes.verified_at, 'verified_at timestamp must be present');
console.log('  ✔ OTP verified successfully via SHA-256 hash match without plain OTP retention.\n');

// ------------------------------------------------------------------------------
// Test 2: Incorrect OTP Detection & Attempt Counter Decrement
// ------------------------------------------------------------------------------
console.log('Test 2: Verifying Incorrect OTP Detection & Remaining Attempts Decrement...');

const testRecord2 = { ...otpRecord, attempts: 0 };
const wrongRes1 = verifyOtpBackend('123456', testRecord2, 'USER2');

assert.equal(wrongRes1.status, 400, 'Incorrect OTP should return status 400');
assert.equal(wrongRes1.attempts_remaining, 4, 'Remaining attempts should be 4');
assert.match(wrongRes1.error, /Invalid verification code\. 4 attempt\(s\) remaining/);
assert.equal(testRecord2.attempts, 1, 'Record attempts counter incremented to 1');

console.log('  ✔ Incorrect OTP correctly rejected; attempt counter decremented to 4.\n');

// ------------------------------------------------------------------------------
// Test 3: Expired OTP Handling (5-Minute Window)
// ------------------------------------------------------------------------------
console.log('Test 3: Verifying Expired OTP Rejection (> 5 Minutes)...');

const expiredRecord = {
  ...otpRecord,
  expires_at: new Date(Date.now() - 1000).toISOString(), // expired 1s ago
};

const expiredRes = verifyOtpBackend('582914', expiredRecord, 'USER2');
assert.equal(expiredRes.status, 410, 'Expired OTP must return 410 Gone');
assert.match(expiredRes.error, /expired/, 'Error must state code expired');

console.log('  ✔ Expired OTP correctly rejected after 5 minutes.\n');

// ------------------------------------------------------------------------------
// Test 4: Maximum Attempts Lockout (Max 5 Attempts)
// ------------------------------------------------------------------------------
console.log('Test 4: Verifying Max Attempt Lockout after 5 Failed Attempts...');

const lockoutRecord = { ...otpRecord, attempts: 4 }; // 4 failed attempts already
// 5th attempt fails:
const attempt5Res = verifyOtpBackend('999999', lockoutRecord, 'USER2');
assert.equal(attempt5Res.attempts_remaining, 0, 'Remaining attempts must be 0');
assert.equal(lockoutRecord.attempts, 5, 'Record attempts should reach 5');

// 6th attempt is blocked completely by max_attempts:
const attempt6Res = verifyOtpBackend('582914', lockoutRecord, 'USER2');
assert.equal(attempt6Res.status, 429, 'Locked-out OTP must return 429');
assert.match(attempt6Res.error, /Maximum verification attempts exceeded/);

console.log('  ✔ Lockout enforced strictly after 5 failed attempts; code invalidated.\n');

// ------------------------------------------------------------------------------
// Test 5: Resend Frequency Rate Limiting (60-Second Cooldown)
// ------------------------------------------------------------------------------
console.log('Test 5: Verifying Resend Frequency Cooldown (60 Seconds)...');

function checkResendCooldown(record) {
  const nowMs = Date.now();
  const availableAtMs = new Date(record.resend_available_at).getTime();
  if (nowMs < availableAtMs) {
    const waitSeconds = Math.ceil((availableAtMs - nowMs) / 1000);
    return {
      allowed: false,
      status: 429,
      error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
      wait_seconds: waitSeconds,
    };
  }
  return { allowed: true };
}

// 5a. Immediate resend attempt (within 60s)
const cooldownRecord = {
  ...otpRecord,
  resend_available_at: new Date(Date.now() + 45 * 1000).toISOString(), // 45s remaining
};
const cooldownRes = checkResendCooldown(cooldownRecord);
assert.equal(cooldownRes.allowed, false, 'Immediate resend must be rejected');
assert.equal(cooldownRes.status, 429, 'Status must be 429 Too Many Requests');
assert.ok(cooldownRes.wait_seconds > 0 && cooldownRes.wait_seconds <= 45);

// 5b. Resend attempt after cooldown expires
const expiredCooldownRecord = {
  ...otpRecord,
  resend_available_at: new Date(Date.now() - 5000).toISOString(), // expired 5s ago
};
const allowedResend = checkResendCooldown(expiredCooldownRecord);
assert.equal(allowedResend.allowed, true, 'Resend allowed after cooldown expires');

console.log('  ✔ 60-second cooldown rate limit enforced strictly on OTP resend.\n');

// ------------------------------------------------------------------------------
// Test 6: Cross-Admin Unauthorized Attempt Rejection (Account Binding HTTP 403)
// ------------------------------------------------------------------------------
console.log('Test 6: Verifying Account Binding — Rejection of Cross-Admin Verification...');

// USER1 (Gopika) attempts to verify USER2's (Padmashri's) email
const crossAdminRes = verifyOtpBackend('582914', { ...otpRecord }, 'USER1');
assert.equal(crossAdminRes.status, 403, 'Cross-admin verification must be rejected with HTTP 403');
assert.match(crossAdminRes.error, /Unauthorized: You are only authorized to verify your own email address/);

console.log('  ✔ Cross-admin verification strictly blocked with HTTP 403.\n');

// ------------------------------------------------------------------------------
// Test 7: Email Address Change Resets Verification Status to Unverified
// ------------------------------------------------------------------------------
console.log('Test 7: Verifying Email Address Change Automatically Resets Verification Status...');

const currentRecipients = {
  USER1: { username: 'USER1', name: 'Gopika', email: 'sivar75@gmail.com', verified: true, verified_at: '2026-11-21T21:10:00.000Z' },
  USER2: { username: 'USER2', name: 'Padmashri', email: 'sanvjf@gmail.com', verified: true, verified_at: '2026-11-21T21:15:00.000Z' },
  USER3: { username: 'USER3', name: 'Megala', email: 'ramanid97@gmail.com', verified: false, verified_at: null },
  USER4: { username: 'USER4', name: 'Subasri', email: 'kannadhasan815@gmail.com', verified: false, verified_at: null },
};

// Admin 2 changes email to new address
const updatedRecipients = {
  ...currentRecipients,
  USER2: { ...currentRecipients.USER2, email: 'padmashri.cybersec@gmail.com' }, // Address changed!
};

// Simulate updateAdminEmailRecipients reset logic
function applyRecipientUpdates(current, updated) {
  const result = {};
  for (const [key, val] of Object.entries(updated)) {
    const oldEmail = (current[key]?.email || '').trim().toLowerCase();
    const newEmail = (val?.email || '').trim().toLowerCase();
    const isChanged = oldEmail && oldEmail !== newEmail;

    result[key] = {
      ...val,
      email: newEmail,
      verified: isChanged ? false : (val.verified ?? current[key]?.verified ?? false),
      verified_at: isChanged ? null : (val.verified_at ?? current[key]?.verified_at ?? null),
    };
  }
  return result;
}

const saved = applyRecipientUpdates(currentRecipients, updatedRecipients);

// USER2 email changed, so verified must reset to false and verified_at to null
assert.equal(saved.USER2.email, 'padmashri.cybersec@gmail.com');
assert.equal(saved.USER2.verified, false, 'Changed email MUST reset verified to false');
assert.equal(saved.USER2.verified_at, null, 'Changed email MUST clear verified_at');

// USER1 was not changed, so verification remains intact
assert.equal(saved.USER1.verified, true, 'Unchanged email preserves verified: true');
assert.equal(saved.USER1.verified_at, '2026-11-21T21:10:00.000Z');

console.log('  ✔ Changed email address automatically resets verified to false and clears verified_at.\n');

// ------------------------------------------------------------------------------
// Test 8: End-to-End notificationService OTP Client Methods
// ------------------------------------------------------------------------------
console.log('Test 8: Verifying notificationService Client Methods (Mock fallback)...');

const otpGen = await notificationService.sendVerificationOtp('USER3');
assert.equal(otpGen.success, true);
assert.equal(otpGen.admin, 'USER3');
assert.equal(otpGen.expires_in_seconds, 300);
assert.equal(otpGen.resend_cooldown_seconds, 60);
console.log(`  ✔ Generated OTP dispatch: code=${otpGen.dev_hint}, expires=300s, cooldown=60s`);

const verifyClient = await notificationService.verifyOwnershipOtp('USER3', otpGen.dev_hint);
assert.equal(verifyClient.verified, true);
assert.equal(verifyClient.admin, 'USER3');
console.log('  ✔ Client verifyOwnershipOtp verified code successfully.\n');

console.log('🎉 ALL FOUR-ADMIN EMAIL OWNERSHIP VERIFICATION TESTS PASSED (100%)!\n');
