// ==============================================================================
// Fraud Detection and Risk Assessment System
// Adaptive Learning & Human-in-the-Loop Feedback Page
// ==============================================================================
import React, { useState } from 'react';
import {
  Brain, CheckCircle, RefreshCw, PlusCircle, ArrowRight,
  Database, ShieldCheck, Activity, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function AdaptiveLearning() {
  const { currentMode, validatedSamples, addValidatedSample, refreshData, transactions } = useApp();
  const [selectedTxnId, setSelectedTxnId] = useState('');
  const [label, setLabel] = useState('fraud');
  const [notes, setNotes] = useState('');
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState('');

  const handleAddSample = async (e) => {
    e.preventDefault();
    if (!selectedTxnId) return;
    await addValidatedSample(selectedTxnId, label, notes);
    setSelectedTxnId('');
    setNotes('');
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainSuccess('');
    try {
      const res = await api.retrainModel(currentMode);
      if (res && res.success) {
        setRetrainSuccess(`Retraining completed! Recorded Run ID: ${res.trainingRun?.id}`);
        await refreshData(currentMode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Adaptive Learning Loop</h1>
        <p>Human-in-the-loop validation for incremental model calibration and supervised feedback.</p>
      </div>

      {/* Adaptive Learning Workflow Card */}
      <div className="card mb-6" style={{ background: 'var(--violet-card-gradient)', border: '1px solid var(--violet-border)' }}>
        <div className="card-title mb-3 flex items-center gap-2">
          <Brain size={20} color="var(--violet-bright)" />
          Continuous Adaptive Learning Pipeline
        </div>
        <p className="text-xs text-secondary mb-4">
          Rather than retraining blindly on unverified inputs, the system accumulates verified ground-truth feedback from human analysts to update decision boundaries.
        </p>

        <div className="grid grid-4" style={{ gap: 10 }}>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--violet-border)' }}>
            <div className="text-xs font-mono text-tertiary">Step 1</div>
            <div className="font-semibold text-xs mt-1">Suspicious Flag</div>
            <div className="text-xs text-tertiary mt-1">Model scores anomaly</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--violet-border)' }}>
            <div className="text-xs font-mono text-tertiary">Step 2</div>
            <div className="font-semibold text-xs mt-1">Human Validation</div>
            <div className="text-xs text-tertiary mt-1">User confirms label</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--violet-border)' }}>
            <div className="text-xs font-mono text-tertiary">Step 3</div>
            <div className="font-semibold text-xs mt-1">SQLite Training Pool</div>
            <div className="text-xs text-tertiary mt-1">Samples stored locally</div>
          </div>
          <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--violet-border)' }}>
            <div className="text-xs font-mono text-tertiary">Step 4</div>
            <div className="font-semibold text-xs mt-1">Model Retraining</div>
            <div className="text-xs text-tertiary mt-1">Updated weights active</div>
          </div>
        </div>
      </div>

      {retrainSuccess && (
        <div className="notice-box info mb-6">
          <CheckCircle size={18} color="var(--risk-low)" />
          <div>{retrainSuccess}</div>
        </div>
      )}

      {/* Retrain Action Bar */}
      <div className="card mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Accumulated Validated Feedback Pool</h3>
            <p className="text-xs text-secondary mt-1">
              Currently holding <strong>{validatedSamples.length} validated ground-truth samples</strong> in local SQLite.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRetrain}
            disabled={isRetraining || validatedSamples.length === 0}
          >
            {isRetraining ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {isRetraining ? 'Retraining Model...' : 'Retrain Model Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-2 mb-6">
        {/* Validate New Sample Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title flex items-center gap-2">
              <PlusCircle size={18} color="var(--violet-bright)" />
              Submit Validated Ground-Truth Label
            </div>
          </div>

          <form onSubmit={handleAddSample}>
            <div className="form-group">
              <label className="form-label">Select Transaction</label>
              <select
                className="form-select"
                required
                value={selectedTxnId}
                onChange={e => setSelectedTxnId(e.target.value)}
              >
                <option value="">Select a transaction to label...</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.transaction_id || t.id}>
                    ₹{t.amount} to {t.receiver} ({t.date}) — Score: {t.risk_score || 10}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ground-Truth Label</label>
              <select
                className="form-select"
                value={label}
                onChange={e => setLabel(e.target.value)}
              >
                <option value="fraud">Confirmed Suspicious / Fraudulent</option>
                <option value="normal">Confirmed Normal / False Positive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Analyst Feedback Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Confirmed unauthorized payment attempt"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={!selectedTxnId}>
              <CheckCircle size={16} /> Validate Sample & Commit to Pool
            </button>
          </form>
        </div>

        {/* Validated Samples Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Validated Feedback Samples</div>
            <span className="badge badge-violet">{validatedSamples.length} Samples</span>
          </div>

          {validatedSamples.length === 0 ? (
            <div className="text-center text-xs text-tertiary py-8">
              No validated feedback samples recorded yet. Flag transactions or submit labels above to build your retraining set.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {validatedSamples.map(sample => (
                <div key={sample.id} className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--violet-border)' }}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-mono text-tertiary">Txn ID: {sample.transaction_id}</span>
                    <span className={`badge ${sample.label === 'fraud' ? 'badge-critical' : 'badge-low'}`}>
                      {sample.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-secondary">{sample.feedback_notes || 'Verified by local analyst'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
