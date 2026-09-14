// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// OCR Extraction & Layout-Aware Field Mapping Pipeline
// App Recognition: BHIM / PhonePe / Google Pay
// ==============================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Edit3, Loader2, ArrowRight, FileCheck,
  AlertCircle, Sparkles, Smartphone, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const APP_BADGES = {
  bhim: { name: 'BHIM UPI', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  phonepe: { name: 'PhonePe', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)' },
  googlepay: { name: 'Google Pay', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' },
  unknown: { name: 'General UPI Receipt', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.35)' },
};

const CONFIDENCE_STYLES = {
  High: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  Low: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
  Uncertain: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
};

export default function OCRExtraction() {
  const navigate = useNavigate();
  const { ocrResult, setCurrentTransaction } = useApp();
  const [detectedApp, setDetectedApp] = useState(null);
  const [needsManualEntry, setNeedsManualEntry] = useState(false);

  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  const [fields, setFields] = useState({
    amount: '',
    date: '',
    time: '',
    recipient: '',
    upiId: '',
    senderUpi: '',
    transactionId: '',
    utr: '',
    remarks: '',
    debitedAccount: '',
    bank: '',
    paymentMode: 'UPI',
    paymentInstrument: 'Bank account',
    status: 'Successful',
    confidence: 95,
    fieldConfidences: {
      amount: 'High',
      recipient: 'High',
      transaction_id: 'High',
      date_time: 'High',
      upi_id: 'High',
      remarks: 'High',
    },
  });

  useEffect(() => {
    if (ocrResult?.extracted) {
      const ext = ocrResult.extracted;

      if (ext.detected_app) {
        setDetectedApp({
          key: ext.detected_app,
          display: ext.detected_app_display || ext.detected_app,
          confidence: ext.app_confidence || 0.95
        });
      }

      if (ext.needs_manual_entry) {
        setNeedsManualEntry(true);
        setIsEditing(true);
      }

      setFields({
        amount: ext.amount != null ? String(ext.amount) : '',
        date: ext.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: ext.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        recipient: ext.receiver || '',
        upiId: ext.receiver_upi || '',
        senderUpi: ext.sender_upi || '',
        transactionId: ext.transaction_id || '',
        utr: ext.utr || '',
        remarks: ext.remarks || '',
        debitedAccount: ext.debited_account || '',
        bank: ext.bank || '',
        paymentMode: ext.payment_mode || 'UPI',
        paymentInstrument: ext.payment_instrument || 'Bank account',
        status: ext.status || 'Successful',
        confidence: ext.confidence || 85,
        fieldConfidences: ext.field_confidences || {
          amount: ext.amount ? 'High' : 'Uncertain',
          recipient: ext.receiver ? 'High' : 'Uncertain',
          transaction_id: ext.transaction_id ? 'High' : 'Uncertain',
          date_time: ext.date ? 'High' : 'Uncertain',
          upi_id: ext.receiver_upi ? 'High' : 'Uncertain',
          remarks: ext.remarks ? 'High' : 'Medium',
        },
      });
    }

    const t1 = setTimeout(() => setStep(2), 300);
    const t2 = setTimeout(() => setStep(3), 600);
    const t3 = setTimeout(() => setStep(4), 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [ocrResult]);

  const handleFieldChange = (key, val) => {
    setFields(prev => ({ ...prev, [key]: val }));
  };

  const handleProceedToVerify = () => {
    const rawAmt = parseFloat(String(fields.amount).replace(/,/g, '')) || 0;
    const txn = {
      id: `ocr-${Date.now()}`,
      amount: rawAmt,
      date: fields.date,
      date_iso: new Date().toISOString().split('T')[0],
      time: fields.time,
      hour: 10,
      minute: 42,
      sender: 'Local User',
      sender_upi: fields.senderUpi || 'user@upi',
      receiver: fields.recipient,
      receiver_upi: fields.upiId,
      transaction_id: fields.transactionId || fields.utr || `TXN${Date.now()}`,
      utr: fields.utr,
      remarks: fields.remarks,
      debited_account: fields.debitedAccount,
      bank: fields.bank,
      payment_mode: fields.paymentMode,
      payment_instrument: fields.paymentInstrument,
      status: fields.status,
      merchant: fields.recipient,
      location: 'Localhost / Device',
      device: 'Mobile UPI App',
      source_type: 'screenshot',
      validated: false,
    };

    setCurrentTransaction(txn);
    navigate('/confirm');
  };

  const currentBadge = detectedApp ? (APP_BADGES[detectedApp.key] || APP_BADGES.unknown) : APP_BADGES.unknown;

  const renderConfidenceBadge = (level) => {
    const s = CONFIDENCE_STYLES[level] || CONFIDENCE_STYLES.Uncertain;
    return (
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 12,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        marginLeft: 6
      }}>
        {level || 'Medium'}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 940, margin: '0 auto', paddingBottom: '2.5rem' }}>
      <div className="page-header text-center">
        <h1>{step < 4 ? 'Recognizing UPI App & Extracting Data…' : 'Extracted Transaction Fields'}</h1>
        <p>Local PaddleOCR engine performs app recognition and layout-specific region field extraction.</p>
      </div>

      {/* Progress Step Pipeline */}
      <div className="card mb-6" style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--pink-border)' }}>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= 1 ? 'var(--pink-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
              1
            </div>
            <span className="text-xs text-secondary">Upload Received</span>
          </div>

          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= 2 ? 'var(--pink-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
              {step === 2 ? <Loader2 size={12} className="animate-spin" /> : '2'}
            </div>
            <span className="text-xs text-secondary">App Detected</span>
          </div>

          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= 3 ? 'var(--pink-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
              3
            </div>
            <span className="text-xs text-secondary">Layout Region OCR</span>
          </div>

          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= 4 ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
              {step >= 4 ? <CheckCircle size={14} /> : '4'}
            </div>
            <span className="text-xs text-secondary font-semibold">User Verification</span>
          </div>
        </div>
      </div>

      {/* Extracted Details Card */}
      {step >= 4 && (
        <div className="card animate-fade-in">
          {/* Detected App Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: currentBadge.bg,
            border: `1px solid ${currentBadge.border}`,
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
          }}>
            <div className="flex items-center gap-3">
              <Smartphone size={20} color={currentBadge.color} />
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Identified UPI Platform
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: currentBadge.color }}>
                  {currentBadge.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(0,0,0,0.3)',
                padding: '4px 10px',
                borderRadius: 6,
                color: currentBadge.color,
                border: `1px solid ${currentBadge.border}`
              }}>
                Layout-Based Extraction Active
              </span>
            </div>
          </div>

          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title flex items-center gap-2">
              <FileCheck size={18} color="var(--pink-light)" />
              Extracted Transaction Information
            </div>
            <button
              className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={14} /> {isEditing ? 'Done Editing' : 'Edit Values'}
            </button>
          </div>

          {/* Manual entry fallback notice if needed */}
          {needsManualEntry && (
            <div className="notice-box mb-4" style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8,
            }}>
              <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div className="text-sm text-secondary">
                <strong>OCR note:</strong> Some fields could not be cleanly read from the screenshot. Please enter them manually before proceeding.
              </div>
            </div>
          )}

          {/* Fields Grid */}
          <div className="grid grid-2 mb-6" style={{ gap: 16 }}>
            {/* Amount */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Transaction Amount (₹)</label>
                {renderConfidenceBadge(fields.fieldConfidences?.amount)}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input font-mono"
                  value={fields.amount}
                  onChange={e => handleFieldChange('amount', e.target.value)}
                />
              ) : (
                <div className="text-2xl font-bold font-mono text-pink">₹{fields.amount ? Number(fields.amount).toLocaleString() : '—'}</div>
              )}
            </div>

            {/* Recipient / Merchant */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Recipient / Merchant / Banking Name</label>
                {renderConfidenceBadge(fields.fieldConfidences?.recipient)}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={fields.recipient}
                  onChange={e => handleFieldChange('recipient', e.target.value)}
                />
              ) : (
                <div className="text-lg font-semibold">{fields.recipient || '—'}</div>
              )}
            </div>

            {/* Transaction ID / UTR */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Transaction ID / UTR</label>
                {renderConfidenceBadge(fields.fieldConfidences?.transaction_id)}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input font-mono"
                  value={fields.transactionId}
                  onChange={e => handleFieldChange('transactionId', e.target.value)}
                />
              ) : (
                <div className="text-base font-mono text-secondary">{fields.transactionId || fields.utr || '—'}</div>
              )}
            </div>

            {/* Date & Time */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Date & Time</label>
                {renderConfidenceBadge(fields.fieldConfidences?.date_time)}
              </div>
              {isEditing ? (
                <div className="grid grid-2" style={{ gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={fields.date}
                    placeholder="Date"
                    onChange={e => handleFieldChange('date', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={fields.time}
                    placeholder="Time"
                    onChange={e => handleFieldChange('time', e.target.value)}
                  />
                </div>
              ) : (
                <div className="text-base text-secondary">{fields.date} {fields.time ? `• ${fields.time}` : ''}</div>
              )}
            </div>

            {/* To UPI ID */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">To UPI ID / Recipient UPI ID</label>
                {renderConfidenceBadge(fields.fieldConfidences?.upi_id)}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input font-mono"
                  value={fields.upiId}
                  onChange={e => handleFieldChange('upiId', e.target.value)}
                />
              ) : (
                <div className="text-base font-mono text-secondary">{fields.upiId || '—'}</div>
              )}
            </div>

            {/* From UPI ID */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">From UPI ID</label>
                {renderConfidenceBadge(fields.senderUpi ? 'High' : 'Uncertain')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input font-mono"
                  value={fields.senderUpi}
                  onChange={e => handleFieldChange('senderUpi', e.target.value)}
                />
              ) : (
                <div className="text-base font-mono text-secondary">{fields.senderUpi || '—'}</div>
              )}
            </div>

            {/* Remarks / Purpose */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Remarks / Payment Purpose</label>
                {renderConfidenceBadge(fields.fieldConfidences?.remarks)}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={fields.remarks}
                  onChange={e => handleFieldChange('remarks', e.target.value)}
                />
              ) : (
                <div className="text-base text-secondary">{fields.remarks || '—'}</div>
              )}
            </div>

            {/* Debited Account & Bank */}
            <div className="form-group" style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0">Bank / Debited Account</label>
                {renderConfidenceBadge(fields.debitedAccount || fields.bank ? 'High' : 'Uncertain')}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={fields.debitedAccount || fields.bank}
                  onChange={e => handleFieldChange('debitedAccount', e.target.value)}
                />
              ) : (
                <div className="text-base text-secondary">
                  {fields.debitedAccount || fields.bank || '—'}
                </div>
              )}
            </div>
          </div>

          {/* Real Confidence Summary Table */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--pink-border)',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 24,
          }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} color="var(--pink-light)" />
                <strong style={{ fontSize: '0.9rem' }}>Field-Level OCR Confidence</strong>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--pink-light)' }}>
                Overall Accuracy: {fields.confidence}%
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Amount: {renderConfidenceBadge(fields.fieldConfidences?.amount)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Recipient: {renderConfidenceBadge(fields.fieldConfidences?.recipient)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Txn ID: {renderConfidenceBadge(fields.fieldConfidences?.transaction_id)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Date/Time: {renderConfidenceBadge(fields.fieldConfidences?.date_time)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                UPI ID: {renderConfidenceBadge(fields.fieldConfidences?.upi_id)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Remarks: {renderConfidenceBadge(fields.fieldConfidences?.remarks)}
              </div>
            </div>
          </div>

          {/* Next Step Notice */}
          <div className="notice-box info mb-6" style={{ padding: '10px 14px' }}>
            <ShieldCheck size={16} color="var(--pink-light)" style={{ flexShrink: 0 }} />
            <div className="text-xs text-secondary">
              <strong>Verification Step:</strong> The transaction is NOT saved yet. Review the details above, edit any values if needed, and click below to confirm and proceed to fraud risk analysis.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
              Re-upload Image
            </button>
            <button className="btn btn-primary" onClick={handleProceedToVerify}>
              Proceed to Confirmation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
