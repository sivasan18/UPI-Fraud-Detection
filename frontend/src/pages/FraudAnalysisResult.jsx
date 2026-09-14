// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Fraud Analysis Result Page (Clean, Student-Friendly Output)
// ==============================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert,
  ArrowLeft, CheckCircle, Info, Lock, ArrowRight, Upload
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function FraudAnalysisResult() {
  const navigate = useNavigate();
  const { currentTransaction, currentAnalysis } = useApp();

  const txn = currentTransaction || {
    amount: 1200,
    receiver: 'Coffee House',
    receiver_upi: 'coffeehouse@upi',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: '11:30 AM',
    transaction_id: 'TXN123456789',
  };

  const analysis = currentAnalysis || {
    score: 18,
    level: 'LOW',
    type: 'Normal Transaction',
    factors: [
      { name: 'Known Recipient', contribution: 0, description: 'Matches historical frequent contacts.' },
      { name: 'Normal Amount Range', contribution: 2, description: '₹1,200 is within typical spending boundaries.' },
      { name: 'Standard Hours', contribution: 0, description: '11:30 AM is within normal active authorization hours.' }
    ],
    recommendation: 'Transaction appears consistent with the available history. Proceed only if you recognize it.'
  };

  const score = analysis.score ?? 18;
  const level = analysis.level || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');
  const isCritical = level === 'CRITICAL';
  const isHigh = level === 'HIGH';
  const isMedium = level === 'MEDIUM';
  const isLow = level === 'LOW';

  const badgeColor = isCritical ? '#dc2626' : isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';
  const badgeClass = isCritical ? 'badge-critical' : isHigh ? 'badge-high' : isMedium ? 'badge-medium' : 'badge-low';

  // "Why?" reasons
  const reasons = (analysis.factors || [])
    .filter(f => f.contribution > 0 || isLow)
    .map(f => f.description || f.name);

  // Default "What Next?"
  let whatNextText = analysis.recommendation;
  if (isLow) {
    whatNextText = "Proceed only if you recognize and intend to make the transaction.";
  } else if (isMedium) {
    whatNextText = "Review the transaction details and verify the recipient identity before completing the transfer.";
  } else if (isHigh) {
    whatNextText = "Verify the recipient before proceeding. If you did not initiate this transaction, do not share your UPI PIN or OTP and contact your bank or payment provider through an official channel.";
  } else {
    whatNextText = "Do not proceed with an unfamiliar transaction. Verify it independently and contact your bank/payment provider through an official channel if necessary.";
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isLow && <ShieldCheck size={28} color="var(--risk-low)" />}
          {isMedium && <AlertCircle size={28} color="#f59e0b" />}
          {(isHigh || isCritical) && <ShieldAlert size={28} color="#ef4444" />}
          <h1>
            {isLow && '✓ LOW RISK RESULT'}
            {isMedium && '⚠ MEDIUM RISK RESULT'}
            {(isHigh || isCritical) && '⚠ SUSPICIOUS TRANSACTION'}
          </h1>
        </div>
        <p>AI Risk Assessment & Explainable Feature Attribution</p>
      </div>

      {/* Main Risk Score Card Box */}
      <div
        className="card mb-6 text-center"
        style={{
          border: `2px solid ${badgeColor}`,
          background: 'linear-gradient(180deg, #1c1024 0%, #110918 100%)',
          boxShadow: `0 8px 30px ${isLow ? 'rgba(16,185,129,0.15)' : 'rgba(236,72,153,0.2)'}`,
          padding: '2rem'
        }}
      >
        <div className="text-xs font-mono uppercase tracking-widest text-tertiary mb-1">
          RISK SCORE
        </div>
        <div
          className="font-mono font-extrabold my-2"
          style={{ fontSize: '3.5rem', lineHeight: 1, color: badgeColor }}
        >
          {score} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/ 100</span>
        </div>
        <div className="mt-2">
          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.95rem', padding: '6px 16px', letterSpacing: '0.05em' }}>
            {level} RISK
          </span>
        </div>
      </div>

      {/* Transaction Details Summary */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Transaction Details</div>
          <span className="badge badge-pink">{analysis.type || 'Evaluated Pattern'}</span>
        </div>
        <div className="grid grid-3">
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Amount</div>
            <div className="font-mono font-bold text-lg text-pink mt-1">₹{Number(txn.amount || 0).toLocaleString()}</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Recipient</div>
            <div className="font-semibold text-sm text-secondary mt-1">{txn.receiver}</div>
            <div className="text-xs text-tertiary font-mono">{txn.receiver_upi || ''}</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Time & Date</div>
            <div className="font-mono text-xs text-secondary mt-1">{txn.date} • {txn.time}</div>
          </div>
        </div>
      </div>

      {/* Detected Suspicious Patterns */}
      <div className="card mb-6" style={{ border: (analysis.detected_patterns_details || []).length > 0 ? '1px solid #ef4444' : '1px solid var(--border-subtle)' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <AlertTriangle size={18} color={(analysis.detected_patterns_details || []).length > 0 ? '#ef4444' : 'var(--risk-low)'} />
            <span>Detected Suspicious / Fraud Patterns ({(analysis.detected_patterns_details || []).length})</span>
          </div>
          {(analysis.detected_patterns_details || []).length > 0 ? (
            <span className="badge badge-critical">Active Risk</span>
          ) : (
            <span className="badge badge-low">Zero Anomalies</span>
          )}
        </div>

        {(analysis.detected_patterns_details || []).length === 0 ? (
          <div className="p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
            <CheckCircle size={22} color="var(--risk-low)" className="mx-auto mb-1" />
            <div className="font-semibold text-xs text-emerald-400">No Fraud Patterns Detected</div>
            <div className="text-xs text-tertiary mt-1">Transaction is consistent with normal baseline spending behavior.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {analysis.detected_patterns_details.map((item, idx) => (
              <div
                key={idx}
                className="p-3"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: 8,
                  borderLeft: '4px solid #ef4444',
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-xs text-pink flex items-center gap-2">
                    <AlertCircle size={14} color="#ef4444" />
                    <span>{item.name}</span>
                  </div>
                  <span className="badge badge-high text-xs">+{item.contribution} Risk Score</span>
                </div>
                <div className="text-xs text-secondary leading-relaxed pl-5">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patterns Checked / Not Detected (Never Hidden) */}
      <div className="card mb-6">
        <div className="card-header pb-2">
          <div className="card-title flex items-center gap-2">
            <ShieldCheck size={18} color="var(--risk-low)" />
            <span>Patterns Checked / Not Detected ({(analysis.not_detected_patterns || []).length} of 13)</span>
          </div>
          <span className="badge badge-secondary">All 13 Evaluated</span>
        </div>
        <p className="text-xs text-tertiary mb-3">
          All 13 configured fraud and suspicion patterns were evaluated. The following patterns were checked but not detected in this transaction:
        </p>

        <div className="flex flex-col gap-2">
          {(analysis.not_detected_patterns || []).map((pat, idx) => (
            <div
              key={idx}
              className="p-3 flex items-start justify-between gap-3"
              style={{
                background: 'var(--bg-card-subtle)',
                borderRadius: 8,
                borderLeft: pat.status?.includes('Insufficient') ? '3px solid #f59e0b' : '3px solid rgba(16,185,129,0.3)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} color={pat.status?.includes('Insufficient') ? '#f59e0b' : '#10b981'} />
                  <span className="font-semibold text-xs text-secondary">{pat.name}</span>
                  <span className={`badge ${pat.status?.includes('Insufficient') ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                    {pat.status || 'Not Detected'}
                  </span>
                </div>
                <div className="text-xs text-tertiary leading-relaxed pl-5">
                  {pat.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Why?" Section */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Why?</div>
          <span className="text-xs text-tertiary">Detected Factors</span>
        </div>
        <div className="flex flex-col gap-2">
          {reasons.length === 0 ? (
            <div className="text-xs text-secondary">
              No significant suspicious indicators were detected.
            </div>
          ) : (
            reasons.map((r, i) => (
              <div
                key={i}
                className="p-3 flex items-start gap-2.5"
                style={{
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 8,
                  borderLeft: `3px solid ${badgeColor}`
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor, marginTop: 6, flexShrink: 0 }} />
                <div className="text-xs text-secondary leading-relaxed">
                  {r}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* "What Next?" Section */}
      <div className="card mb-6" style={{ border: '1px solid var(--pink-border)' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <Lock size={16} color="var(--pink-light)" />
            What Next?
          </div>
        </div>
        <div className="p-4" style={{ background: 'rgba(236,72,153,0.06)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
          <p className="text-sm font-semibold text-secondary leading-relaxed">
            {whatNextText}
          </p>
        </div>

        {/* Security Alert: Never Share PIN/OTP */}
        <div className="mt-4 p-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
          <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Security Reminder:</strong> Never share your UPI PIN, OTP, Bank Password, or Debit/Credit Card PIN with anyone.
          </div>
        </div>
      </div>

      {/* Actions & Disclaimer */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>
          <ArrowLeft size={14} /> Back to History
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/analyse')}>
          Analyse Another Transaction <ArrowRight size={14} />
        </button>
      </div>

      <div className="notice-box info">
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Prototype Notice:</strong> This project is for risk assessment demonstration only. It does not actually initiate or block UPI payments.
        </div>
      </div>
    </div>
  );
}
