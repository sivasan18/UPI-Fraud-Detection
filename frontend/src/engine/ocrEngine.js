// ==============================================================================
// Smart UPI Fraud Detection System
// Client-Side OCR & Heuristic UPI Layout Engine (WASM-based via Tesseract.js)
// Extracts fields from BHIM, PhonePe, and Google Pay screenshots.
// Zero backend dependency; screenshots are processed in memory and discarded.
// ==============================================================================
import { createWorker } from 'tesseract.js';

export const APP_KEYWORDS = {
  bhim: [
    'bhim', 'banking name', 'debited account', 'payment instrument',
    'payment mode', 'send money', 'process details', 'npci', 'paid in',
  ],
  phonepe: [
    'phonepe', 'phone pe', 'transfer details', 'phonepe transaction id',
    'debited from', 'paid to', 'utr:', 'utr :',
  ],
  googlepay: [
    'google pay', 'gpay', 'google transaction id', 'pay again',
    'csb', 'cicag', 'completed', 'to:', 'from:',
  ],
};

export const APP_DISPLAY_NAMES = {
  bhim: 'BHIM UPI',
  phonepe: 'PhonePe',
  googlepay: 'Google Pay',
  unknown: 'General UPI',
};

/**
 * Preprocesses an image using an offscreen HTML5 canvas:
 * Upscales small images for fine text and boosts contrast.
 */
async function preprocessImage(imageSource) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const url = typeof imageSource === 'string'
      ? imageSource
      : URL.createObjectURL(imageSource);

    img.onload = () => {
      let w = img.width;
      let h = img.height;

      // Upscale if width < 800px
      if (w < 800 && w > 0) {
        const scale = 800.0 / w;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }

      // Draw and apply light contrast enhancement
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const contrast = 1.15;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
      }
      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (typeof imageSource !== 'string') {
          URL.revokeObjectURL(url);
        }
        if (blob) {
          resolve(blob);
        } else {
          resolve(imageSource);
        }
      }, 'image/png');
    };

    img.onerror = () => {
      resolve(imageSource);
    };

    img.src = url;
  });
}

/**
 * Cleans numeric amount string into a float.
 * E.g., '₹55,000.00' or 'Rs 4,000' -> 55000 or 4000.
 */
export function cleanAmountValue(text) {
  if (!text) return null;
  const str = String(text);
  if (str.includes('+91') || str.includes('·') || str.includes('…')) return null;

  const cleaned = str
    .replace(/₹/g, '')
    .replace(/Rs\.?/gi, '')
    .replace(/INR/gi, '')
    .replace(/Paid/gi, '')
    .trim();

  const match = cleaned.match(/(?:^|[\s₹])([\d,]+(?:\.\d{1,2})?)(?:$|[\s])/i) ||
    cleaned.match(/([\d,]+(?:\.\d{1,2})?)/);

  if (match) {
    const raw = match[1].replace(/,/g, '');
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 1 && val < 100000000 && raw.length <= 9) {
      return val;
    }
  }
  return null;
}

/**
 * Parses date and time from text tokens.
 */
export function parseDateTimeStrings(text) {
  let dateStr = '';
  let timeStr = '';
  const str = String(text || '');

  // Time regex: 12:06 pm, 9:47 am, 14:30
  const timeMatch = str.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i);
  if (timeMatch) {
    timeStr = timeMatch[1].trim().replace(/(\d{1,2}:\d{2})\s*([apAP][mM])/, '$1 $2');
  }

  // Date regex: e.g. 10th Sep 2026, 29 May 2026, 10/09/2026
  const dateMatch = str.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  if (dateMatch) {
    dateStr = dateMatch[1].trim().replace(/(\d+)(?:st|nd|rd|th)/i, '$1');
  }

  return { date: dateStr, time: timeStr };
}

/**
 * Detects the UPI application from recognized text.
 */
export function detectUpiApp(fullText = '') {
  const textLower = fullText.toLowerCase();
  const scores = { bhim: 0, phonepe: 0, googlepay: 0 };

  for (const [app, kws] of Object.entries(APP_KEYWORDS)) {
    for (const kw of kws) {
      if (textLower.includes(kw)) {
        scores[app] += 2;
      }
    }
  }

  if (textLower.includes('bhim') || textLower.includes('banking name')) scores.bhim += 5;
  if (textLower.includes('phonepe') || textLower.includes('phonepe transaction id') || textLower.includes('transfer details')) scores.phonepe += 5;
  if (textLower.includes('google pay') || textLower.includes('gpay') || textLower.includes('google transaction id') || textLower.includes('cicag')) scores.googlepay += 5;

  let bestApp = 'unknown';
  let bestScore = 0;
  for (const [app, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s;
      bestApp = app;
    }
  }

  if (bestScore < 3) {
    return { app: 'unknown', confidence: 0.45, name: APP_DISPLAY_NAMES.unknown };
  }

  const confidence = Math.min(0.99, Math.max(0.6, bestScore / 12.0));
  return {
    app: bestApp,
    confidence: Math.round(confidence * 100) / 100,
    name: APP_DISPLAY_NAMES[bestApp] || APP_DISPLAY_NAMES.unknown,
  };
}

