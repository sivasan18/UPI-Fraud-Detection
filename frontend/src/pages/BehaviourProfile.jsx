// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// User Behaviour Profile Page (Simple, Student-Friendly Metrics)
// ==============================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle, ShieldCheck, AlertTriangle, TrendingUp, Clock,
  Users, DollarSign, Activity, Calendar, ArrowRight, Upload, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BehaviourProfile() {
  const navigate = useNavigate();
  const { currentMode, behaviourProfile, totalTransactions } = useApp();

  const profile = behaviourProfile || {
    totalCount: 0,
    validatedCount: 0,
    profileReady: false,
    status: 'Not Ready',
    avgAmount: 0,
    maxAmount: 0,
    minAmount: 0,
    frequentRecipients: [],
    typicalTimeRange: '7:00 AM – 11:00 PM',
    dailyAvgCount: 0,
  };

  const isReady = (profile.totalCount || 0) >= 100;
  const count = profile.totalCount || 0;
  const mostCommonRecipient = profile.frequentRecipients && profile.frequentRecipients.length > 0
    ? profile.frequentRecipients[0]
    : 'None yet';

  const normalMin = profile.minAmount || 0;
  const normalMax = profile.maxAmount || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>User Behaviour Profile</h1>
          <p>Statistical baseline computed from historical transactions in SQLite.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <Upload size={15} /> Upload History
        </button>
      </div>

      {/* 100 Transaction Profile Progress Card */}
      <div className="card mb-6" style={{ border: '1px solid var(--pink-border)' }}>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              {isReady ? (
                <ShieldCheck size={22} color="var(--risk-low)" />
              ) : (
                <AlertTriangle size={22} color="#f59e0b" />
              )}
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {isReady ? 'Behaviour Profile Ready' : 'Behaviour Profile Baseline Incomplete'}
              </h2>
            </div>
            <p className="text-xs text-secondary mt-1">
              Recommended minimum: <strong>100 validated transactions</strong>.
            </p>
          </div>
          <span className={`badge ${isReady ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            Transaction Profile: {count} / 100
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-2 flex justify-between text-xs text-tertiary font-mono">
          <span>Profile Calibration: {count} / 100 Transactions</span>
          <span>{Math.min(100, Math.round((count / 100) * 100))}%</span>
        </div>
        <div className="progress-bar mb-3">
          <div
            className={`progress-bar-fill ${isReady ? 'success' : 'pink'}`}
            style={{ width: `${Math.min(100, (count / 100) * 100)}%` }}
          />
        </div>

        {!isReady && (
          <div className="notice-box info" style={{ padding: '0.65rem 0.9rem', marginBottom: 0 }}>
            <Info size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-secondary">
              <strong>Notice:</strong> Behaviour analysis may be limited because the transaction history is small ({count} / 100). The system will still perform risk assessment using general heuristic rules.
            </div>
          </div>
        )}
      </div>

      {/* 6 Basic Behavioural Metrics */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Basic Behavioural Baseline Metrics</div>
        </div>

        <div className="grid grid-3">
          {/* 1. Average Amount */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Average Transaction Amount</div>
            <div className="font-semibold text-xl font-mono text-pink mt-1">
              ₹{Number(profile.avgAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-secondary mt-1">Typical spending benchmark</div>
          </div>

          {/* 2. Most Common Recipient */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Most Common Recipient</div>
            <div className="font-semibold text-lg text-secondary mt-1 truncate" title={mostCommonRecipient}>
              {mostCommonRecipient}
            </div>
            <div className="text-xs text-secondary mt-1">Top verified contact</div>
          </div>

          {/* 3. Typical Transaction Time */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Typical Transaction Time</div>
            <div className="font-semibold text-base text-secondary mt-1 font-mono">
              {profile.typicalTimeRange || '7:00 AM – 11:00 PM'}
            </div>
            <div className="text-xs text-secondary mt-1">Active daily window</div>
          </div>

          {/* 4. Number of Transactions */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Number of Transactions</div>
            <div className="font-semibold text-xl font-mono text-pink mt-1">
              {count}
            </div>
            <div className="text-xs text-secondary mt-1">Total recorded in SQLite</div>
          </div>

          {/* 5. Average Daily Transactions */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Average Daily Transactions</div>
            <div className="font-semibold text-xl font-mono text-pink mt-1">
              {profile.dailyAvgCount || (count > 0 ? (count / 30).toFixed(1) : 0)} / day
            </div>
            <div className="text-xs text-secondary mt-1">Daily frequency baseline</div>
          </div>

          {/* 6. Normal Transaction Amount Range */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Normal Amount Range</div>
            <div className="font-semibold text-base font-mono text-pink mt-1">
              ₹{Number(normalMin).toLocaleString()} – ₹{Number(normalMax).toLocaleString()}
            </div>
            <div className="text-xs text-secondary mt-1">Standard spending boundaries</div>
          </div>
        </div>
      </div>

      {/* Academic Note */}
      <div className="notice-box info">
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Note:</strong> The baseline profile is calculated locally in SQLite using simple descriptive statistics (mean, min, max, frequency distribution). A new transaction is compared against these boundaries to identify risk indicators.
        </div>
      </div>
    </div>
  );
}
