// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Dashboard Page (Clean, Elegant, Student-Project Style)
// ==============================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle, AlertTriangle, ShieldAlert,
  Upload, Search, ArrowRight, Eye, Trash2, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentMode,
    totalTransactions,
    validTransactions,
    suspiciousTransactions,
    highRiskTransactions,
    transactions,
    alerts,
    deleteTransaction,
    setCurrentTransaction
  } = useApp();

  const recentTxns = transactions.slice(0, 8);
  const recentAlerts = alerts.slice(0, 5);

  const handleView = (txn) => {
    setCurrentTransaction(txn);
    navigate('/result');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction record?')) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>Dashboard</h1>
          <p>Monitor transactions, risk and suspicious activity.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
            <Upload size={15} /> Upload Transaction
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/analyse')}>
            <Search size={15} /> Analyse Transaction
          </button>
        </div>
      </div>

      {/* Demo Mode Synthetic Data Notice */}
      {currentMode === 'DEMO' && (
        <div className="notice-box info mb-5" style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.06)' }}>
          <AlertTriangle size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="text-xs text-secondary">
            <strong className="text-pink">DEMO MODE</strong> — Synthetic data for project demonstration. Active Mode data is not affected.
          </div>
        </div>
      )}

      {/* 4 Core Stat Cards */}
      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-icon pink"><Activity size={18} /></div>
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{totalTransactions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green"><CheckCircle size={18} /></div>
          <div className="stat-label">Valid Transactions</div>
          <div className="stat-value">{validTransactions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon yellow"><AlertTriangle size={18} /></div>
          <div className="stat-label">Suspicious Transactions</div>
          <div className="stat-value">{suspiciousTransactions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon red"><ShieldAlert size={18} /></div>
          <div className="stat-label">High Risk</div>
          <div className="stat-value">{highRiskTransactions}</div>
        </div>
      </div>

      {/* 100 Transaction Profile Baseline Notice */}
      <div className="card mb-6" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <div className="font-semibold text-sm" style={{ color: '#fff' }}>
            Transaction Profile Baseline ({validTransactions} / 100)
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')} style={{ color: 'var(--pink-light)' }}>
            View Behaviour Profile <ArrowRight size={13} />
          </button>
        </div>
        <p className="text-xs text-secondary mb-3">
          Recommended minimum: 100 validated transactions for optimal behavioural profiling.
          {validTransactions < 100 && (
            <span style={{ color: '#f59e0b', display: 'block', marginTop: 4 }}>
              * Behaviour analysis may be limited because the transaction history is small.
            </span>
          )}
        </p>
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${validTransactions >= 100 ? 'success' : 'pink'}`}
            style={{ width: `${Math.min(100, (validTransactions / 100) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Recent Transactions & Recent Alerts */}
      <div className="grid grid-2 mb-6" style={{ alignItems: 'start' }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Transactions</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <div className="text-center py-6 text-xs text-tertiary">
              No transactions recorded in this mode yet.
              <div className="mt-3">
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
                  <Upload size={13} /> Add First Transaction
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Recipient</th>
                    <th>Amount</th>
                    <th>Risk</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((t) => {
                    const score = t.risk_score ?? t.riskScore ?? 0;
                    const level = (t.risk_level || t.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW')).toUpperCase();
                    const badgeClass = level === 'CRITICAL' ? 'badge-critical' : level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

                    return (
                      <tr key={t.id || t.transaction_id}>
                        <td className="text-xs">
                          <div>{t.date}</div>
                          <div className="text-tertiary font-mono">{t.time}</div>
                        </td>
                        <td className="text-xs font-semibold text-secondary">
                          {t.receiver}
                        </td>
                        <td className="text-xs font-mono font-semibold" style={{ color: '#fff' }}>
                          ₹{Number(t.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem' }}>
                            {score}/100 ({level})
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost btn-sm" onClick={() => handleView(t)} title="View Details">
                              <Eye size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id || t.transaction_id)} title="Delete">
                              <Trash2 size={13} color="#f43f5e" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Alerts</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-6 text-xs text-tertiary">
              <CheckCircle size={24} color="var(--risk-low)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              No active security alerts in this mode.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentAlerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3"
                  style={{
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 8,
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                  }}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className={`badge ${a.severity === 'critical' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.62rem' }}>
                      {a.severity?.toUpperCase()} ALERT
                    </span>
                    <span className="text-xs text-tertiary font-mono">{a.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="text-xs text-secondary font-semibold mt-1">
                    {a.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Academic Disclaimer Footer */}
      <div className="notice-box info" style={{ padding: '0.75rem 1rem' }}>
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Project Disclaimer:</strong> This project is an academic prototype for UPI transaction risk assessment. It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.
        </div>
      </div>
    </div>
  );
}
