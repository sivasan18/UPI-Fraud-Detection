// ==============================================================================
// Fraud Detection and Risk Assessment System
// Analyse New Transaction Page
// ==============================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Play, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ANALYSIS_PIPELINE = [
  'Extracting transaction attributes (amount, timestamp, counterparty)',
  'Evaluating against user historical behavioural baseline',
  'Analyzing amount deviation vs standard deviation bounds',
  'Detecting recipient novelty & counterparty risk',
  'Checking time-of-day and frequency burst anomalies',
  'Executing machine learning risk classification engine',
  'Computing explainable AI (XAI) feature contributions',
  'Synthesizing actionable security recommendations',
];

export default function AnalyseTransaction() {
  const navigate = useNavigate();
  const { currentMode, currentTransaction, runAnalysis, setCurrentTransaction } = useApp();

  const [isAnalysing, setIsAnalysing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  // Custom Form or Target Transaction
  const [targetTxn, setTargetTxn] = useState(
    currentTransaction || {
      id: 'txn-manual-eval',
      amount: 8500,
      date: new Date().toLocaleDateString(),
      time: '01:45 AM',
      hour: 1,
      receiver: 'NEW_MERCHANT_CORP',
      receiver_upi: 'newmerchant@upi',
      transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
      device: 'Samsung Galaxy S23',
      location: 'Chennai',
    }
  );

  const handleStartAnalysis = async () => {
    setIsAnalysing(true);
    setPipelineStep(0);

    let step = 0;
    const interval = setInterval(async () => {
      step++;
      if (step < ANALYSIS_PIPELINE.length) {
        setPipelineStep(step);
      } else {
        clearInterval(interval);
        const result = await runAnalysis(targetTxn);
        setIsAnalysing(false);
        if (result && result.score >= 60) {
          navigate('/suspicious');
        } else {
          navigate('/result');
        }
      }
    }, 300);
  };

  const handleQuickPreset = (type) => {
    let preset;
    if (type === 'normal') {
      preset = {
        amount: 850,
        receiver: 'Coffee House',
        receiver_upi: 'coffeehouse@upi',
        date: new Date().toLocaleDateString(),
        time: '02:30 PM',
        hour: 14,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
      };
    } else if (type === 'high_val') {
      preset = {
        amount: 25000,
        receiver: 'UNKNOWN_RECIPIENT',
        receiver_upi: 'unknown.recv@ybl',
        date: new Date().toLocaleDateString(),
        time: '02:15 AM',
        hour: 2,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        device: 'New Device X',
      };
    } else {
      preset = {
        amount: 12000,
        receiver: 'UNKNOWN_RECIPIENT',
        receiver_upi: 'unknown.recv@ybl',
        date: new Date().toLocaleDateString(),
        time: '03:10 AM',
        hour: 3,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
      };
    }
    setTargetTxn(preset);
    setCurrentTransaction(preset);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1>Analyse Transaction</h1>
        <p>Evaluate a UPI transaction against behavioural baseline using Explainable AI.</p>
      </div>

      {/* Target Transaction Input Card */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ShieldCheck size={18} color="var(--violet-bright)" />
            Transaction Evaluation Parameters
          </div>
          <span className="badge badge-violet">{currentMode} Mode</span>
        </div>

        <div className="grid grid-2 mb-6">
          <div className="form-group">
            <label className="form-label">Transaction Amount (₹)</label>
            <input
              type="number"
              className="form-input font-mono"
              value={targetTxn.amount}
              onChange={e => setTargetTxn({ ...targetTxn, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recipient Name</label>
            <input
              type="text"
              className="form-input"
              value={targetTxn.receiver}
              onChange={e => setTargetTxn({ ...targetTxn, receiver: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recipient UPI ID</label>
            <input
              type="text"
              className="form-input font-mono"
              value={targetTxn.receiver_upi || ''}
              onChange={e => setTargetTxn({ ...targetTxn, receiver_upi: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time of Transaction</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="02:15 AM"
              value={targetTxn.time || ''}
              onChange={e => setTargetTxn({ ...targetTxn, time: e.target.value })}
            />
          </div>
        </div>

        {!isAnalysing ? (
          <div className="flex justify-between items-center flex-wrap gap-3">
            <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
              Upload Screenshot Instead
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleStartAnalysis}>
              <Search size={18} /> Run Risk Assessment Engine <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6" style={{ background: 'var(--bg-card-subtle)', borderRadius: 12, border: '1px solid var(--violet-border)' }}>
            <div className="flex items-center gap-3 mb-4 text-violet font-semibold">
              <Loader2 className="animate-spin" size={20} />
              <span>Executing AI Risk & XAI Explanation Pipeline...</span>
            </div>

            <div className="flex flex-col gap-2">
              {ANALYSIS_PIPELINE.map((stepText, idx) => {
                const isDone = idx < pipelineStep;
                const isCurrent = idx === pipelineStep;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs" style={{ opacity: isDone ? 1 : isCurrent ? 1 : 0.4 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: isDone ? 'var(--risk-low)' : isCurrent ? 'var(--violet-primary)' : 'rgba(255,255,255,0.1)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0
                    }}>
                      {isDone ? <CheckCircle2 size={12} /> : isCurrent ? <Loader2 size={10} className="animate-spin" /> : idx + 1}
                    </div>
                    <span className={isCurrent ? 'font-semibold text-violet' : isDone ? 'text-secondary' : 'text-tertiary'}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preset Scenarios */}
      <div className="card" style={{ background: 'var(--bg-card-subtle)' }}>
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <Play size={16} color="var(--violet-bright)" />
            Or Select Pre-Configured Test Case
          </div>
        </div>

        <div className="grid grid-3">
          <button className="btn btn-secondary flex-col p-4" onClick={() => handleQuickPreset('normal')}>
            <span className="font-semibold text-sm">Normal Baseline</span>
            <span className="text-xs text-tertiary mt-1">₹850 • Known Recipient • 2:30 PM</span>
            <span className="badge badge-low mt-2">Low Risk (~12/100)</span>
          </button>

          <button className="btn btn-secondary flex-col p-4" onClick={() => handleQuickPreset('high_val')}>
            <span className="font-semibold text-sm">High Value Anomaly</span>
            <span className="text-xs text-tertiary mt-1">₹25,000 • New Recv • 2:15 AM</span>
            <span className="badge badge-critical mt-2">Critical Risk (~92/100)</span>
          </button>

          <button className="btn btn-danger flex-col p-4" onClick={() => handleQuickPreset('rapid')}>
            <span className="font-semibold text-sm">Rapid Pattern</span>
            <span className="text-xs text-tertiary mt-1">₹12,000 • New Recv • 3:10 AM</span>
            <span className="badge badge-critical mt-2">High Risk (~84/100)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
