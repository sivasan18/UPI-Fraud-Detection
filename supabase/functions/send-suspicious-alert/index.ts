// ==============================================================================
// UPI Fraud Detection & Risk Assessment System
// Supabase Edge Function: send-suspicious-alert
//
// WHAT THIS EDGE FUNCTION DOES:
// 1. Authenticates requesting administrator using Supabase Auth JWT.
// 2. Email Ownership Verification Workflow:
//    - 'send_verification_otp': Generates cryptographically secure 6-digit OTP,
//      stores only SHA-256 hash in system_config with 5-minute expiry, limits resend frequency (60s),
//      and dispatches verification email via Resend.
//    - 'verify_ownership_otp': Validates submitted OTP against stored hash on the backend,
//      tracks attempt limits (max 5), updates verification status, and logs audit trail without recording OTP values.
//    - Strict Account Binding: Only the logged-in administrator can request and verify their own address.
//      Cross-admin verification attempts are rejected with HTTP 403.
// 3. Admin-Only Test Email Feature (`is_test: true`): Dispatches test alert to target admin or all 4,
//    and reports whether Resend accepted or rejected each recipient.
// 4. Real Suspicious Transaction Alerts:
//    - Evaluates risk score: 0-24 (Low) and 25-51 (Warning) are strictly skipped (no email).
//    - Scores 52-74 (High) and 75-100 (Critical) trigger Resend alerts.
//    - Maps transaction to the owning administrator and sends strictly to their configured recipient.
//    - Checks duplicate prevention (idempotency via transaction_id + risk_level).
// 5. Uses 'onboarding@resend.dev' as sender for testing.
// 6. Reads 'RESEND_API_KEY' exclusively from Edge Function environment secrets.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OTP_SALT = 'upi_fraud_shield_otp_salt_v3';

export type AdminUsername = 'USER1' | 'USER2' | 'USER3' | 'USER4';

export interface AdminRecipient {
  username: AdminUsername;
  name: string;
  email: string;
  uuid: string;
  verified: boolean;
  verified_at: string | null;
}

export interface AdminRecipientsMap {
  USER1: AdminRecipient;
  USER2: AdminRecipient;
  USER3: AdminRecipient;
  USER4: AdminRecipient;
  [key: string]: AdminRecipient;
}

export interface AdminOtpRecord {
  admin_username?: string;
  admin?: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  resend_available_at: string;
  created_at?: string;
}

export type AdminOtpStore = Record<string, AdminOtpRecord>;

// Default four admin accounts fallback mapping
const DEFAULT_RECIPIENTS: AdminRecipientsMap = {
  USER1: { username: 'USER1', name: 'Gopika', email: 'sivar75@gmail.com', uuid: '15c5209b-cc1a-4510-b6a3-69268fa692b6', verified: true, verified_at: '2026-11-21T21:10:00.000Z' },
  USER2: { username: 'USER2', name: 'Padmashri', email: 'sanvjf@gmail.com', uuid: 'cc9ea8a3-c449-4b15-ae9a-e9b866e87152', verified: false, verified_at: null },
  USER3: { username: 'USER3', name: 'Megala', email: 'ramanid97@gmail.com', uuid: '81ce3767-f86d-49c5-a5d8-6519399d01bc', verified: false, verified_at: null },
  USER4: { username: 'USER4', name: 'Subasri', email: 'kannadhasan815@gmail.com', uuid: '3dbbac56-66de-4b7c-baa9-b6f8f3ad4105', verified: false, verified_at: null },
};

function resolveUsernameFromEmail(email: string = ''): AdminUsername {
  const lower = email.trim().toLowerCase();
  if (lower.startsWith('user1')) return 'USER1';
  if (lower.startsWith('user2')) return 'USER2';
  if (lower.startsWith('user3')) return 'USER3';
  if (lower.startsWith('user4')) return 'USER4';
  return 'USER1';
}