/**
 * Extracts fields from BHIM layout.
 */
function extractBhimLayout(lines = [], fullText = '') {
  const res = {
    amount: null,
    receiver: '',
    receiver_upi: '',
    sender_upi: '',
    transaction_id: '',
    utr: '',
    date: '',
    time: '',
    status: 'Completed',
    remarks: '',
    payment_mode: 'UPI',
    bank: '',
    autopay_mandate: '',
    expected_recurring_amount: null,
  };

  const dt = parseDateTimeStrings(fullText);
  res.date = dt.date;
  res.time = dt.time;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const lLower = l.toLowerCase();

    // Amount (often in top lines with currency sign)
    if (!res.amount && (l.includes('₹') || l.toLowerCase().includes('rs') || cleanAmountValue(l))) {
      const amt = cleanAmountValue(l);
      if (amt) res.amount = amt;
    }

    // Banking Name
    if (lLower.includes('banking name') || lLower.includes('paid to')) {
      const next = lines[i + 1] || '';
      if (next && !next.toLowerCase().includes('transaction')) {
        res.receiver = next.trim();
      }
    }

    // Transaction ID / UTR
    if (lLower.includes('transaction id') || lLower.includes('utr')) {
      const match = l.match(/\b\d{10,18}\b/) || (lines[i + 1] && lines[i + 1].match(/\b\d{10,18}\b/));
      if (match) {
        res.transaction_id = match[0];
        res.utr = match[0];
      }
    }

    // UPI IDs
    const upiMatch = l.match(/[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/);
    if (upiMatch) {
      if (!res.receiver_upi) {
        res.receiver_upi = upiMatch[0];
      } else if (!res.sender_upi && upiMatch[0] !== res.receiver_upi) {
        res.sender_upi = upiMatch[0];
      }
    }

    // Remarks
    if (lLower.includes('remarks') || lLower.includes('note')) {
      const parts = l.split(/remarks?:?/i);
      if (parts[1]?.trim()) {
        res.remarks = parts[1].trim();
      } else if (lines[i + 1]) {
        res.remarks = lines[i + 1].trim();
      }
    }
  }

  return res;
}

/**
 * Extracts fields from PhonePe layout.
 */
function extractPhonePeLayout(lines = [], fullText = '') {
  const res = {
    amount: null,
    receiver: '',
    receiver_upi: '',
    sender_upi: '',
    transaction_id: '',
    utr: '',
    date: '',
    time: '',
    status: 'Completed',
    remarks: '',
    payment_mode: 'PhonePe UPI',
    bank: '',
    autopay_mandate: '',
    expected_recurring_amount: null,
  };

  const dt = parseDateTimeStrings(fullText);
  res.date = dt.date;
  res.time = dt.time;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const lLower = l.toLowerCase();

    // Amount
    if (!res.amount && (l.includes('₹') || cleanAmountValue(l))) {
      const amt = cleanAmountValue(l);
      if (amt) res.amount = amt;
    }

    // Paid to / Receiver
    if (lLower.includes('paid to') || lLower.includes('transfer to')) {
      const parts = l.split(/paid to|transfer to/i);
      if (parts[1]?.trim()) {
        res.receiver = parts[1].trim();
      } else if (lines[i + 1]) {
        res.receiver = lines[i + 1].trim();
      }
    }

    // PhonePe Transaction ID (T followed by digits)
    const phonePeTid = l.match(/T\d{18,24}/i);
    if (phonePeTid) {
      res.transaction_id = phonePeTid[0];
    }

    // UTR
    const utrMatch = l.match(/UTR\s*:?\s*(\d{10,18})/i) || l.match(/\b\d{12}\b/);
    if (utrMatch) {
      res.utr = utrMatch[1] || utrMatch[0];
      if (!res.transaction_id) res.transaction_id = res.utr;
    }

    // UPI ID
    const upiMatch = l.match(/[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/);
    if (upiMatch && !res.receiver_upi) {
      res.receiver_upi = upiMatch[0];
    }
  }

  return res;
}

/**
 * Extracts fields from Google Pay layout.
 */
function extractGooglePayLayout(lines = [], fullText = '') {
  const res = {
    amount: null,
    receiver: '',
    receiver_upi: '',
    sender_upi: '',
    transaction_id: '',
    utr: '',
    date: '',
    time: '',
    status: 'Completed',
    remarks: '',
    payment_mode: 'Google Pay',
    bank: '',
    autopay_mandate: '',
    expected_recurring_amount: null,
  };

  const dt = parseDateTimeStrings(fullText);
  res.date = dt.date;
  res.time = dt.time;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const lLower = l.toLowerCase();

    // Amount
    if (!res.amount && (l.includes('₹') || cleanAmountValue(l))) {
      const amt = cleanAmountValue(l);
      if (amt) res.amount = amt;
    }

    // Receiver (often top name before UPI ID or 'Paid to')
    if (lLower.includes('to:') || lLower.includes('paid to')) {
      const parts = l.split(/to:|paid to/i);
      if (parts[1]?.trim()) {
        res.receiver = parts[1].trim();
      } else if (lines[i + 1]) {
        res.receiver = lines[i + 1].trim();
      }
    }

    // Google Transaction ID / CICAG / UPI Ref
    const gpayMatch = l.match(/CICAG[a-zA-Z0-9]+/i) || l.match(/UPI transaction ID\s*:?\s*(\d{10,18})/i);
    if (gpayMatch) {
      res.transaction_id = gpayMatch[1] || gpayMatch[0];
      res.utr = res.transaction_id;
    }

    // UPI ID
    const upiMatch = l.match(/[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/);
    if (upiMatch && !res.receiver_upi) {
      res.receiver_upi = upiMatch[0];
    }
  }

  return res;
}

