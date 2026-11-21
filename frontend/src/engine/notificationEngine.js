// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Multi-Channel Risk Notification Engine & Template Formatter
//
// WHAT THIS ENGINE DOES:
// ------------------------------------------------------------------------------
// 1. Enforces strict, non-overlapping risk score notification tiers:
//      - LOW RISK: 0 - 24     -> Website notification + Browser Notification (No email)
//      - WARNING: 25 - 51      -> Website warning + Browser Notification (No email)
//      - HIGH RISK: 52 - 74    -> High-risk alert + Resend Email Notification
//      - CRITICAL RISK: 75-100 -> Critical danger alert + Priority Resend Email
// 2. Validates dynamic user-configured thresholds (no gaps, no overlaps, continuous 0-100).
// 3. Replaces dynamic template placeholders for customized administrator alerts.
// 4. Renders responsive HTML email templates with Black (#000000) + Yellow (#facc15) design.
// 5. Formats shared event payloads compatible with the future Android companion app.
// ==============================================================================

export const DEFAULT_THRESHOLDS = {
  low_min: 0,
  low_max: 24,
  warning_min: 25,
  warning_max: 51,
  high_min: 52,
  high_max: 74,
  critical_min: 75,
  critical_max: 100,
};

/**
 * Validates a threshold configuration set.
 * Enforces strict boundary rules:
 * - Continuous from 0 to 100 with zero gaps and zero overlaps.
 * - Integer boundaries only.
 */
export function validateThresholds(t) {
  if (!t) return { isValid: false, error: 'Threshold configuration cannot be empty.' };

  const low_min = parseInt(t.low_min, 10);
  const low_max = parseInt(t.low_max, 10);
  const warning_min = parseInt(t.warning_min, 10);
  const warning_max = parseInt(t.warning_max, 10);
  const high_min = parseInt(t.high_min, 10);
  const high_max = parseInt(t.high_max, 10);
  const critical_min = parseInt(t.critical_min, 10);
  const critical_max = parseInt(t.critical_max, 10);

  const values = [low_min, low_max, warning_min, warning_max, high_min, high_max, critical_min, critical_max];
  if (values.some((v) => isNaN(v) || v < 0 || v > 100)) {
    return { isValid: false, error: 'All threshold limits must be valid integers between 0 and 100.' };
  }

  if (low_min !== 0) {
    return { isValid: false, error: 'Low Risk range must start at 0.' };
  }
  if (low_max < low_min) {
    return { isValid: false, error: 'Low Risk maximum cannot be less than its minimum.' };
  }
  if (warning_min !== low_max + 1) {
    return { isValid: false, error: `Warning minimum (${warning_min}) must be exactly Low maximum + 1 (${low_max + 1}) to prevent gaps/overlaps.` };
  }
  if (warning_max < warning_min) {
    return { isValid: false, error: 'Warning maximum cannot be less than its minimum.' };
  }
  if (high_min !== warning_max + 1) {
    return { isValid: false, error: `High Risk minimum (${high_min}) must be exactly Warning maximum + 1 (${warning_max + 1}).` };
  }
  if (high_max < high_min) {
    return { isValid: false, error: 'High Risk maximum cannot be less than its minimum.' };
  }
  if (critical_min !== high_max + 1) {
    return { isValid: false, error: `Critical Risk minimum (${critical_min}) must be exactly High Risk maximum + 1 (${high_max + 1}).` };
  }
  if (critical_max !== 100) {
    return { isValid: false, error: 'Critical Risk range must end at 100.' };
  }

  return { isValid: true };
}

/**
 * Evaluates the notification tier for a given risk score (0-100).
 * Returns tier details:
 * - level: 'LOW' | 'WARNING' | 'HIGH' | 'CRITICAL'
 * - sendEmail: boolean (true only for HIGH and CRITICAL)
 * - showWarningPopup: boolean
 * - priority: 'normal' | 'high' | 'urgent'
 */
