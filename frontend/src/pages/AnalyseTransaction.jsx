// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Analyse Transaction Page — Auto-Fill from History & 13-Pattern Evaluation
// ==============================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Loader2, CheckCircle2, Play, AlertCircle, ArrowRight,
  ShieldCheck, History, X, AlertTriangle, ShieldAlert, Lock, Info,
  RotateCcw, Eye, ExternalLink, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const ANALYSIS_PIPELINE = [
  'Extracting transaction attributes (amount, timestamp, counterparty)',
  'Evaluating against user historical behavioural baseline',
  'Analyzing amount deviation vs standard deviation bounds',
  'Detecting recipient novelty & counterparty risk',
  'Scanning time-of-day and frequency burst anomalies',
  'Checking AutoPay / Mandate & subsequent recurring debit patterns',
  'Executing machine learning risk classification engine',
  'Computing explainable AI (XAI) feature contributions',
  'Synthesizing actionable security recommendations',
];

export default function AnalyseTransaction() {
  const navigate = useNavigate();
  const { currentMode, currentTransaction, transactions, runAnalysis, setCurrentTransaction, setCurrentAnalysis } = useApp();

  const [isAnalysing, setIsAnalysing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPatternModal, setShowPatternModal] = useState(false);

  // Editable Target Transaction Parameters
  const [targetTxn, setTargetTxn] = useState(
    currentTransaction || {
      id: 'txn-eval-' + Date.now(),
      amount: 8500,
      receiver: 'NEW_MERCHANT_CORP',
      receiver_upi: 'newmerchant@upi',
      sender_upi: 'user@okhdfc',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: '01:45 AM',
      hour: 1,
      transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
      remarks: 'Payment for online services',
      status: 'Successful',
      category: 'Online Shopping',
      payment_mode: 'UPI',
      autopay_mandate: 'None',
      expected_recurring_amount: 0,
      device: 'Samsung Galaxy S23',
      location: 'Chennai',
    }
  );

  // Auto-populate when selecting an existing transaction from history
  const handleSelectFromHistory = (e) => {
    const txnId = e.target.value;
    setSelectedHistoryId(txnId);
    if (!txnId) return;

    const chosen = transactions.find(t => String(t.id) === String(txnId) || String(t.transaction_id) === String(txnId));
    if (chosen) {
      const populated = {
        id: chosen.id || `txn-${Date.now()}`,
        amount: parseFloat(chosen.amount || 0),
        receiver: chosen.receiver || chosen.merchant || 'Unknown Recipient',
        receiver_upi: chosen.receiver_upi || chosen.receiverUpi || '',
        sender_upi: chosen.sender_upi || chosen.senderUpi || 'user@okhdfc',
        date: chosen.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: chosen.time || '12:00 PM',
        hour: chosen.hour !== undefined ? chosen.hour : 12,
        transaction_id: chosen.transaction_id || chosen.transactionId || `TXN${Date.now()}`,
        remarks: chosen.remarks || chosen.notes || '',
        status: chosen.status || 'Successful',
        category: chosen.category || 'General',
        payment_mode: chosen.payment_mode || chosen.paymentMode || 'UPI',
        autopay_mandate: chosen.autopay_mandate || chosen.autopayMandate || 'None',
        expected_recurring_amount: parseFloat(chosen.expected_recurring_amount || chosen.expectedRecurringAmount || 0),
        device: chosen.device || 'Android Client',
        location: chosen.location || 'Localhost',
      };
      setTargetTxn(populated);
      setCurrentTransaction(populated);
      setAnalysisResult(null); // Reset previous result display
    }
  };

  // Reset form to blank / custom values
  const handleClearForm = () => {
    setSelectedHistoryId('');
    const blank = {
      id: 'txn-manual-' + Date.now(),
      amount: '',
      receiver: '',
      receiver_upi: '',
      sender_upi: '',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: '12:00 PM',
      hour: 12,
      transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
      remarks: '',
      status: 'Successful',
      category: 'General',
      payment_mode: 'UPI',
      autopay_mandate: 'None',
      expected_recurring_amount: 0,
      device: 'Local Client',
      location: 'Localhost',
    };
    setTargetTxn(blank);
    setCurrentTransaction(blank);
    setAnalysisResult(null);
  };

  // Run Real Risk Assessment Engine
  const handleStartAnalysis = async () => {
    setIsAnalysing(true);
    setPipelineStep(0);
    setAnalysisResult(null);

    let step = 0;
    const interval = setInterval(async () => {
      step++;
      if (step < ANALYSIS_PIPELINE.length) {
        setPipelineStep(step);
      } else {
        clearInterval(interval);
        // Ensure amount is parsed as float
        const payload = {
          ...targetTxn,
          amount: parseFloat(targetTxn.amount) || 0,
          expected_recurring_amount: parseFloat(targetTxn.expected_recurring_amount) || 0,
        };

        const result = await runAnalysis(payload);
        setIsAnalysing(false);

        if (result) {
          setAnalysisResult(result);
          setCurrentAnalysis(result);
          setCurrentTransaction(payload);

          // If suspicious patterns detected, show the modal alert popup!
          const detectedList = result.detected_patterns_details || [];
          if (detectedList.length > 0 || (result.score && result.score >= 30)) {
            setShowPatternModal(true);
          }

          // Smooth scroll to results
          setTimeout(() => {
            const el = document.getElementById('analysis-results-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }
      }
    }, 240);
  };

  // Quick Preset Scenarios (including Pattern 13!)
  const handleQuickPreset = (type) => {
    setSelectedHistoryId('');
    let preset;
    if (type === 'normal') {
      preset = {
        amount: 850,
        receiver: 'Coffee House',
        receiver_upi: 'coffeehouse@upi',
        sender_upi: 'user@okhdfc',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: '02:30 PM',
        hour: 14,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        remarks: 'Coffee and snacks',
        status: 'Successful',
        category: 'Food & Dining',
        payment_mode: 'UPI',
        autopay_mandate: 'None',
        expected_recurring_amount: 0,
        device: 'Pixel 7',
        location: 'Localhost',
      };
    } else if (type === 'high_val') {
      preset = {
        amount: 25000,
        receiver: 'UNKNOWN_RECIPIENT',
        receiver_upi: 'unknown.recv@ybl',
        sender_upi: 'user@okhdfc',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: '02:15 AM',
        hour: 2,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        remarks: 'Urgent transfer',
        status: 'Successful',
        category: 'Transfer',
        payment_mode: 'UPI',
        autopay_mandate: 'None',
        expected_recurring_amount: 0,
        device: 'New Device X',
        location: 'Unknown Location',
      };
    } else if (type === 'rapid') {
      preset = {
        amount: 12000,
        receiver: 'UNKNOWN_RECIPIENT',
        receiver_upi: 'unknown.recv@ybl',
        sender_upi: 'user@okhdfc',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: '03:10 AM',
        hour: 3,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        remarks: 'Rapid transfer batch',
        status: 'Successful',
        category: 'Transfer',
        payment_mode: 'UPI',
        autopay_mandate: 'None',
        expected_recurring_amount: 0,
        device: 'Mobile',
        location: 'Localhost',
      };
    } else if (type === 'p13_autopay') {
      // Pattern 13 Preset: ₹1 small initial trial payment with deceptive AutoPay mandate of ₹599
      preset = {
        amount: 1,
        receiver: 'StreamPlay Media Corp',
        receiver_upi: 'streamplay.trial@upi',
        sender_upi: 'user@okhdfc',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: '04:20 PM',
        hour: 16,
        transaction_id: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        remarks: '₹1 trial verification with ₹599/month recurring AutoPay mandate setup',
        status: 'Successful',
        category: 'Subscription / Mandate',
        payment_mode: 'AutoPay Mandate',
        autopay_mandate: 'Active (₹599/month)',
        expected_recurring_amount: 599,
        device: 'Mobile Browser',
        location: 'Localhost',
      };
    }
    setTargetTxn(preset);
    setCurrentTransaction(preset);
    setAnalysisResult(null);
  };

  const score = analysisResult?.score ?? 0;
  const level = analysisResult?.level || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');
  const badgeColor = level === 'CRITICAL' ? '#dc2626' : level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#10b981';
  const badgeClass = level === 'CRITICAL' ? 'badge-critical' : level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  const detectedDetails = analysisResult?.detected_patterns_details || [];
  const notDetectedList = analysisResult?.not_detected_patterns || [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header text-center">
        <h1>Fraud Risk Assessment Engine</h1>
        <p>Evaluate UPI transactions against behavioural baseline with Explainable AI (XAI) & 13 Pattern Detection.</p>
      </div>

      {/* ── 1. TRANSACTION HISTORY AUTO-FILL SELECTOR ── */}
      <div
        className="card mb-6"
        style={{
          border: '1px solid var(--pink-border)',
          background: 'linear-gradient(180deg, rgba(236,72,153,0.08) 0%, var(--bg-card) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
        }}
      >
        <div className="card-header pb-2">
          <div className="card-title flex items-center gap-2">
            <History size={18} color="var(--pink-light)" />
            <span>Select Transaction from History (Auto-Fill Parameters)</span>
          </div>
          <span className="badge badge-pink">{transactions.length} Available in SQLite</span>
        </div>
        <p className="text-xs text-tertiary mb-3">
          Select any verified or synthetic transaction from the database. All parameters will instantly auto-populate and remain fully editable before running the assessment.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ flex: 1, minWidth: 280 }}>
            <select
              className="form-select font-mono text-xs"
              value={selectedHistoryId}
              onChange={handleSelectFromHistory}
              style={{ width: '100%', padding: '0.65rem 0.85rem' }}
            >
              <option value="">-- Choose from stored Transaction History --</option>
              {transactions.map(t => (
                <option key={t.id || t.transaction_id} value={t.id || t.transaction_id}>
                  ₹{Number(t.amount || 0).toLocaleString()} • {t.receiver || t.merchant || 'Unknown'} • {t.date} {t.time} [{t.status || 'Successful'}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {selectedHistoryId && (
              <button className="btn btn-secondary text-xs" onClick={handleClearForm}>
                <RotateCcw size={13} /> Clear to Blank
              </button>
            )}
            <button className="btn btn-secondary text-xs" onClick={() => navigate('/history')}>
              <ExternalLink size={13} /> Open Full History
            </button>
          </div>
        </div>

        {selectedHistoryId && (
          <div className="mt-3 p-2.5 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6 }}>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Auto-filled stored parameters for <strong>{targetTxn.receiver}</strong> (ID: {targetTxn.transaction_id})</span>
            </div>
            <span className="text-xs text-tertiary font-mono">Editable below</span>
          </div>
        )}
      </div>

      {/* ── 2. TRANSACTION PARAMETERS FORM (EDITABLE) ── */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <ShieldCheck size={18} color="var(--pink-light)" />
            <span>Transaction Evaluation Parameters</span>
          </div>
          <span className="badge badge-pink">{currentMode} Mode</span>
        </div>

        <div className="grid grid-2 mb-4">
          <div className="form-group">
            <label className="form-label">Transaction Amount (₹)</label>
            <input
              type="number"
              step="any"
              className="form-input font-mono"
              placeholder="e.g. 1000"
              value={targetTxn.amount}
              onChange={e => setTargetTxn({ ...targetTxn, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recipient / Merchant Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Priyankha V / Amazon"
              value={targetTxn.receiver}
              onChange={e => setTargetTxn({ ...targetTxn, receiver: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recipient UPI ID</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. recipient@oksbi"
              value={targetTxn.receiver_upi || ''}
              onChange={e => setTargetTxn({ ...targetTxn, receiver_upi: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sender UPI ID</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. user@okhdfc"
              value={targetTxn.sender_upi || ''}
              onChange={e => setTargetTxn({ ...targetTxn, sender_upi: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 14 Sep 2026"
              value={targetTxn.date || ''}
              onChange={e => setTargetTxn({ ...targetTxn, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time of Transaction</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 02:15 AM"
              value={targetTxn.time || ''}
              onChange={e => setTargetTxn({ ...targetTxn, time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction ID / UTR</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 120559199521"
              value={targetTxn.transaction_id || ''}
              onChange={e => setTargetTxn({ ...targetTxn, transaction_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Status</label>
            <select
              className="form-select"
              value={targetTxn.status || 'Successful'}
              onChange={e => setTargetTxn({ ...targetTxn, status: e.target.value })}
            >
              <option value="Successful">Successful</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Trial payment / Return / Mandate setup"
              value={targetTxn.remarks || ''}
              onChange={e => setTargetTxn({ ...targetTxn, remarks: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode / Type</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI, AutoPay Mandate, Standing Instruction"
              value={targetTxn.payment_mode || 'UPI'}
              onChange={e => setTargetTxn({ ...targetTxn, payment_mode: e.target.value })}
            />
          </div>

          {/* Pattern 13 Specific Parameters */}
          <div className="form-group">
            <label className="form-label">AutoPay / Mandate Setup Indication (P13)</label>
            <select
              className="form-select"
              value={targetTxn.autopay_mandate || 'None'}
              onChange={e => setTargetTxn({ ...targetTxn, autopay_mandate: e.target.value })}
            >
              <option value="None">None (Standard Single Payment)</option>
              <option value="Active">Active Recurring Mandate (e.g. ₹399/mo or ₹599/mo)</option>
              <option value="Pending">Pending AutoPay Authorization</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Expected Recurring Debit Amount (₹) (P13)</label>
            <input
              type="number"
              className="form-input font-mono"
              placeholder="e.g. 399 or 599 (if AutoPay is set up)"
              value={targetTxn.expected_recurring_amount || ''}
              onChange={e => setTargetTxn({ ...targetTxn, expected_recurring_amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isAnalysing ? (
          <div className="flex justify-between items-center flex-wrap gap-3 pt-2">
            <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
              Upload Screenshot Instead
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleStartAnalysis} id="btn-run-assessment">
              <Search size={18} /> Run Assessment Engine <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6" style={{ background: 'var(--bg-card-subtle)', borderRadius: 12, border: '1px solid var(--pink-border)' }}>
            <div className="flex items-center gap-3 mb-4 text-pink font-semibold">
              <Loader2 className="animate-spin" size={20} />
              <span>Executing AI Risk & 13-Pattern XAI Evaluation Pipeline...</span>
            </div>

            <div className="flex flex-col gap-2">
              {ANALYSIS_PIPELINE.map((stepText, idx) => {
                const isDone = idx < pipelineStep;
                const isCurrent = idx === pipelineStep;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs" style={{ opacity: isDone ? 1 : isCurrent ? 1 : 0.4 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: isDone ? 'var(--risk-low)' : isCurrent ? 'var(--pink-primary)' : 'rgba(255,255,255,0.1)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0
                    }}>
                      {isDone ? <CheckCircle2 size={12} /> : isCurrent ? <Loader2 size={10} className="animate-spin" /> : idx + 1}
                    </div>
                    <span className={isCurrent ? 'font-semibold text-pink' : isDone ? 'text-secondary' : 'text-tertiary'}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. PRESET TEST CASES (INCLUDING PATTERN 13) ── */}
      <div className="card mb-6" style={{ background: 'var(--bg-card-subtle)' }}>
        <div className="card-header pb-2">
          <div className="card-title flex items-center gap-2">
            <Play size={16} color="var(--pink-light)" />
            <span>Pre-Configured Viva Test Cases</span>
          </div>
          <span className="text-xs text-tertiary">Quick load student test scenarios</span>
        </div>

        <div className="grid grid-4 gap-3">
          <button className="btn btn-secondary flex-col p-3 text-left" onClick={() => handleQuickPreset('normal')}>
            <span className="font-semibold text-xs text-white">Normal Baseline</span>
            <span className="text-xs text-tertiary mt-1">₹850 • Known Recipient</span>
            <span className="badge badge-low mt-2">Low Risk (~12/100)</span>
          </button>

          <button className="btn btn-secondary flex-col p-3 text-left" onClick={() => handleQuickPreset('high_val')}>
            <span className="font-semibold text-xs text-white">High Value Anomaly</span>
            <span className="text-xs text-tertiary mt-1">₹25,000 • 2:15 AM (P4, P8)</span>
            <span className="badge badge-critical mt-2">Critical (~92/100)</span>
          </button>

          <button className="btn btn-secondary flex-col p-3 text-left" onClick={() => handleQuickPreset('rapid')}>
            <span className="font-semibold text-xs text-white">Rapid Burst</span>
            <span className="text-xs text-tertiary mt-1">₹12,000 • New Recv (P1, P6)</span>
            <span className="badge badge-high mt-2">High Risk (~84/100)</span>
          </button>

          <button
            className="btn btn-secondary flex-col p-3 text-left"
            style={{ border: '1px solid var(--pink-border)', background: 'rgba(236,72,153,0.08)' }}
            onClick={() => handleQuickPreset('p13_autopay')}
          >
            <span className="font-semibold text-xs text-pink">Pattern 13 Test Case</span>
            <span className="text-xs text-tertiary mt-1">₹1 + ₹599 AutoPay Mandate</span>
            <span className="badge badge-pink mt-2">Deceptive Mandate</span>
          </button>
        </div>
      </div>

      {/* ── 4. POPUP MODAL FOR DETECTED PATTERNS ── */}
      {showPatternModal && detectedDetails.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: 600,
              width: '100%',
              border: '2px solid #ef4444',
              boxShadow: '0 12px 40px rgba(239,68,68,0.3)',
              background: 'linear-gradient(180deg, #1e0b12 0%, #11060a 100%)',
              padding: '1.75rem',
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-danger">
                <ShieldAlert size={26} color="#ef4444" />
                <h3 className="m-0 text-white font-bold text-lg">
                  {detectedDetails.length === 1 ? 'Suspicious Fraud Pattern Detected!' : `${detectedDetails.length} Suspicious Patterns Detected!`}
                </h3>
              </div>
              <button
                onClick={() => setShowPatternModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-secondary mb-4 leading-relaxed">
              The AI behavioral assessment engine has flagged {detectedDetails.length} pattern(s) that match known UPI risk indicators:
            </p>

            <div className="flex flex-col gap-3 mb-5 max-h-80 overflow-y-auto pr-1">
              {detectedDetails.map((pat, idx) => (
                <div
                  key={idx}
                  className="p-3"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: 6,
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-pink">{pat.name}</span>
                    <span className="badge badge-high text-xs">+{pat.contribution} pts</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed m-0">{pat.description}</p>
                </div>
              ))}
            </div>

            <div className="p-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xs text-tertiary">
                <strong>Recommended Action:</strong> Review all transaction details below and do NOT authorize any unrecognized payment or AutoPay mandate.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn btn-primary w-full" onClick={() => setShowPatternModal(false)}>
                Acknowledge & View Complete Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. COMPREHENSIVE ANALYSIS RESULTS SECTION ── */}
      {analysisResult && (
        <div id="analysis-results-section" className="animate-fade-in">
          {/* Prominent Detected Pattern Alert Box (if any) */}
          {detectedDetails.length > 0 && (
            <div
              className="card mb-6"
              style={{
                border: '2px solid #ef4444',
                background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(236,72,153,0.1) 100%)',
              }}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert size={26} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div className="font-bold text-base text-white mb-1">
                    ⚠ Warning: {detectedDetails.length} Suspicious Pattern(s) Identified
                  </div>
                  <div className="text-xs text-secondary leading-relaxed mb-3">
                    This transaction deviates from safe baseline parameters and triggered active pattern detection:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detectedDetails.map((p, i) => (
                      <span key={i} className="badge badge-critical" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                        {p.name} (+{p.contribution})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Risk Score Card */}
          <div
            className="card mb-6 text-center"
            style={{
              border: `2px solid ${badgeColor}`,
              background: 'linear-gradient(180deg, #1c1024 0%, #110918 100%)',
              boxShadow: `0 8px 30px ${level === 'LOW' ? 'rgba(16,185,129,0.15)' : 'rgba(236,72,153,0.2)'}`,
              padding: '2rem',
            }}
          >
            <div className="text-xs font-mono uppercase tracking-widest text-tertiary mb-1">
              AI RISK ASSESSMENT SCORE
            </div>
            <div
              className="font-mono font-extrabold my-2"
              style={{ fontSize: '3.75rem', lineHeight: 1, color: badgeColor }}
            >
              {score} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div className="mt-2">
              <span className={`badge ${badgeClass}`} style={{ fontSize: '1rem', padding: '6px 18px', letterSpacing: '0.05em' }}>
                {level} RISK
              </span>
            </div>
            <div className="text-xs text-secondary mt-3">
              Classification: <strong>{analysisResult.type}</strong>
            </div>
          </div>

          {/* Transaction Parameters Summary Card */}
          <div className="card mb-6">
            <div className="card-header pb-2">
              <div className="card-title">Evaluated Transaction Data</div>
              <span className="badge badge-pink font-mono">{targetTxn.transaction_id || 'ID Verified'}</span>
            </div>
            <div className="grid grid-4 gap-3">
              <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div className="text-xs text-tertiary">Amount</div>
                <div className="font-mono font-bold text-lg text-pink mt-1">₹{Number(targetTxn.amount || 0).toLocaleString()}</div>
              </div>
              <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div className="text-xs text-tertiary">Recipient</div>
                <div className="font-semibold text-sm text-secondary mt-1">{targetTxn.receiver}</div>
                <div className="text-xs text-tertiary font-mono">{targetTxn.receiver_upi || '—'}</div>
              </div>
              <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div className="text-xs text-tertiary">Timestamp</div>
                <div className="font-mono text-xs text-secondary mt-1">{targetTxn.date} • {targetTxn.time}</div>
              </div>
              <div className="p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div className="text-xs text-tertiary">Payment / Mandate</div>
                <div className="text-xs text-secondary font-mono mt-1">{targetTxn.payment_mode || 'UPI'}</div>
                {targetTxn.expected_recurring_amount > 0 && (
                  <div className="text-xs text-pink font-mono">Recurring: ₹{targetTxn.expected_recurring_amount}</div>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION A: DETECTED SUSPICIOUS / FRAUD PATTERNS ── */}
          <div className="card mb-6" style={{ border: detectedDetails.length > 0 ? '1px solid #ef4444' : '1px solid var(--border-subtle)' }}>
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <AlertTriangle size={18} color={detectedDetails.length > 0 ? '#ef4444' : 'var(--risk-low)'} />
                <span>Detected Suspicious / Fraud Patterns ({detectedDetails.length})</span>
              </div>
              {detectedDetails.length > 0 ? (
                <span className="badge badge-critical">Active Threats</span>
              ) : (
                <span className="badge badge-low">No Anomalies Found</span>
              )}
            </div>

            {detectedDetails.length === 0 ? (
              <div className="p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
                <CheckCircle2 size={24} color="var(--risk-low)" className="mx-auto mb-2" />
                <div className="font-semibold text-sm text-emerald-400">Zero Suspicious Patterns Triggered</div>
                <div className="text-xs text-tertiary mt-1">This transaction complies with all evaluated baseline behavioral thresholds.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {detectedDetails.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      borderRadius: 8,
                      borderLeft: '4px solid #ef4444',
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-sm text-pink flex items-center gap-2">
                        <AlertCircle size={15} color="#ef4444" />
                        <span>{item.name}</span>
                      </div>
                      <span className="badge badge-high text-xs">+{item.contribution} Risk Score</span>
                    </div>
                    <div className="text-xs text-secondary leading-relaxed pl-6">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SECTION B: PATTERNS CHECKED / NOT DETECTED (NEVER HIDDEN) ── */}
          <div className="card mb-6">
            <div className="card-header pb-2">
              <div className="card-title flex items-center gap-2">
                <ShieldCheck size={18} color="var(--risk-low)" />
                <span>Patterns Checked / Not Detected ({notDetectedList.length} of 13)</span>
              </div>
              <span className="badge badge-secondary">All 13 Evaluated</span>
            </div>
            <p className="text-xs text-tertiary mb-3">
              The engine tested all 13 behavioral patterns. The following patterns were checked but evaluated as NOT detected:
            </p>

            <div className="flex flex-col gap-2.5">
              {notDetectedList.map((pat, idx) => (
                <div
                  key={idx}
                  className="p-3 flex items-start justify-between gap-3"
                  style={{
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 8,
                    borderLeft: pat.status?.includes('Insufficient') ? '3px solid #f59e0b' : '3px solid rgba(16,185,129,0.4)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={14} color={pat.status?.includes('Insufficient') ? '#f59e0b' : '#10b981'} />
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

          {/* ── SECTION C: WHY? EXPLANATION ── */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Info size={16} color="var(--pink-light)" />
                <span>Why the Transaction Received this Score?</span>
              </div>
              <span className="text-xs text-tertiary font-mono">XAI Feature Contributions</span>
            </div>

            <div className="flex flex-col gap-2">
              {(analysisResult.why || []).length === 0 ? (
                <div className="text-xs text-secondary p-3" style={{ background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                  Transaction is within standard normal operating parameters with no elevated risk contributions.
                </div>
              ) : (
                analysisResult.why.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 flex items-start gap-2.5"
                    style={{
                      background: 'var(--bg-card-subtle)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${badgeColor}`,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor, marginTop: 6, flexShrink: 0 }} />
                    <div className="text-xs text-secondary leading-relaxed">
                      {r}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── SECTION D: WHAT NEXT? RECOMMENDATION ── */}
          <div className="card mb-6" style={{ border: '1px solid var(--pink-border)' }}>
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Lock size={16} color="var(--pink-light)" />
                <span>What Next? (Actionable Security Guidance)</span>
              </div>
            </div>
            <div className="p-4" style={{ background: 'rgba(236,72,153,0.06)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
              <p className="text-sm font-semibold text-secondary leading-relaxed mb-3">
                {analysisResult.recommendation}
              </p>
              <ul className="text-xs text-tertiary leading-relaxed flex flex-col gap-1.5" style={{ listStyleType: 'disc', paddingLeft: 18 }}>
                <li>Confirm recipient name and UPI ID in your banking app before authorizing any fund transfer.</li>
                <li>Never share your UPI PIN or OTP with any caller, even if they claim to be from bank support.</li>
                <li>If this involves an AutoPay or subscription mandate, verify the authorized monthly debit limit.</li>
              </ul>
            </div>

            {/* Security Alert Reminder */}
            <div className="mt-4 p-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
              <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <div className="text-xs text-secondary">
                <strong>Critical Security Rule:</strong> UPI PIN is ONLY entered to SEND or DEDUCT money. Entering a UPI PIN will never receive money.
              </div>
            </div>
          </div>

          {/* Route to Dedicated Views */}
          <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
            <button className="btn btn-secondary" onClick={() => navigate('/history')}>
              Back to History
            </button>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => navigate('/tutorial')}>
                View 13 Patterns Guide
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (score >= 60) navigate('/suspicious');
                  else navigate('/result');
                }}
              >
                Open Full Screen Result <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
