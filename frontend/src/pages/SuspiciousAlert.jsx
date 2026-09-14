// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Suspicious Transaction Alert Page (High / Critical Risk Result)
// ==============================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, ArrowLeft, ArrowRight,
  Lock, CheckCircle, Info, PhoneCall, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SuspiciousAlert() {
  const navigate = useNavigate();
  const { currentTransaction, currentAnalysis } = useApp();

  const txn = currentTransaction || {
    amount: 25000,
    receiver: 'UNKNOWN_RECIPIENT',
    receiver_upi: 'unknown.recv@ybl',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: '02:15 AM',
    transaction_id: 'TXNDEMO9991HIGH',
  };

  const analysis = currentAnalysis || {
    score: 87,
    level: 'CRITICAL',
    type: 'Combined Suspicious Pattern',
    factors: [
      { name: 'Severe Amount Deviation', contribution: 28, description: '₹25,000 far exceeds your historical baseline average.' },
      { name: 'New / First-Time Recipient', contribution: 20, description: 'UNKNOWN_RECIPIENT has never appeared in your verified history.' },
      { name: 'Unusual Time of Day', contribution: 18, description: '2:15 AM is outside normal active authorization hours (7 AM – 11 PM).' },
      { name: 'Structured Round Amount Pattern', contribution: 12, description: 'Exact high round amount pattern detected.' },
    ],
    recommendation: 'Verify the recipient before proceeding. If you did not initiate the transaction, contact your bank/payment provider through an official channel.',
  };

  const score = analysis.score ?? 87;
  const level = analysis.level || (score >= 80 ? 'CRITICAL' : 'HIGH');
  const badgeColor = level === 'CRITICAL' ? '#dc2626' : '#ef4444';

  const reasons = (analysis.factors || [])
    .filter(f => f.contribution > 0)
    .map(f => f.description || f.name);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Alert Header */}
      <div className="page-header text-center">
        <div className="flex items-center justify-center gap-2 mb-2" style={{ color: '#ef4444' }}>
          <ShieldAlert size={32} />
          <h1>⚠ SUSPICIOUS TRANSACTION</h1>
        </div>
        <p>High behavioural deviation detected against historical baseline.</p>
      </div>

      {/* Main Risk Score Box */}
      <div
        className="card mb-6 text-center"
        style={{
          border: `2px solid ${badgeColor}`,
          background: 'linear-gradient(180deg, #2b0b14 0%, #150810 100%)',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
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
          <span className="badge badge-critical" style={{ fontSize: '0.95rem', padding: '6px 16px', letterSpacing: '0.05em' }}>
            {level} RISK
          </span>
        </div>
      </div>

      {/* Transaction Summary Card */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Transaction Details</div>
          <span className="badge badge-high">{analysis.type || 'Suspicious Pattern'}</span>
        </div>
        <div className="grid grid-3">
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Amount</div>
            <div className="font-mono font-bold text-lg text-pink mt-1">₹{Number(txn.amount || 0).toLocaleString()}</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Recipient</div>
            <div className="font-semibold text-sm text-secondary mt-1">{txn.receiver}</div>
            <div className="text-xs text-tertiary font-mono">{txn.receiver_upi || '—'}</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
            <div className="text-xs text-tertiary">Time & Date</div>
            <div className="font-mono text-xs text-secondary mt-1">{txn.date} • {txn.time}</div>
          </div>
        </div>
      </div>

      {/* Detected Suspicious Patterns */}
      <div className="card mb-6" style={{ border: '1px solid #ef4444' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2 text-danger">
            <AlertTriangle size={18} color="#ef4444" />
            <span>Detected Suspicious / Fraud Patterns ({(analysis.detected_patterns_details || []).length})</span>
          </div>
          <span className="badge badge-critical">Active Risk</span>
        </div>

        <div className="flex flex-col gap-3">
          {(analysis.detected_patterns_details || []).map((item, idx) => (
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
          All 13 configured fraud and suspicion patterns were evaluated. The following patterns were checked but not found in this transaction:
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
          <span className="text-xs text-tertiary">Detected Suspicious Indicators</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="p-3 flex items-start gap-2.5"
              style={{
                background: 'var(--bg-card-subtle)',
                borderRadius: 8,
                borderLeft: '3px solid #ef4444'
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginTop: 6, flexShrink: 0 }} />
              <div className="text-xs text-secondary leading-relaxed">
                {r}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "What Next?" Actionable Recommendations */}
      <div className="card mb-6" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2 text-danger">
            <Lock size={16} />
            What Next?
          </div>
        </div>
        <div className="p-4" style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-sm font-semibold text-secondary leading-relaxed mb-3">
            {analysis.recommendation}
          </p>
          <ul className="text-xs text-tertiary leading-relaxed flex flex-col gap-1.5" style={{ listStyleType: 'disc', paddingLeft: 18 }}>
            <li>Verify the recipient name and UPI ID independently before authorizing any payment.</li>
            <li>If you did not initiate this transaction, do not approve any collect request in your UPI app.</li>
            <li>Contact your bank or payment provider through an official verified channel if needed.</li>
          </ul>
        </div>

        {/* Security Alert: Never Share PIN/OTP */}
        <div className="mt-4 p-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
          <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Security Reminder:</strong> Never share your UPI PIN, OTP, Bank Password, or Card PIN with anyone.
          </div>
        </div>
      </div>

      {/* Navigation & Disclaimer */}
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
