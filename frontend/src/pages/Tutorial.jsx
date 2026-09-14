// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// How It Works — Full Workflow + 12 Fraud Patterns + Risk Tiers
// ==============================================================================
import React, { useState } from 'react';
import {
  Upload, FileText, CheckCircle, Search, ShieldAlert,
  ArrowDown, ArrowRight, ShieldCheck, AlertTriangle, Info,
  HelpCircle, Activity, Clock, Users, Zap, MapPin, Smartphone,
  TrendingUp, RefreshCw, BarChart2, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WORKFLOW_STEPS = [
  {
    step: 1,
    label: 'UPLOAD',
    icon: <Upload size={20} color="var(--pink-light)" />,
    desc: 'Add a UPI screenshot or enter transaction details manually',
    color: 'var(--pink-primary)',
  },
  {
    step: 2,
    label: 'DETECT APP',
    icon: <Smartphone size={20} color="#8b5cf6" />,
    desc: 'System identifies if screenshot is from BHIM, PhonePe, or GPay',
    color: '#8b5cf6',
  },
  {
    step: 3,
    label: 'EXTRACT',
    icon: <FileText size={20} color="#f59e0b" />,
    desc: 'OCR reads Amount, Recipient, TXN ID, Date/Time, UPI ID',
    color: '#f59e0b',
  },
  {
    step: 4,
    label: 'VERIFY',
    icon: <CheckCircle size={20} color="#10b981" />,
    desc: 'You confirm extracted details before saving to SQLite database',
    color: '#10b981',
  },
  {
    step: 5,
    label: 'FRAUD ENGINE',
    icon: <Search size={20} color="var(--pink-light)" />,
    desc: 'Risk engine checks 13 behavioral patterns against your history',
    color: 'var(--pink-primary)',
  },
  {
    step: 6,
    label: 'RESULT',
    icon: <ShieldAlert size={20} color="#ef4444" />,
    desc: 'Risk score (0–100) + which patterns triggered + clear "Why?" explanation',
    color: '#ef4444',
  },
];

const PATTERNS = [
  {
    id: 'P1',
    name: 'Repeated Same-Amount Transactions',
    icon: <RefreshCw size={15} />,
    example: 'e.g. ₹1,000 at 9:00, 9:01 and 9:02',
    desc: 'Sending the exact same amount multiple times within 1–5 minutes. Common indicator of automated or scripted fraud.',
    contrib: 25,
    color: '#ef4444',
  },
  {
    id: 'P2',
    name: 'Doubling / Multiplying Amount',
    icon: <TrendingUp size={15} />,
    example: 'e.g. ₹100 → ₹200 → ₹400 → ₹800 to same person',
    desc: 'Amount to the same recipient roughly doubles each time. A known social-engineering escalation tactic.',
    contrib: 22,
    color: '#f97316',
  },
  {
    id: 'P3',
    name: 'Unusual Transaction Frequency Burst',
    icon: <Zap size={15} />,
    example: 'e.g. 8 transactions in 3 minutes',
    desc: 'A sudden burst of many transactions in a very short time — far above your normal daily count.',
    contrib: 20,
    color: '#f59e0b',
  },
  {
    id: 'P4',
    name: 'Amount Outside Historical Range',
    icon: <BarChart2 size={15} />,
    example: 'e.g. Your avg is ₹500 but transaction is ₹15,000',
    desc: 'Transaction value significantly exceeds your normal average or maximum historical amount.',
    contrib: 28,
    color: '#dc2626',
  },
  {
    id: 'P5',
    name: 'New Recipient + High Amount',
    icon: <Users size={15} />,
    example: 'e.g. First time sending ₹10,000 to an unknown person',
    desc: 'A first-time recipient combined with an unusually high amount — double the risk.',
    contrib: 25,
    color: '#ef4444',
  },
  {
    id: 'P6',
    name: 'New Recipient + Multiple Rapid Transactions',
    icon: <Activity size={15} />,
    example: 'e.g. 3 back-to-back transfers to a new contact',
    desc: 'Multiple rapid transactions to a new unverified contact — a strong social-engineering signal.',
    contrib: 22,
    color: '#f97316',
  },
  {
    id: 'P7',
    name: 'Multiple Different Recipients (Short Window)',
    icon: <Users size={15} />,
    example: 'e.g. Payments to 5 different people in 10 minutes',
    desc: 'Payments scattered to 4+ different recipients in a short time — may indicate account takeover.',
    contrib: 18,
    color: '#f59e0b',
  },
  {
    id: 'P8',
    name: 'Unusual Time of Day',
    icon: <Clock size={15} />,
    example: 'e.g. Transaction at 2:30 AM',
    desc: 'Transaction initiated during late night (11 PM – 5 AM) or very early morning — outside your normal active hours.',
    contrib: 18,
    color: '#8b5cf6',
  },
  {
    id: 'P9',
    name: 'Round / Structured Amount',
    icon: <Eye size={15} />,
    example: 'e.g. Exactly ₹10,000 to an unknown recipient',
    desc: 'Exact round amounts (₹1K, ₹5K, ₹10K, etc.) to an unknown recipient — common in test-fraud.',
    contrib: 12,
    color: '#6366f1',
  },
  {
    id: 'P10',
    name: 'Unrecognized Device',
    icon: <Smartphone size={15} />,
    example: 'e.g. Transaction from a new or unknown device',
    desc: 'Transaction initiated from a device not previously seen in your usage profile.',
    contrib: 12,
    color: '#3b82f6',
  },
  {
    id: 'P11',
    name: 'Geographic / Location Anomaly',
    icon: <MapPin size={15} />,
    example: 'e.g. Transaction from an unusual or unknown location',
    desc: 'Geographic location is inconsistent with your usual verified transaction geography.',
    contrib: 10,
    color: '#10b981',
  },
  {
    id: 'P12',
    name: 'Sudden Large-Value Spike',
    icon: <TrendingUp size={15} />,
    example: 'e.g. Recent avg ₹200, then suddenly ₹8,000',
    desc: 'Current amount is 3× or more than your recent session average — sudden escalation signal.',
    contrib: 20,
    color: '#ef4444',
  },
  {
    id: 'P13',
    name: 'Small Initial Payment + Unexpected AutoPay/Recurring Debit',
    icon: <RefreshCw size={15} />,
    example: 'Example: A user makes a small ₹1 payment, but an AutoPay/mandate may result in a much larger recurring debit such as ₹399 or ₹599 later. The system checks whether the transaction data shows this suspicious relationship.',
    desc: 'The system does not treat the ₹1 payment alone as fraud; it looks for supporting AutoPay/mandate or subsequent-debit indicators such as unexpected recurring debit setups of ₹399/₹599.',
    contrib: 30,
    color: '#ec4899',
  },
];

const RISK_TIERS = [
  { range: '0 – 29', level: 'LOW', badge: 'badge-low', desc: 'Consistent with your baseline. No major anomalies detected.', border: 'rgba(16,185,129,0.3)' },
  { range: '30 – 59', level: 'MEDIUM', badge: 'badge-medium', desc: 'Some variance detected (e.g. first-time contact or unusual time). Review before proceeding.', border: 'rgba(245,158,11,0.3)' },
  { range: '60 – 79', level: 'HIGH', badge: 'badge-high', desc: 'High deviation or rapid repeated patterns. Immediate verification needed.', border: 'rgba(239,68,68,0.3)' },
  { range: '80 – 100', level: 'CRITICAL', badge: 'badge-critical', desc: 'Multiple severe anomalies. Do NOT proceed with unfamiliar transaction.', border: 'rgba(220,38,38,0.4)' },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [expandedPattern, setExpandedPattern] = useState(null);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header text-center">
        <h1>How It Works</h1>
        <p>System workflow, fraud detection patterns, and risk scoring explained.</p>
      </div>

      {/* ── SECTION 1: Workflow ── */}
      {/* ── SECTION 1: System Workflow ── */}
      <div className="card mb-6" style={{ border: '1px solid var(--pink-border)' }}>
        <div className="card-header" style={{ justifyContent: 'center' }}>
          <div className="card-title flex items-center gap-2">
            <HelpCircle size={18} color="var(--pink-light)" />
            System Workflow
          </div>
        </div>

        {/* Simplified Flow String Banner */}
        <div style={{
          margin: '0 auto 20px',
          maxWidth: 780,
          background: 'rgba(236, 72, 153, 0.08)',
          border: '1px solid var(--pink-border)',
          borderRadius: 8,
          padding: '12px 16px',
          textAlign: 'center',
          color: 'var(--pink-light)',
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          lineHeight: '1.6',
        }}>
          Upload Screenshot → Detect BHIM/PhonePe/Google Pay → OCR Reads Text → Identify Fields → Validate Data → User Confirms → Transaction Saved → Fraud Analysis.
        </div>

        <div className="flex flex-col items-center gap-3 py-2">
          {WORKFLOW_STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <div
                style={{
                  width: 320,
                  background: 'var(--bg-card-subtle)',
                  border: `2px solid ${s.color}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  textAlign: 'center',
                  boxShadow: `0 4px 15px ${s.color}22`,
                }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 4 }}>
                  STEP {s.step}
                </div>
                <div className="flex items-center justify-center gap-2 font-bold text-sm text-secondary mb-1">
                  {s.icon} {s.label}
                </div>
                <div className="text-xs text-tertiary">{s.desc}</div>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ArrowDown size={18} color="var(--pink-light)" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-center mt-4 mb-2">
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            Try It Now — Upload Screenshot <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── SECTION 1.5: How Local OCR Works ── */}
      <div className="card mb-6" style={{ border: '1px solid var(--pink-border)' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <Smartphone size={18} color="var(--pink-light)" />
            How Local App-Aware OCR Works
          </div>
        </div>
        <p className="text-sm text-secondary mb-4">
          The system uses high-precision local <strong>PaddleOCR</strong> with app recognition rather than generic full-page text scraping. Different UPI apps have completely unique visual layouts:
        </p>

        <div className="grid grid-3 mb-4" style={{ gap: 14 }}>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="font-bold text-sm text-emerald-400 mb-1" style={{ color: '#10b981' }}>BHIM UPI Layout</div>
            <div className="text-xs text-tertiary">
              Recognizes green header, extracts large amount at the top, recipient banking name, transaction ID, date & time, To UPI ID, From UPI ID, debited account, and remarks from two structured columns.
            </div>
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="font-bold text-sm mb-1" style={{ color: '#a855f7' }}>PhonePe Layout</div>
            <div className="text-xs text-tertiary">
              Recognizes "Transaction Successful" header, extracts "Paid to" recipient and amount, recipient UPI ID, PhonePe Transaction ID (T...), UTR number, debited bank account, and partner bank.
            </div>
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)' }}>
            <div className="font-bold text-sm mb-1" style={{ color: '#38bdf8' }}>Google Pay Layout</div>
            <div className="text-xs text-tertiary">
              Recognizes "To [Name]" header, central large amount, payment status, timestamp, bank card (e.g. CSB 0801), UPI transaction ID, To/From UPI handles, and Google transaction ID.
            </div>
          </div>
        </div>

        <div className="notice-box info" style={{ padding: '10px 14px' }}>
          <ShieldCheck size={16} color="var(--pink-light)" style={{ flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Mandatory User Verification:</strong> No screenshot is ever saved automatically. Extracted fields are shown with genuine field-level confidence ratings, and the user must review and confirm the data before it is stored in SQLite and analyzed for fraud.
          </div>
        </div>
      </div>


      {/* ── SECTION 2: Risk Tiers ── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Risk Score Classification (0 – 100)</div>
        </div>
        <div className="grid grid-4">
          {RISK_TIERS.map(t => (
            <div
              key={t.level}
              className="p-3"
              style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: `1px solid ${t.border}` }}
            >
              <span className={`badge ${t.badge} mb-2`}>{t.range}</span>
              <div className="font-bold text-sm text-secondary mb-1">{t.level} RISK</div>
              <div className="text-xs text-tertiary">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: 13 Fraud Patterns ── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ShieldAlert size={18} color="var(--pink-light)" />
            13 Fraud Detection Patterns
          </div>
          <div className="text-xs text-tertiary">Click any pattern to see details</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: '0 0 8px 0' }}>
          {PATTERNS.map(p => (
            <div
              key={p.id}
              onClick={() => setExpandedPattern(expandedPattern === p.id ? null : p.id)}
              style={{
                background: 'var(--bg-card-subtle)',
                border: `1px solid ${expandedPattern === p.id ? p.color : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: expandedPattern === p.id ? `0 0 12px ${p.color}33` : 'none',
              }}
            >
              {/* Pattern header */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  style={{
                    background: p.color,
                    color: '#fff',
                    borderRadius: 6,
                    padding: '2px 7px',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.id}
                </span>
                <span style={{ color: p.icon.props.color || p.color, display: 'flex' }}>{p.icon}</span>
                <span className="text-xs font-bold text-secondary">{p.name}</span>
              </div>

              <div className="text-xs text-tertiary" style={{ fontStyle: 'italic', marginBottom: 4 }}>
                {p.example}
              </div>

              {/* Contribution bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1,
                  height: 5,
                  background: 'var(--border-subtle)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(p.contrib / 30) * 100}%`,
                    height: '100%',
                    background: p.color,
                    borderRadius: 3,
                    maxWidth: '100%',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: p.color, fontWeight: 700, minWidth: 40 }}>
                  +{p.contrib} pts
                </span>
              </div>

              {/* Expanded detail */}
              {expandedPattern === p.id && (
                <div
                  className="text-xs text-tertiary"
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${p.color}44`,
                    lineHeight: 1.6,
                  }}
                >
                  {p.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: How Score is Calculated ── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">How the Risk Score is Calculated</div>
        </div>
        <div style={{ padding: '4px 0' }}>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {[
              'Each pattern that fires adds points (contribution) to the score.',
              'Contributions are summed and capped at 100.',
              'The score maps to a risk tier: LOW (0–29), MEDIUM (30–59), HIGH (60–79), CRITICAL (80–100).',
              'Patterns are evaluated in order of severity — more dangerous patterns contribute more points.',
              'The "Why?" section tells you exactly which patterns triggered and why.',
            ].map((s, i) => (
              <li key={i} className="text-sm text-tertiary" style={{ marginBottom: 8, lineHeight: 1.6 }}>
                <span className="text-pink font-bold">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--pink-border)',
              borderRadius: 8,
              padding: '12px 16px',
              marginTop: 12,
            }}
          >
            <div className="text-xs text-secondary font-bold mb-1">Example Score Calculation</div>
            <div className="text-xs text-tertiary" style={{ fontFamily: 'monospace', lineHeight: 2 }}>
              P4 (Amount Outside Range) = +28<br />
              P5 (New Recipient + High Amt) = +25<br />
              P8 (Late Night Time) = +18<br />
              <strong style={{ color: 'var(--pink-light)' }}>Total = 71 → HIGH RISK</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="notice-box info">
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          This system evaluates UPI transaction risk using behavioral patterns and your historical data stored locally.
          It does not access bank accounts, initiate payments, or guarantee that any transaction is safe or fraudulent.
          Always verify with your bank for confirmed fraud cases.
        </div>
      </div>
    </div>
  );
}