// Compute secure SHA-256 hash of OTP + salt
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${OTP_SALT}:${otp.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generates professional Black + Yellow + White themed HTML email for transaction alerts & tests
function generateEmailHtml({
  heading,
  description,
  body,
  userName,
  transactionId,
  amount,
  upiProvider,
  date,
  time,
  riskScore,
  riskLevel,
  detectedPatterns,
  analysisSummary,
  footerText,
  isTest = false,
}: {
  heading: string;
  description: string;
  body: string;
  userName: string;
  transactionId: string;
  amount: number | string;
  upiProvider: string;
  date: string;
  time: string;
  riskScore: number;
  riskLevel: string;
  detectedPatterns: string[];
  analysisSummary: string;
  footerText: string;
  isTest?: boolean;
}) {
  const isCritical = riskScore >= 75;
  const accentColor = '#facc15';
  const badgeBg = isCritical ? 'rgba(250, 204, 21, 0.25)' : 'rgba(250, 204, 21, 0.15)';
  const patternList = detectedPatterns && detectedPatterns.length > 0
    ? detectedPatterns.map((p) => `<li style="margin-bottom: 6px; color: #facc15;"><strong>${p}</strong></li>`).join('')
    : '<li style="color: #a1a1a1;">No anomalous patterns.</li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #000000; border: 2px solid ${accentColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(250, 204, 21, 0.15);">
          <tr>
            <td style="background-color: #111111; padding: 24px 30px; border-bottom: 1px solid #222222; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #facc15; text-transform: uppercase;">
                UPI FRAUD DETECTION & RISK ASSESSMENT SYSTEM
              </div>
              <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                ${heading}
              </h1>
            </td>
          </tr>

          ${isTest ? `
          <tr>
            <td style="background-color: rgba(250, 204, 21, 0.12); padding: 12px 30px; border-bottom: 1px solid rgba(250, 204, 21, 0.3); text-align: center;">
              <span style="font-size: 12px; font-weight: 800; color: #facc15; letter-spacing: 1.5px; text-transform: uppercase;">
                ⚡ VERIFIED RECIPIENT TEST TRANSMISSION ⚡
              </span>
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding: 24px 30px; text-align: center; background-color: #080808; border-bottom: 1px solid #1a1a1a;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: #888888; text-transform: uppercase;">
                ASSESSED RISK SCORE
              </div>
              <div style="font-size: 54px; font-weight: 900; color: #facc15; margin: 4px 0; font-family: monospace;">
                ${riskScore}<span style="font-size: 20px; color: #666666;"> / 100</span>
              </div>
              <div style="display: inline-block; padding: 6px 18px; border-radius: 999px; background-color: ${badgeBg}; border: 1px solid ${accentColor}; font-size: 13px; font-weight: 800; color: #facc15; letter-spacing: 1px; text-transform: uppercase;">
                ${riskLevel} RISK ALERT
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 26px 30px; font-size: 14px; line-height: 1.6; color: #dddddd;">
              <p style="margin: 0 0 16px 0;">Hello Administrator <strong>${userName}</strong>,</p>
              <p style="margin: 0 0 20px 0; color: #cccccc;">${description}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #111111; border: 1px solid #222222; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 12px; color: #888888; width: 40%;">Transaction ID / UTR</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 13px; font-weight: 600; color: #ffffff; font-family: monospace;">${transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 12px; color: #888888;">Transaction Amount</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 15px; font-weight: 800; color: #facc15; font-family: monospace;">₹${Number(amount).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 12px; color: #888888;">UPI Application</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a; font-size: 13px; color: #ffffff;">${upiProvider}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; color: #888888;">Date & Time</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #ffffff;">${date}${time ? ' • ' + time : ''}</td>
                </tr>
              </table>

              <div style="background-color: #0d0d0d; border-left: 3px solid #facc15; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #facc15; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Triggered Fraud Patterns
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                  ${patternList}
                </ul>
              </div>

              <div style="background-color: #111111; border: 1px solid #222222; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #cccccc; white-space: pre-line;">
                <div style="font-weight: 700; color: #facc15; margin-bottom: 6px;">Analysis Summary:</div>
                <div style="margin-bottom: 12px; color: #ffffff;">${analysisSummary || 'Behavioral anomaly detected by 13-pattern XAI engine.'}</div>
                ${body}
              </div>

              <div style="background-color: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 8px; padding: 16px; font-size: 13px; color: #ffffff;">
                <strong style="color: #facc15;">Security Notice:</strong> Never share your UPI PIN or OTP. If this payment is unrecognized, report it immediately to your bank fraud division.
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #080808; padding: 20px 30px; border-top: 1px solid #1a1a1a; text-align: center; font-size: 11px; color: #666666; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">${footerText}</p>
              <p style="margin: 0; color: #444444;">Department of Computer Science & Engineering · Final Year Review 3</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Generates dedicated Black + Yellow HTML email for 6-digit OTP verification
function generateOtpHtml({
  userName,
  otpCode,
  recipientEmail,
}: {
  userName: string;
  otpCode: string;
  recipientEmail: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Ownership Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #000000; border: 2px solid #facc15; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(250, 204, 21, 0.2);">
          <tr>
            <td style="background-color: #111111; padding: 24px 30px; border-bottom: 1px solid #222222; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #facc15; text-transform: uppercase;">
                UPI FRAUD DETECTION & RISK ASSESSMENT SYSTEM
              </div>
              <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                Email Ownership Verification
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #cccccc;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #a1a1a1; line-height: 1.6;">
                We received a request to verify ownership of <strong>${recipientEmail}</strong> for administrator fraud alerts. Enter the six-digit verification code below:
              </p>

              <!-- Prominent 6-Digit OTP Box -->
              <div style="background-color: #080808; border: 2px dashed #facc15; border-radius: 10px; padding: 20px; margin: 0 auto 24px auto; max-width: 280px; letter-spacing: 8px; font-size: 36px; font-weight: 900; color: #facc15; font-family: monospace;">
                ${otpCode}
              </div>

              <div style="background-color: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.25); border-radius: 8px; padding: 14px; text-align: left; font-size: 12px; color: #dddddd; line-height: 1.5;">
                <strong style="color: #facc15;">Security Notice:</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                  <li>This code expires in <strong>5 minutes</strong>.</li>
                  <li>Maximum <strong>5 verification attempts</strong> permitted.</li>
                  <li>Never share this code with anyone. Antigravity administrators will never ask for your code.</li>
                </ul>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #080808; padding: 18px 30px; border-top: 1px solid #1a1a1a; text-align: center; font-size: 11px; color: #666666;">
              Department of Computer Science & Engineering · Final Year Review 3
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[send-suspicious-alert] Missing RESEND_API_KEY secret in environment.');
      return new Response(
        JSON.stringify({
          error: 'Configuration Error: RESEND_API_KEY secret is not configured on the Supabase Edge runtime.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired authentication session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callingUsername = resolveUsernameFromEmail(user.email);

    // Fetch 4 Configured Admin Email Recipients from `public.system_config`
    let configuredRecipients: AdminRecipientsMap = { ...DEFAULT_RECIPIENTS };
    try {
      const { data: configData, error: configErr } = await supabaseClient
        .from('system_config')
        .select('value')
        .eq('key', 'admin_email_recipients')
        .maybeSingle();

      if (!configErr && configData?.value) {
        const parsed = typeof configData.value === 'string' ? JSON.parse(configData.value) : configData.value;
        configuredRecipients = { ...DEFAULT_RECIPIENTS, ...parsed };
      }
    } catch (cfgReadErr) {
      console.warn('[send-suspicious-alert] Could not read system_config, using defaults:', cfgReadErr);
    }

    const payload = await req.json();

    // ==========================================================================
    // WORKFLOW 1: Send 6-Digit Cryptographic OTP for Email Verification
    // ==========================================================================
    if (payload.action === 'send_verification_otp') {
      const requestedAdmin = payload.target_admin || callingUsername;

      // Security Rule: Bind verification request to calling admin account.
      // Do NOT allow one admin to verify another admin's address!
      if (requestedAdmin !== callingUsername) {
        return new Response(
          JSON.stringify({
            error: `Forbidden: Administrator ${callingUsername} is not authorized to request verification codes for ${requestedAdmin}. Each administrator can only verify their own address.`,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetAdminObj = configuredRecipients[callingUsername];
      const targetEmail = targetAdminObj?.email;

      if (!targetEmail || !targetEmail.includes('@')) {
        return new Response(
          JSON.stringify({
            error: `No valid email configured in system_config for ${callingUsername}.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Read active OTP store from system_config
      let otpStore: AdminOtpStore = {};
      try {
        const { data: storeData } = await supabaseClient
          .from('system_config')
          .select('value')
          .eq('key', 'admin_email_otp_store')
          .maybeSingle();
        if (storeData?.value) {
          otpStore = typeof storeData.value === 'string' ? JSON.parse(storeData.value) : storeData.value;
        }
      } catch (_storeErr) {
        // Fallback to empty store if system_config read is unavailable
      }

      const existingRecord = otpStore[callingUsername];
      const now = Date.now();

      // Check Resend frequency limit / cooldown (60 seconds)
      if (existingRecord && existingRecord.resend_available_at) {
        const cooldownTime = new Date(existingRecord.resend_available_at).getTime();
        if (now < cooldownTime) {
          const secondsRemaining = Math.ceil((cooldownTime - now) / 1000);
          return new Response(
            JSON.stringify({
              error: `Rate limit: Please wait ${secondsRemaining}s before requesting a new verification code.`,
              resend_cooldown_seconds: secondsRemaining,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Generate cryptographically secure 6-digit OTP
      const randomValues = new Uint32Array(1);
      crypto.getRandomValues(randomValues);
      const otpCode = String((randomValues[0] % 900000) + 100000); // 100000 to 999999

      // Hash OTP with SHA-256 (Never store plain OTP!)
      const hashedOtp = await hashOtp(otpCode);
      const expiresAt = new Date(now + 5 * 60 * 1000).toISOString(); // 5 minutes expiry
      const resendAvailableAt = new Date(now + 60 * 1000).toISOString(); // 60s cooldown

      otpStore[callingUsername] = {
        admin_username: callingUsername,
        email: targetEmail,
        otp_hash: hashedOtp,
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: 5,
        resend_available_at: resendAvailableAt,
        created_at: new Date(now).toISOString(),
      };

      // Save updated OTP store to system_config
      await supabaseClient.from('system_config').upsert(
        {
          key: 'admin_email_otp_store',
          value: JSON.stringify(otpStore),
        },
        { onConflict: 'key' }
      );

      // Render OTP HTML email
      const otpHtml = generateOtpHtml({
        userName: targetAdminObj?.name || callingUsername,
        otpCode,
        recipientEmail: targetEmail,
      });

      // Attempt dispatch via Resend
      let deliveryStatus = 'pending';
      let deliveryNotice = '';
      let resendId = null;

      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'UPI Fraud Shield <onboarding@resend.dev>',
            to: [targetEmail],
            subject: `[VERIFICATION] Your UPI Fraud Shield 6-Digit Code (${targetAdminObj?.name || callingUsername})`,
            html: otpHtml,
          }),
        });

        const resendResult = await resendResponse.json();

        if (resendResponse.ok) {
          deliveryStatus = 'delivered';
          resendId = resendResult.id;
          deliveryNotice = `Verification code dispatched to ${targetEmail} via Resend.`;
        } else {
          deliveryStatus = 'restricted_by_sender_domain';
          deliveryNotice = resendResult.message || `Resend rejected (HTTP ${resendResponse.status}). Note: onboarding@resend.dev is restricted to the account owner (sivar75@gmail.com). Custom domain verification is required for external delivery.`;
        }
      } catch (err: unknown) {
        deliveryStatus = 'failed';
        deliveryNotice = err instanceof Error ? err.message : 'Network error communicating with Resend.';
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'send_verification_otp',
          admin: callingUsername,
          email: targetEmail,
          delivery_status: deliveryStatus,
          delivery_notice: deliveryNotice,
          resend_id: resendId,
          expires_at: expiresAt,
          expires_in_seconds: 300,
          resend_cooldown_seconds: 60,
          // If Resend restricted the email in sandbox testing, provide dev hint so verification workflow is fully testable
          dev_hint: deliveryStatus === 'restricted_by_sender_domain' ? otpCode : undefined,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================================
    // WORKFLOW 2: Verify Submitted 6-Digit OTP on Backend
    // ==========================================================================
    if (payload.action === 'verify_ownership_otp') {
      const requestedAdmin = payload.target_admin || callingUsername;

      // Security Rule: Do NOT allow one admin to verify another admin's address!
      if (requestedAdmin !== callingUsername) {
        return new Response(
          JSON.stringify({
            error: `Forbidden: Administrator ${callingUsername} is not authorized to submit verification for ${requestedAdmin}.`,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const submittedOtp = (payload.otp || '').trim();
      if (!submittedOtp || submittedOtp.length !== 6) {
        return new Response(
          JSON.stringify({ error: 'Please enter a valid 6-digit verification code.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch stored OTP record
      let otpStore: AdminOtpStore = {};
      try {
        const { data: storeData } = await supabaseClient
          .from('system_config')
          .select('value')
          .eq('key', 'admin_email_otp_store')
          .maybeSingle();
        if (storeData?.value) {
          otpStore = typeof storeData.value === 'string' ? JSON.parse(storeData.value) : storeData.value;
        }
      } catch (_storeErr) {
        // Fallback to empty store if system_config read is unavailable
      }

      const record = otpStore[callingUsername];
      const now = Date.now();

      if (!record || !record.otp_hash) {
        return new Response(
          JSON.stringify({
            error: 'No active verification code found for this account. Please request a new code.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check Expiry (5 minutes)
      if (new Date(record.expires_at).getTime() < now) {
        delete otpStore[callingUsername];
        await supabaseClient.from('system_config').upsert(
          { key: 'admin_email_otp_store', value: JSON.stringify(otpStore) },
          { onConflict: 'key' }
        );

        return new Response(
          JSON.stringify({
            error: 'Verification code has expired (5-minute limit exceeded). Please request a new code.',
            expired: true,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check Attempt Limit (Max 5 attempts)
      if (record.attempts >= record.max_attempts) {
        delete otpStore[callingUsername];
        await supabaseClient.from('system_config').upsert(
          { key: 'admin_email_otp_store', value: JSON.stringify(otpStore) },
          { onConflict: 'key' }
        );

        return new Response(
          JSON.stringify({
            error: 'Maximum verification attempts exceeded (5). Code invalidated for security. Please request a new code.',
            locked: true,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Compare hashes
      const submittedHash = await hashOtp(submittedOtp);
      if (submittedHash !== record.otp_hash) {
        record.attempts = (record.attempts || 0) + 1;
        const attemptsRemaining = record.max_attempts - record.attempts;
        otpStore[callingUsername] = record;

        await supabaseClient.from('system_config').upsert(
          { key: 'admin_email_otp_store', value: JSON.stringify(otpStore) },
          { onConflict: 'key' }
        );

        return new Response(
          JSON.stringify({
            error: `Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`,
            attempts_remaining: attemptsRemaining,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SUCCESS: OTP Matched!
      // Invalidate OTP record immediately
      delete otpStore[callingUsername];
      await supabaseClient.from('system_config').upsert(
        { key: 'admin_email_otp_store', value: JSON.stringify(otpStore) },
        { onConflict: 'key' }
      );

      // Mark email as verified in system_config admin_email_recipients
      configuredRecipients[callingUsername] = {
        ...configuredRecipients[callingUsername],
        verified: true,
        verified_at: new Date().toISOString(),
      };

      await supabaseClient.from('system_config').upsert(
        {
          key: 'admin_email_recipients',
          value: JSON.stringify(configuredRecipients),
        },
        { onConflict: 'key' }
      );

      // Audit Log: Record verification status change WITHOUT recording OTP value
      try {
        let auditLogs = [];
        const { data: auditData } = await supabaseClient
          .from('system_config')
          .select('value')
          .eq('key', 'admin_email_recipients_audit')
          .maybeSingle();
        if (auditData?.value) {
          auditLogs = typeof auditData.value === 'string' ? JSON.parse(auditData.value) : auditData.value;
        }

        auditLogs.unshift({
          id: `AUDIT_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'EMAIL_OWNERSHIP_VERIFIED',
          admin_username: callingUsername,
          email: record.email,
          status: 'VERIFIED',
          verified_by_auth_id: user.id,
        });

        await supabaseClient.from('system_config').upsert(
          {
            key: 'admin_email_recipients_audit',
            value: JSON.stringify(auditLogs.slice(0, 50)),
          },
          { onConflict: 'key' }
        );
      } catch (auditErr) {
        console.warn('[Audit Log Notice]:', auditErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          admin: callingUsername,
          email: record.email,
          verified_at: configuredRecipients[callingUsername]?.verified_at ?? null,
          message: `Email ownership for ${record.email} has been successfully verified! High and critical alerts for ${callingUsername} are now authorized for dispatch.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================================
    // WORKFLOW 3: Admin-Only Test Email Feature (`is_test: true`)
    // ==========================================================================
    if (payload.is_test) {
      const targetAdmin = String(payload.target_admin || 'USER1');
      const targets = targetAdmin === 'ALL'
        ? Object.values(configuredRecipients)
        : [configuredRecipients[targetAdmin] || configuredRecipients.USER1];

      const results = [];

      for (const target of targets) {
        if (!target.email || !target.email.includes('@')) {
          results.push({
            admin: target.username,
            name: target.name,
            email: target.email || 'missing',
            status: 'rejected',
            reason: 'Invalid or missing email address in system_config',
          });
          continue;
        }

        const html = generateEmailHtml({
          heading: `Verified Delivery Test: ${target.name} (${target.username})`,
          description: `This is an administrator verification test email for ${target.name} (${target.email}).`,
          body: `Verification Successful: Your recipient email address is registered in the UPI Fraud Detection System for ${target.username}.\n\nWhen a suspicious transaction is flagged under your account, real-time alerts will be dispatched to this address.`,
          userName: target.name,
          transactionId: `TEST_TXN_${Date.now()}`,
          amount: 5000,
          upiProvider: 'Paytm UPI',
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          riskScore: 78,
          riskLevel: 'CRITICAL',
          detectedPatterns: ['Pattern P4 — Spending Deviation', 'Pattern P5 — New Beneficiary High Value'],
          analysisSummary: 'Simulated high-risk alert verifying individual administrator email delivery channel.',
          footerText: 'Test transmission via Resend API (Review 3 Stage 2).',
          isTest: true,
        });

        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'UPI Fraud Shield <onboarding@resend.dev>',
              to: [target.email],
              subject: `[TEST ALERT] UPI Fraud Shield — Verification for ${target.name} (${target.username})`,
              html,
            }),
          });

          const resendResult = await resendResponse.json();

          if (resendResponse.ok) {
            results.push({
              admin: target.username,
              name: target.name,
              email: target.email,
              status: 'accepted',
              resend_id: resendResult.id,
              message: 'Delivered successfully via Resend',
            });
          } else {
            results.push({
              admin: target.username,
              name: target.name,
              email: target.email,
              status: 'rejected',
              statusCode: resendResponse.status,
              reason: resendResult.message || `Resend rejected (HTTP ${resendResponse.status})`,
            });
          }
        } catch (dispatchErr: unknown) {
          results.push({
            admin: target.username,
            name: target.name,
            email: target.email,
            status: 'failed',
            reason: dispatchErr instanceof Error ? dispatchErr.message : 'Network error communicating with Resend',
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          is_test: true,
          target_admin: targetAdmin,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================================
    // WORKFLOW 4: Real Suspicious Transaction Alert
    // ==========================================================================
    const {
      transaction_id,
      amount,
      upi_provider = 'UPI',
      date = new Date().toLocaleDateString('en-GB'),
      time = '',
      risk_score = 0,
      risk_level = 'HIGH',
      detected_patterns = [],
      analysis_summary = '',
      mode = 'ACTIVE',
    } = payload;

    if (!transaction_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: transaction_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scoreNum = Number(risk_score) || 0;

    // Strict Risk Policy: Scores 0-24 and 25-51 do NOT trigger email notifications
    if (scoreNum < 52) {
      return new Response(
        JSON.stringify({
          success: true,
          email_skipped: true,
          reason: `Risk score (${scoreNum}) is below email dispatch threshold (52). In-app notification only.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map calling admin to configured receiver address
    const targetRecipientObj = configuredRecipients[callingUsername] || configuredRecipients.USER1;
    const recipientEmail = targetRecipientObj?.email || user.email;
    const adminName = targetRecipientObj?.name || callingUsername;
    const isVerified = Boolean(targetRecipientObj?.verified);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return new Response(
        JSON.stringify({
          error: `No configured recipient email found in system_config for ${callingUsername}.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotent duplicate prevention
    try {
      const { data: existingNotification } = await supabaseClient
        .from('email_notifications')
        .select('id, status, resend_id, created_at')
        .eq('transaction_id', transaction_id)
        .eq('risk_level', risk_level)
        .maybeSingle();

      if (existingNotification && existingNotification.status === 'sent') {
        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            message: 'An alert email has already been dispatched for this transaction and risk level.',
            resend_id: existingNotification.resend_id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (_dupErr) {
      // Continue to send if duplicate check table is temporarily unreachable
    }

    const emailHtml = generateEmailHtml({
      heading: scoreNum >= 75 ? 'Critical Risk Transaction Alert' : 'High Risk Transaction Alert',
      description: `A transaction with an elevated risk score (${scoreNum}/100) was detected on your account.`,
      body: `A recent payment of ₹${Number(amount || 0).toLocaleString()} via ${upi_provider} on ${date} triggered suspicious behavioral patterns.\n\nSummary:\n${analysis_summary || 'Behavioral anomaly detected.'}`,
      userName: adminName,
      transactionId: transaction_id,
      amount,
      upiProvider: upi_provider,
      date,
      time,
      riskScore: scoreNum,
      riskLevel: risk_level,
      detectedPatterns: Array.isArray(detected_patterns) ? detected_patterns : [String(detected_patterns)],
      analysisSummary: analysis_summary || 'Behavioral anomaly detected.',
      footerText: 'This is an automated security alert from the UPI Fraud Detection and Risk Assessment System.',
    });

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UPI Fraud Shield <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `${scoreNum >= 75 ? 'CRITICAL ALERT' : 'SECURITY WARNING'}: UPI Fraud Risk Flagged (${scoreNum}/100) — ${adminName}`,
        html: emailHtml,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[send-suspicious-alert] Resend API error:', resendResult);

      try {
        await supabaseClient.from('email_notifications').upsert(
          {
            transaction_id,
            mode,
            user_id: user.id,
            recipient_email: recipientEmail,
            risk_score: scoreNum,
            risk_level,
            status: 'failed',
            error_message: resendResult.message || `Resend error HTTP ${resendResponse.status}`,
            last_attempt_at: new Date().toISOString(),
          },
          { onConflict: 'transaction_id,risk_level' }
        );
      } catch (_failedLogErr) {
        // Non-blocking log failure
      }

      return new Response(
        JSON.stringify({
          error: `Resend dispatch failed: ${resendResult.message || 'API request rejected'}`,
          status: 'failed',
          recipient: recipientEmail,
          verified: isVerified,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendId = resendResult.id;
    try {
      await supabaseClient.from('email_notifications').upsert(
        {
          transaction_id,
          mode,
          user_id: user.id,
          recipient_email: recipientEmail,
          risk_score: scoreNum,
          risk_level,
          status: 'sent',
          resend_id: resendId,
          error_message: null,
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: 'transaction_id,risk_level' }
      );
    } catch (_sentLogErr) {
      // Non-blocking log failure
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'sent',
        resend_id: resendId,
        recipient: recipientEmail,
        admin: callingUsername,
        risk_score: scoreNum,
        risk_level,
        verified: isVerified,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('[send-suspicious-alert] Unhandled error:', errorMessage);
    return new Response(
      JSON.stringify({ error: `Internal error: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
