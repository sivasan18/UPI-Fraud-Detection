// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Verify Extracted Data & Save Confirmation Page
// ==============================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Edit3, ArrowRight, Database, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DataConfirmation() {
  const navigate = useNavigate();
  const { currentTransaction, confirmAndSaveTransaction } = useApp();
  const [confirmed, setConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const txn = currentTransaction || {
    amount: 4000,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: '10:42 AM',
    receiver: 'ABC Stores',
    receiver_upi: 'abcstores@upi',
    transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
    status: 'Successful',
    category: 'Shopping',
    location: 'Localhost',
    device: 'Local Client',
  };

  const [editableTxn, setEditableTxn] = useState({ ...txn });

  const handleFieldChange = (key, value) => {
    setEditableTxn(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirmAndSave = async () => {
    setIsSaving(true);
    const finalTxn = {
      ...editableTxn,
      amount: parseFloat(editableTxn.amount) || 0,
      validated: true,
    };

    const res = await confirmAndSaveTransaction(finalTxn);
    setIsSaving(false);

    if (res && res.analysis && res.analysis.score >= 60) {
      navigate('/suspicious');
    } else {
      navigate('/history');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 850, margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1>Please Verify the Extracted Data</h1>
        <p>Review the extracted values and edit any incorrect fields before confirming.</p>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ShieldCheck size={18} color="var(--pink-light)" />
            Extracted Fields Review
          </div>
          <button
            className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={14} /> {isEditing ? 'Done Editing' : 'Edit Values'}
          </button>
        </div>

        {/* Missing field prompt notice */}
        {(!editableTxn.amount || !editableTxn.receiver) && (
          <div className="notice-box info mb-4" style={{ padding: '0.65rem 0.9rem' }}>
            <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-secondary">
              Could not read some fields automatically. Please enter them manually below.
            </div>
          </div>
        )}

        <div className="grid grid-2 mb-6">
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Amount (₹)</div>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                className="form-input font-mono mt-1"
                value={editableTxn.amount}
                onChange={e => handleFieldChange('amount', e.target.value)}
              />
            ) : (
              <div className="font-semibold text-xl font-mono text-pink">₹{Number(editableTxn.amount || 0).toLocaleString()}</div>
            )}
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Recipient / Merchant</div>
            {isEditing ? (
              <input
                type="text"
                className="form-input mt-1"
                value={editableTxn.receiver}
                onChange={e => handleFieldChange('receiver', e.target.value)}
              />
            ) : (
              <div className="font-semibold text-base text-secondary mt-1">{editableTxn.receiver || 'Could not read. Please enter manually.'}</div>
            )}
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Recipient UPI ID</div>
            {isEditing ? (
              <input
                type="text"
                className="form-input mt-1 font-mono"
                value={editableTxn.receiver_upi || ''}
                onChange={e => handleFieldChange('receiver_upi', e.target.value)}
              />
            ) : (
              <div className="font-mono text-sm text-secondary mt-1">{editableTxn.receiver_upi || 'Optional UPI ID'}</div>
            )}
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Transaction ID (Ref No)</div>
            {isEditing ? (
              <input
                type="text"
                className="form-input mt-1 font-mono"
                value={editableTxn.transaction_id || ''}
                onChange={e => handleFieldChange('transaction_id', e.target.value)}
              />
            ) : (
              <div className="font-mono text-xs text-secondary mt-1">{editableTxn.transaction_id || 'TXN-GEN-001'}</div>
            )}
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Date</div>
            {isEditing ? (
              <input
                type="text"
                className="form-input mt-1"
                value={editableTxn.date || ''}
                onChange={e => handleFieldChange('date', e.target.value)}
              />
            ) : (
              <div className="text-sm text-secondary mt-1">{editableTxn.date}</div>
            )}
          </div>

          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
            <div className="text-xs text-tertiary">Time</div>
            {isEditing ? (
              <input
                type="text"
                className="form-input mt-1"
                value={editableTxn.time || ''}
                onChange={e => handleFieldChange('time', e.target.value)}
              />
            ) : (
              <div className="text-sm text-secondary mt-1">{editableTxn.time}</div>
            )}
          </div>
        </div>

        {/* User Confirmation Checkbox */}
        <div className="mb-6 p-3" style={{ background: 'rgba(236,72,153,0.05)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-secondary">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ accentColor: 'var(--pink-primary)', width: 16, height: 16 }}
            />
            <span>I verify that the above transaction details are correct and should be saved to the database.</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
            Back to Upload
          </button>
          <button
            className="btn btn-primary"
            disabled={!confirmed || isSaving}
            onClick={handleConfirmAndSave}
          >
            <Database size={15} />
            {isSaving ? 'Saving to SQLite...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