/**
 * Fallback General UPI layout extractor.
 */
function extractGeneralLayout(lines = [], fullText = '') {
  const res = {
    amount: cleanAmountValue(fullText) || 0,
    receiver: '',
    receiver_upi: '',
    sender_upi: '',
    transaction_id: '',
    utr: '',
    date: '',
    time: '',
    status: 'Completed',
    remarks: '',
    payment_mode: 'UPI',
    bank: '',
    autopay_mandate: '',
    expected_recurring_amount: null,
  };

  const dt = parseDateTimeStrings(fullText);
  res.date = dt.date;
  res.time = dt.time;

  for (const l of lines) {
    const upiMatch = l.match(/[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/);
    if (upiMatch && !res.receiver_upi) {
      res.receiver_upi = upiMatch[0];
    }
    const numMatch = l.match(/\b\d{12}\b/);
    if (numMatch && !res.transaction_id) {
      res.transaction_id = numMatch[0];
      res.utr = numMatch[0];
    }
  }

  return res;
}

/**
 * Main OCR pipeline function.
 * Accepts a File or Blob, processes it client-side with Tesseract.js,
 * parses fields, and returns a structured transaction object.
 */
export async function processImageOCR(imageFile, _onProgress = null) {
  const preprocessed = await preprocessImage(imageFile);

  const worker = await createWorker('eng');

  try {
    const ret = await worker.recognize(preprocessed);
    const fullText = ret.data.text || '';
    const lines = fullText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const appInfo = detectUpiApp(fullText);

    let extracted;
    if (appInfo.app === 'bhim') {
      extracted = extractBhimLayout(lines, fullText);
    } else if (appInfo.app === 'phonepe') {
      extracted = extractPhonePeLayout(lines, fullText);
    } else if (appInfo.app === 'googlepay') {
      extracted = extractGooglePayLayout(lines, fullText);
    } else {
      extracted = extractGeneralLayout(lines, fullText);
    }

    // Default missing fields safely
    if (!extracted.date) {
      const now = new Date();
      extracted.date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (!extracted.time) {
      const now = new Date();
      extracted.time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (!extracted.transaction_id) {
      extracted.transaction_id = `UPI${Date.now().toString().slice(-8)}`;
      extracted.utr = extracted.transaction_id;
    }
    if (!extracted.receiver) {
      extracted.receiver = extracted.receiver_upi
        ? extracted.receiver_upi.split('@')[0]
        : 'UPI Merchant / Recipient';
    }

    extracted.detected_app = appInfo.app;
    extracted.detected_app_display = appInfo.name;
    extracted.app_confidence = appInfo.confidence;
    extracted.confidence = appInfo.confidence;
    extracted.field_confidences = {
      amount: extracted.amount ? 'High' : 'Uncertain',
      recipient: extracted.receiver ? 'High' : 'Uncertain',
      transaction_id: extracted.transaction_id ? 'High' : 'Uncertain',
      date_time: extracted.date ? 'High' : 'Uncertain',
      upi_id: extracted.receiver_upi ? 'High' : 'Uncertain',
      remarks: extracted.remarks ? 'High' : 'Uncertain',
    };

    return {
      success: true,
      app: appInfo.app,
      appName: appInfo.name,
      appConfidence: appInfo.confidence,
      extracted,
      rawText: fullText,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Statement parser for CSV and text statements in browser.
 */
export async function processStatement(file) {
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rows.length < 2) {
    throw new Error('Statement does not contain enough data rows.');
  }

  const delimiter = text.includes(',') ? ',' : '\t';
  const headers = rows[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] || '';
    });

    const amount =
      cleanAmountValue(rowObj.amount || rowObj['debit'] || rowObj['transaction amount']) || 0;
    if (amount <= 0) continue;

    results.push({
      amount,
      date: rowObj.date || new Date().toISOString().split('T')[0],
      time: rowObj.time || '12:00 PM',
      receiver: rowObj.receiver || rowObj.description || rowObj.particulars || 'Recipient',
      receiver_upi: rowObj['upi id'] || rowObj['upi_id'] || '',
      transaction_id: rowObj['transaction id'] || rowObj.utr || `STMT${i}`,
      status: rowObj.status || 'Completed',
      source_type: 'statement',
    });
  }

  return results;
}

export default {
  processImageOCR,
  processStatement,
  detectUpiApp,
  cleanAmountValue,
};
