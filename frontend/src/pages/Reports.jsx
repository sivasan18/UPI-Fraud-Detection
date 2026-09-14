// ==============================================================================
// Fraud Detection and Risk Assessment System
// Reports & Audit Analytics Page
// ==============================================================================
import React from 'react';
import {
  FileText, Download, ShieldCheck, AlertTriangle, Printer,
  BarChart2, Calendar, Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Reports() {
  const {
    currentMode,
    totalTransactions,
    validTransactions,
    suspiciousTransactions,
    highRiskTransactions,
    avgRiskScore,
    behaviourProfile,
    transactions,
  } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    const headers = ['Date', 'Time', 'Amount', 'Recipient', 'UPI_ID', 'Txn_ID', 'Risk_Score', 'Risk_Level', 'Status'];
    const rows = transactions.map(t => [
      t.date,
      t.time,
      t.amount,
      `"${t.receiver}"`,
      t.receiver_upi || '',
      t.transaction_id || t.id,
      t.risk_score || '',
      t.risk_level || '',
      t.status || 'Successful'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fraud_Report_${currentMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>System Security & Audit Report</h1>
          <p>
            {currentMode === 'ACTIVE'
              ? 'Report generated from locally stored transaction data.'
              : 'Report generated from synthetic demonstration data.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={totalTransactions === 0}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Mode Tag */}
      <div className="notice-box info mb-6">
        <Database size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Report Scope: {currentMode} MODE</strong> —{' '}
          {currentMode === 'ACTIVE'
            ? 'This report summarizes all verified user transactions, behavioural baseline statistics, and anomalies stored in your local SQLite database.'
            : 'This report summarizes synthetic evaluation benchmarks for academic review and model validation.'}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-4 mb-6">
        <div className="card">
          <div className="stat-label">Total Volume Monitored</div>
          <div className="stat-value text-violet">{totalTransactions} Transactions</div>
          <div className="text-xs text-tertiary mt-2 font-mono">SQLite Partition: {currentMode}</div>
        </div>

        <div className="card">
          <div className="stat-label">Flagged Anomalies</div>
          <div className="stat-value" style={{ color: 'var(--risk-high)' }}>{suspiciousTransactions} Txns</div>
          <div className="text-xs text-tertiary mt-2 font-mono">
            {totalTransactions > 0 ? `${((suspiciousTransactions / totalTransactions) * 100).toFixed(1)}% Anomaly Rate` : '0% Anomaly Rate'}
          </div>
        </div>

        <div className="card">
          <div className="stat-label">High / Critical Alerts</div>
          <div className="stat-value text-danger">{highRiskTransactions} Txns</div>
          <div className="text-xs text-tertiary mt-2 font-mono">Risk Score $\ge$ 80/100</div>
        </div>

        <div className="card">
          <div className="stat-label">Average Risk Index</div>
          <div className="stat-value text-violet">
            {avgRiskScore !== null ? `${avgRiskScore}/100` : '—'}
          </div>
          <div className="text-xs text-tertiary mt-2 font-mono">Baseline Risk Score</div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Executive Summary</div>
          <span className="badge badge-violet">{currentMode} Data</span>
        </div>
        <div className="text-sm text-secondary leading-relaxed">
          <p className="mb-3">
            The Fraud Detection and Risk Assessment system continuously cross-references newly ingested UPI transactions against an individualized statistical behavioural profile.
          </p>
          <p className="mb-3">
            Currently, the local dataset contains <strong>{totalTransactions} recorded transactions</strong>, with an established baseline average spending amount of <strong>₹{behaviourProfile?.avgAmount?.toLocaleString() || '0.00'}</strong> and a median transaction volume of <strong>₹{behaviourProfile?.medianAmount?.toLocaleString() || '0.00'}</strong>.
          </p>
          <p>
            {suspiciousTransactions > 0
              ? `A total of ${suspiciousTransactions} transactions exhibited behavioural deviations exceeding established thresholds (including amount spikes, unusual authorization hours, and novel counterparties).`
              : `No anomalous transactions are currently flagged in the active database.`}
          </p>
        </div>
      </div>

      {/* Transaction Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Transaction Log Excerpt</div>
          <span className="badge badge-info">Latest {Math.min(10, transactions.length)} Records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center text-xs text-tertiary py-8">
            No transactions available in current report partition.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Classification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td className="text-xs font-mono">{t.date} {t.time}</td>
                    <td className="font-semibold text-sm">{t.receiver}</td>
                    <td className="font-mono text-violet font-bold text-sm">₹{Number(t.amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${(t.risk_level || t.riskLevel || 'LOW').toLowerCase()}`}>
                        {t.risk_score || t.riskScore || 10}/100
                      </span>
                    </td>
                    <td className="text-xs">{t.risk_type || t.riskType || 'Normal'}</td>
                    <td className="text-xs text-success">{t.status || 'Successful'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