export function evaluateNotificationLevel(score, customThresholds = null) {
  const t = customThresholds || DEFAULT_THRESHOLDS;
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  if (s <= t.low_max) {
    return {
      level: 'LOW',
      label: 'Low Risk',
      score: s,
      sendEmail: false,
      showWarningPopup: false,
      isDanger: false,
      priority: 'low',
      badgeClass: 'badge-low',
      color: '#facc15',
      channels: ['website', 'browser'],
      androidPriority: 'IMPORTANCE_LOW',
      message: 'Transaction is consistent with normal activity. No anomalous risk patterns detected.',
    };
  } else if (s <= t.warning_max) {
    return {
      level: 'WARNING',
      label: 'Warning',
      score: s,
      sendEmail: false,
      showWarningPopup: true,
      isDanger: false,
      priority: 'normal',
      badgeClass: 'badge-medium',
      color: '#facc15',
      channels: ['website', 'browser'],
      androidPriority: 'IMPORTANCE_DEFAULT',
      message: 'Moderate deviation detected. Review recipient and payment details carefully.',
    };
  } else if (s <= t.high_max) {
    return {
      level: 'HIGH',
      label: 'High Risk',
      score: s,
      sendEmail: true,
      showWarningPopup: true,
      isDanger: true,
      priority: 'high',
      badgeClass: 'badge-high',
      color: '#facc15',
      channels: ['website', 'browser', 'email'],
      androidPriority: 'IMPORTANCE_HIGH',
      message: 'Elevated fraud probability detected. Dispatched individual security alert email.',
    };
  } else {
    return {
      level: 'CRITICAL',
      label: 'Critical Risk',
      score: s,
      sendEmail: true,
      showWarningPopup: true,
      isDanger: true,
      priority: 'urgent',
      badgeClass: 'badge-critical',
      color: '#facc15',
      channels: ['website', 'browser', 'email'],
      androidPriority: 'IMPORTANCE_MAX',
      message: 'URGENT: Critical fraud patterns detected. Priority security alert dispatched to your verified email.',
    };
  }
}

/**
 * Replaces dynamic placeholders in email subjects and bodies.
 * Supported placeholders:
 * - {{user_name}}
 * - {{transaction_id}}
 * - {{transaction_amount}}
 * - {{upi_provider}}
 * - {{transaction_date}}
 * - {{risk_score}}
 * - {{risk_level}}
 * - {{detected_patterns}}
 * - {{analysis_summary}}
 */
export function substituteTemplate(templateText = '', placeholders = {}) {
  if (!templateText) return '';
  let result = String(templateText);

  const patterns = Array.isArray(placeholders.detected_patterns)
    ? placeholders.detected_patterns.join(', ')
    : String(placeholders.detected_patterns || 'None');

  const replacements = {
    '{{user_name}}': placeholders.user_name || placeholders.userName || 'Administrator',
    '{{transaction_id}}': placeholders.transaction_id || placeholders.transactionId || 'TXN-REF',
    '{{transaction_amount}}': placeholders.transaction_amount != null
      ? Number(placeholders.transaction_amount).toLocaleString()
      : '0',
    '{{upi_provider}}': placeholders.upi_provider || placeholders.upiProvider || 'UPI',
    '{{transaction_date}}': placeholders.transaction_date || placeholders.date || 'Recent',
    '{{risk_score}}': String(placeholders.risk_score ?? placeholders.score ?? 0),
    '{{risk_level}}': String(placeholders.risk_level || placeholders.level || 'ALERT'),
    '{{detected_patterns}}': patterns,
    '{{analysis_summary}}': placeholders.analysis_summary || placeholders.summary || 'Suspicious behavioral deviation detected.',
  };

  for (const [key, val] of Object.entries(replacements)) {
    result = result.replaceAll(key, String(val));
  }

  return result;
}

/**
 * Generates the responsive HTML preview matching Black + Yellow + White project theme.
 */
