// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Transaction History Page (Clean, Searchable, Simple Table)
// ==============================================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Search, Eye, Trash2, Plus, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { currentMode, transactions, deleteTransaction, setCurrentTransaction, setCurrentAnalysis } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter(txn => {
      const matchSearch =
        !searchTerm ||
        (txn.receiver && txn.receiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (txn.transaction_id && txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (txn.receiver_upi && txn.receiver_upi.toLowerCase().includes(searchTerm.toLowerCase()));

      const txnLevel = (txn.risk_level || txn.riskLevel || 'LOW').toUpperCase();
      const matchRisk = filterRisk === 'ALL' || txnLevel === filterRisk.toUpperCase();

      return matchSearch && matchRisk;
    });
  }, [transactions, searchTerm, filterRisk]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleView = (txn) => {
    setCurrentTransaction(txn);
    const score = txn.risk_score ?? txn.riskScore ?? 10;
    const factors = Array.isArray(txn.risk_factors) ? txn.risk_factors : [];

    setCurrentAnalysis({
      score,
      level: txn.risk_level || txn.riskLevel || 'LOW',
      type: txn.risk_type || txn.riskType || 'Normal Transaction',
      factors,
      recommendation: txn.recommendation || 'Verified transaction.',
    });

    if (score >= 60) {
      navigate('/suspicious');
    } else {
      navigate('/result');
    }
  };

  const handleDelete = async (txnId) => {
    if (window.confirm('Are you sure you want to delete this transaction from SQLite?')) {
      await deleteTransaction(txnId);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>Transaction History</h1>
          <p>
            {currentMode === 'ACTIVE'
              ? 'Local SQLite database records for active verified transactions.'
              : 'Synthetic benchmark transaction dataset in Demo Mode.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Search & Risk Filter Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1" style={{ minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by recipient, UPI ID, or Transaction ID..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={filterRisk}
              onChange={e => { setFilterRisk(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk (0–29)</option>
              <option value="MEDIUM">Medium Risk (30–59)</option>
              <option value="HIGH">High Risk (60–79)</option>
              <option value="CRITICAL">Critical Risk (80–100)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <History size={32} />
          </div>
          <h3>No Transactions Found</h3>
          <p>
            {transactions.length === 0
              ? 'Your active database is currently empty. Upload screenshots or enter transactions manually.'
              : 'No transactions match your current search and filter criteria.'}
          </p>
          {transactions.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={16} /> Add First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Recipient</th>
                  <th>UPI ID</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((txn, idx) => {
                  const score = txn.risk_score ?? txn.riskScore ?? 0;
                  const level = (txn.risk_level || txn.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW')).toUpperCase();
                  const badgeClass = level === 'CRITICAL' ? 'badge-critical' : level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

                  return (
                    <tr key={txn.id || txn.transaction_id || idx}>
                      <td>
                        <div className="font-semibold text-xs text-secondary">{txn.date}</div>
                        <div className="text-xs text-tertiary font-mono">{txn.time}</div>
                      </td>
                      <td className="font-semibold text-sm">{txn.receiver}</td>
                      <td className="font-mono text-xs text-tertiary">{txn.receiver_upi || '—'}</td>
                      <td className="font-mono text-xs text-tertiary">{txn.transaction_id || txn.id}</td>
                      <td className="font-mono font-bold text-pink text-sm">
                        ₹{Number(txn.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-sm font-semibold">
                        {score} / 100
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem' }}>
                          {level} RISK
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-success font-semibold">{txn.status || 'Successful'}</span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleView(txn)}
                            title="View Risk Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(txn.id || txn.transaction_id)}
                            title="Delete Record"
                          >
                            <Trash2 size={14} color="#f43f5e" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex justify-between items-center p-4" style={{ background: 'var(--bg-card-subtle)', borderTop: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary font-mono">
              Showing {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} records
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-secondary font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
