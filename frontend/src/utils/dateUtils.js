// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Unified Date & Time Normalization Utility
// Handles OCR formats, ISO dates, Indian formats, and calendar boundary checks
// ==============================================================================

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] || 30;
}

/**
 * Normalizes and validates a transaction date string.
 * Supports:
 * - "29 May 2026", "10 Sep 2026", "10th Sep 26", "10 Sept 2026"
 * - "24/03/2026", "24/3/2026"
 * - "24-03-2026", "10-09-2026"
 * - "2026-05-29", "2026-03-24" (ISO)
 * - ISO timestamps: "2026-05-29T09:47:00.000Z"
 */
export function normalizeTransactionDate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string' || !rawDate.trim()) {
    return {
      isValid: false,
      valid: false,
      date: '',
      date_iso: '',
      error: 'Date is required and cannot be empty.',
    };
  }

  const str = rawDate.trim();

  // Handle full ISO timestamp: "2026-05-29T..."
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const isoPart = str.split('T')[0];
    return normalizeTransactionDate(isoPart);
  }

  let year = null;
  let month = null;
  let day = null;

  // 1. Check YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY
  if (!year) {
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  }

  // 3. Check DD Month YYYY (e.g. 10th Sep 26, 29 May 2026, 10 Sept 2026)
  if (!year) {
    const wordMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{2,4})$/);
    if (wordMatch) {
      day = parseInt(wordMatch[1], 10);
      const mStr = wordMatch[2].toLowerCase();
      month = MONTH_MAP[mStr] || null;
      let y = parseInt(wordMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  }

  // 4. Fallback search inside noisy OCR string (e.g. "Completed on 29 May 2026")
  if (!year) {
    const embeddedMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i);
    if (embeddedMatch) {
      day = parseInt(embeddedMatch[1], 10);
      const mStr = embeddedMatch[2].toLowerCase();
      month = MONTH_MAP[mStr] || null;
      let y = parseInt(embeddedMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  }

  // Calendar validation
  if (!year || !month || !day) {
    return {
      isValid: false,
      valid: false,
      date: str,
      date_iso: '',
      error: `Could not parse "${str}" as a valid transaction date. Supported formats: "DD Month YYYY", "DD/MM/YYYY", or "YYYY-MM-DD".`,
    };
  }

  if (year < 2000 || year > 2099) {
    return {
      isValid: false,
      valid: false,
      date: str,
      date_iso: '',
      error: `Invalid year ${year}. Transaction year must be between 2000 and 2099.`,
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      valid: false,
      date: str,
      date_iso: '',
      error: `Invalid month ${month}. Must be between 1 and 12.`,
    };
  }

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    return {
      isValid: false,
      valid: false,
      date: str,
      date_iso: '',
      error: `Invalid day ${day} for ${MONTH_NAMES[month - 1]} ${year} (max ${maxDays} days).`,
    };
  }

  // Construct canonical display & ISO strings without timezone offsets
  const pad = (n) => String(n).padStart(2, '0');
  const date_iso = `${year}-${pad(month)}-${pad(day)}`;
  const displayDate = `${pad(day)} ${MONTH_NAMES[month - 1]} ${year}`;

  return {
    isValid: true,
    valid: true,
    date: displayDate,
    date_iso,
    year,
    month,
    day,
    error: null,
  };
}

/**
 * Normalizes time string into standard 12-hour display format and hour/minute values.
 */
export function normalizeTransactionTime(rawTime) {
  if (!rawTime || typeof rawTime !== 'string' || !rawTime.trim()) {
    return {
      isValid: false,
      valid: false,
      time: '12:00 PM',
      hour: 12,
      minute: 0,
      error: 'Time is missing',
    };
  }

  const str = rawTime.trim();

  // Match 12-hour: "09:47 am", "9:47 AM", "12:06pm"
  const m12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([apAP][mM])?$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = parseInt(m12[2], 10);
    const p = m12[3] ? m12[3].toUpperCase() : null;

    if (m < 0 || m > 59) {
      return { isValid: false, valid: false, time: str, hour: 12, minute: 0, error: 'Invalid minute' };
    }

    if (p) {
      if (h < 1 || h > 12) {
        return { isValid: false, valid: false, time: str, hour: 12, minute: 0, error: 'Invalid hour for 12-hour clock' };
      }
      const hour24 = p === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
      const pad = (n) => String(n).padStart(2, '0');
      return {
        isValid: true,
        valid: true,
        time: `${pad(h)}:${pad(m)} ${p}`,
        hour: hour24,
        minute: m,
        error: null,
      };
    } else {
      // 24-hour format: "14:30"
      if (h < 0 || h > 23) {
        return { isValid: false, valid: false, time: str, hour: 12, minute: 0, error: 'Invalid hour' };
      }
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const pad = (n) => String(n).padStart(2, '0');
      return {
        isValid: true,
        valid: true,
        time: `${pad(h12)}:${pad(m)} ${period}`,
        hour: h,
        minute: m,
        error: null,
      };
    }
  }

  return {
    isValid: true,
    valid: true,
    time: str,
    hour: 12,
    minute: 0,
    error: null,
  };
}

/**
 * Safely creates a JavaScript Date object from a date string (ISO or display).
 * Returns null if invalid rather than throwing or creating an Invalid Date.
 */
export function safeParseDate(dateStr) {
  if (!dateStr) return null;
  const norm = normalizeTransactionDate(String(dateStr));
  if (!norm.isValid) return null;
  return new Date(`${norm.date_iso}T12:00:00.000Z`);
}

export default {
  normalizeTransactionDate,
  normalizeTransactionTime,
  safeParseDate,
};
