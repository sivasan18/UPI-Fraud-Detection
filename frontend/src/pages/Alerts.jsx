// ==============================================================================
// Fraud Detection and Risk Assessment System
// Alerts Page (Live SQLite Alerts & Review Management)
// ==============================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, CheckCircle, Search, Filter, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Alerts() {
  const navigate = useNavigate();
  const { currentMode, alerts, reviewAlert, setCurrentTransaction, setCurrentAnalysis } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('active');

  const filteredAlerts = alerts.filter(a => {
    const matchesSev = filterSeverity === 'ALL' || a.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesStat = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSev && matchesStat;
  });

  const handleReview = async (id) => {
    await reviewAlert(id);
  };

  const handleViewDetails = (alert) => {
    const txn = {
      id: alert.transaction_id || alert.transactionId,
      amount: alert.amount || 25000,
      receiver: alert.receiver || 'Flagged Entity',
      receiver_upi: alert.receiver_upi || '',
      date: alert.date || new Date().toLocaleDateString(),
      time: alert.time || '02:00 AM',
      transaction_id: alert.transaction_id || alert.transactionId,
    };

    setCurrentTransaction(txn);
    setCurrentAnalysis({
      score: alert.risk_score || alert.riskScore || 85,
      level: (alert.severity || 'HIGH').toUpperCase(),
      type: alert.risk_type || alert.message || 'Suspicious Pattern',
      factors: [
        { name: 'Behavioural Anomaly', contribution: 25, description: alert.message },
        { name: 'Counterparty Anomaly', contribution: 20, description: 'Elevated transaction variance.' }
      ],
      recommendation: 'Verify the recipient. Do not approve unfamiliar transactions.',
    });

    if ((alert.risk_score || alert.riskScore) >= 60) {
      navigate('/suspicious');
    } else {
      navigate('/result');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Fraud Alerts</h1>
        <p>Security notifications triggered by automated behavioural risk monitoring in {currentMode} Mode.</p>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6" style={{ padding: '1rem' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-tertiary" />
            <span className="text-xs text-secondary font-semibold">Filter Alerts:</span>
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical Risk (80-100)</option>
            <option value="high">High Risk (60-79)</option>
            <option value="medium">Medium Risk (30-59)</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="active">Active Alerts</option>
            <option value="reviewed">Reviewed Alerts</option>
            <option value="ALL">All Alerts</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckCircle size={32} color="var(--risk-low)" />
          </div>
          <h3>No Fraud Alerts Found</h3>
          <p>
            {alerts.length === 0
              ? 'No suspicious patterns have been detected in your active transaction database.'
              : 'There are no security alerts matching your selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className="card"
              style={{
                borderLeft: `4px solid ${alert.severity === 'critical' ? 'var(--risk-critical)' : 'var(--risk-high)'}`,
                background: 'var(--bg-card)',
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`badge badge-${alert.severity}`}>{alert.severity} Risk</span>
                <span className="font-mono text-sm font-bold text-danger">
                  Risk Score: {alert.risk_score || alert.riskScore}/100
                </span>
              </div>

              <h4 className="text-base font-semibold mb-2" style={{ color: '#fff' }}>
                {alert.message}
              </h4>

              <div className="text-xs text-tertiary font-mono mb-4">
                Txn UTR: {alert.transaction_id || alert.transactionId} • {alert.created_at?.split('T')[0] || 'Today'}
              </div>

              <div className="flex justify-between items-center">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleViewDetails(alert)}
                >
                  <Eye size={14} /> View Details
                </button>
                {alert.status === 'active' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleReview(alert.id)}
                  >
                    <CheckCircle size={14} /> Mark as Reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