export function generateEmailHtmlPreview(template, data = {}) {
  const subject = substituteTemplate(template?.subject || 'Security Alert: UPI Transaction Flagged', data);
  const heading = substituteTemplate(template?.heading || 'UPI Security Alert', data);
  const description = substituteTemplate(template?.description || 'A transaction was flagged under your account.', data);
  const body = substituteTemplate(template?.body || 'Please review this transaction immediately.', data);
  const footerText = template?.footer_text || 'Automated alert from UPI Fraud Detection & Risk Assessment System.';

  const score = Number(data.risk_score ?? 78);
  const isCritical = score >= 75;
  const badgeColor = '#facc15';
  const badgeBg = isCritical ? 'rgba(250, 204, 21, 0.25)' : 'rgba(250, 204, 21, 0.15)';

  const patterns = Array.isArray(data.detected_patterns) ? data.detected_patterns : ['Pattern P4 — Severe Amount Deviation', 'Pattern P5 — New Recipient High Value'];
  const patternList = patterns.map((p) => `<li style="margin-bottom: 6px; color: #facc15;"><strong>${p}</strong></li>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #000000; border: 2px solid ${badgeColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(250, 204, 21, 0.15);">
    <div style="background-color: #111111; padding: 20px 24px; border-bottom: 1px solid #222222;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #facc15; text-transform: uppercase;">
        UPI FRAUD DETECTION & RISK ASSESSMENT SYSTEM
      </div>
      <h2 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">
        ${heading}
      </h2>
    </div>

    <div style="padding: 24px; text-align: center; background-color: #080808; border-bottom: 1px solid #1a1a1a;">
      <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: #888888; text-transform: uppercase;">
        ASSESSED RISK SCORE
      </div>
      <div style="font-size: 48px; font-weight: 900; color: #facc15; margin: 4px 0; font-family: monospace;">
        ${score}<span style="font-size: 18px; color: #666666;"> / 100</span>
      </div>
      <span style="display: inline-block; padding: 5px 16px; border-radius: 999px; background-color: ${badgeBg}; border: 1px solid ${badgeColor}; font-size: 12px; font-weight: 800; color: #facc15; text-transform: uppercase;">
        ${data.risk_level || (isCritical ? 'CRITICAL' : 'HIGH')} RISK
      </span>
    </div>

    <div style="padding: 24px; font-size: 13px; line-height: 1.6; color: #dddddd;">
      <p style="margin: 0 0 14px 0;">Hello <strong>${data.user_name || 'Administrator'}</strong>,</p>
      <p style="margin: 0 0 18px 0; color: #cccccc;">${description}</p>

      <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #111111; border: 1px solid #222222; border-radius: 8px; margin-bottom: 20px; font-size: 12px;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888888;">Transaction ID / UTR</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; font-weight: 600; color: #ffffff; font-family: monospace;">${data.transaction_id || 'TXN-984210'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888888;">Amount</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; font-weight: 700; color: #facc15; font-family: monospace;">₹${Number(data.transaction_amount || 4500).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888888;">Provider</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #ffffff;">${data.upi_provider || 'Paytm UPI'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #888888;">Date & Time</td>
          <td style="padding: 10px 14px; color: #ffffff;">${data.transaction_date || 'Today'}</td>
        </tr>
      </table>

      <div style="background-color: #0d0d0d; border-left: 3px solid #facc15; padding: 14px; border-radius: 4px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #facc15; text-transform: uppercase; margin-bottom: 6px;">
          Detected Suspicious Patterns
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px;">
          ${patternList}
        </ul>
      </div>

      <div style="background-color: #111111; border: 1px solid #222222; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #cccccc; white-space: pre-line;">
        ${body}
      </div>

      <div style="background-color: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 8px; padding: 14px; font-size: 12px; color: #ffffff;">
        <strong style="color: #facc15;">Security Notice:</strong> Never share your UPI PIN or OTP. If this payment is unrecognized, contact your bank immediately.
      </div>
    </div>

    <div style="background-color: #080808; padding: 16px 24px; border-top: 1px solid #1a1a1a; text-align: center; font-size: 11px; color: #666666;">
      ${footerText}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Prepares a structured payload for future Android companion synchronization.
 * The future Android companion notification listener service can consume this exact payload.
 */
export function buildAndroidNotificationPayload(transaction, analysis, tier) {
  return {
    source: 'web_fraud_engine',
    version: 'review_3_v1',
    event_type: 'RISK_ALERT',
    transaction_id: transaction.id || transaction.transaction_id,
    amount: transaction.amount,
    provider: transaction.payment_mode || 'UPI',
    timestamp: new Date().toISOString(),
    risk: {
      score: analysis.score,
      level: tier.level,
      patterns: analysis.detected_patterns || [],
      priority: tier.androidPriority,
      summary: analysis.recommendation || '',
    },
    user_id: transaction.user_id || null,
  };
}

export default {
  DEFAULT_THRESHOLDS,
  validateThresholds,
  evaluateNotificationLevel,
  substituteTemplate,
  generateEmailHtmlPreview,
  buildAndroidNotificationPayload,
};
