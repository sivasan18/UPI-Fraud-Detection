// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Settings Page (Simple, Clean, Student-Friendly Architecture)
// ==============================================================================
import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Trash2, ShieldAlert, Lock, Database,
  CheckCircle, RefreshCw, AlertTriangle, XCircle, Shield, Info, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    currentMode,
    demoModeEnabled,
    openPasswordModal,
    clearModeData,
    removeDemoPermanently,
    enableDemoMode
  } = useApp();

  // Clear data state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearTargetMode, setClearTargetMode] = useState('ACTIVE');
  const [clearSuccessMsg, setClearSuccessMsg] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // Permanent removal state
  const [showRemoveDemo, setShowRemoveDemo] = useState(false);
  const [removePassword, setRemovePassword] = useState('');
  const [removeError, setRemoveError] = useState('');
  const [removeSuccess, setRemoveSuccess] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Re-enable demo state
  const [showEnableDemo, setShowEnableDemo] = useState(false);
  const [enablePassword, setEnablePassword] = useState('');
  const [enableError, setEnableError] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  const handleOpenClear = (mode) => {
    setClearTargetMode(mode);
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const success = await clearModeData(clearTargetMode);
    setIsClearing(false);
    setShowClearConfirm(false);
    if (success) {
      setClearSuccessMsg(`Successfully cleared all ${clearTargetMode} mode transaction data from SQLite.`);
      setTimeout(() => setClearSuccessMsg(''), 4000);
    }
  };

  const handleRemoveDemo = async (e) => {
    e.preventDefault();
    setRemoveError('');
    setIsRemoving(true);

    const result = await removeDemoPermanently(removePassword);
    setIsRemoving(false);

    if (result.success) {
      setShowRemoveDemo(false);
      setRemovePassword('');
      setRemoveSuccess('Demo Mode Removed Successfully. Demo Mode has been permanently removed from this localhost installation. Application is now running in Active Mode only.');
    } else {
      setRemoveError(result.message || 'Incorrect password.');
    }
  };

  const handleEnableDemo = async (e) => {
    e.preventDefault();
    setEnableError('');
    setIsEnabling(true);

    const result = await enableDemoMode(enablePassword);
    setIsEnabling(false);

    if (result.success) {
      setShowEnableDemo(false);
      setEnablePassword('');
      setRemoveSuccess('');
    } else {
      setEnableError(result.message || 'Incorrect password.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 850, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage application mode and local SQLite database storage.</p>
      </div>

      {clearSuccessMsg && (
        <div className="notice-box info mb-5">
          <CheckCircle size={18} color="var(--risk-low)" />
          <div>{clearSuccessMsg}</div>
        </div>
      )}

      {removeSuccess && (
        <div className="notice-box info mb-5" style={{ borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' }}>
          <CheckCircle size={18} color="var(--risk-low)" />
          <div className="text-sm text-secondary">{removeSuccess}</div>
        </div>
      )}

      {/* 1. Mode Management */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <Lock size={18} color="var(--pink-light)" />
            Application Mode Control
          </div>
          <span className={`badge ${currentMode === 'ACTIVE' ? 'badge-low' : 'badge-demo'}`}>
            Current: ● {currentMode} MODE
          </span>
        </div>

        {demoModeEnabled ? (
          <>
            <p className="text-xs text-secondary mb-4 leading-relaxed">
              The application operates in <strong>ACTIVE MODE</strong> by default using your local SQLite database. You can switch to <strong>DEMO MODE</strong> using the administrator password (<code>admin123</code>) for academic project demonstration.
            </p>

            <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#fff' }}>
                    {currentMode === 'ACTIVE' ? '● ACTIVE MODE (Default Real Storage)' : '● DEMO MODE (Synthetic Data Sandbox)'}
                  </div>
                  <div className="text-xs text-tertiary mt-1">
                    Password-protected switch prevents accidental data mixing.
                  </div>
                </div>
                <button className="btn btn-primary" onClick={openPasswordModal}>
                  <Lock size={14} /> Switch to {currentMode === 'ACTIVE' ? 'Demo' : 'Active'} Mode
                </button>
              </div>
            </div>

            {currentMode === 'DEMO' && (
              <div className="notice-box info mt-4" style={{ padding: '0.6rem 0.85rem' }}>
                <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs text-secondary">
                  <strong>DEMO MODE — SYNTHETIC DATA.</strong> This data is for project demonstration only. Active Mode data is not affected.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.25)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} color="#34d399" />
              <div className="font-semibold text-sm" style={{ color: '#34d399' }}>Demo Mode: Permanently Removed</div>
            </div>
            <p className="text-xs text-secondary leading-relaxed mb-3">
              Application is running in Active Mode only. All synthetic demo data and demo-only options have been permanently removed.
            </p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setShowEnableDemo(true); setEnableError(''); setEnablePassword(''); }}
              style={{ color: 'var(--pink-light)', padding: 0 }}
            >
              Re-enable Demo Mode for testing...
            </button>
          </div>
        )}
      </div>

      {/* 2. Local SQLite Data Management */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title flex items-center gap-2">
            <Database size={18} color="var(--pink-light)" />
            Local SQLite Data Management
          </div>
        </div>

        <div className={demoModeEnabled ? "grid grid-2" : ""}>
          {/* Clear Active Data */}
          <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={16} color="#ef4444" />
              <h4 className="text-sm font-semibold">Clear Active Data</h4>
            </div>
            <p className="text-xs text-secondary mb-4">
              Permanently clears locally stored Active Mode transaction records from SQLite.
            </p>
            <button className="btn btn-danger btn-sm" onClick={() => handleOpenClear('ACTIVE')}>
              Clear Active Data
            </button>
          </div>

          {/* Clear Demo Data */}
          {demoModeEnabled && (
            <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--pink-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} color="var(--pink-light)" />
                <h4 className="text-sm font-semibold">Clear Demo Data</h4>
              </div>
              <p className="text-xs text-secondary mb-4">
                Clears synthetic demo records without affecting your Active Mode data.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenClear('DEMO')}>
                Clear Demo Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Permanent Demo Removal (Shown only when Demo is enabled) */}
      {demoModeEnabled && (
        <div className="card mb-6" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="card-header">
            <div className="card-title flex items-center gap-2" style={{ color: '#ef4444' }}>
              <AlertTriangle size={18} />
              Permanent Demo Mode Removal
            </div>
            <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.65rem' }}>
              ⚠ Irreversible
            </span>
          </div>

          <p className="text-xs text-secondary mb-4 leading-relaxed">
            After the professor approves the project, you can permanently remove Demo Mode from this installation. This will delete all synthetic demo data, disable demo features, and retain all Active Mode user data.
          </p>

          <button
            className="btn btn-danger"
            onClick={() => { setShowRemoveDemo(true); setRemoveError(''); setRemovePassword(''); }}
          >
            <AlertTriangle size={14} /> Remove Demo Mode Permanently
          </button>
        </div>
      )}

      {/* Academic Disclaimer */}
      <div className="notice-box info">
        <Info size={16} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs text-tertiary leading-relaxed">
          <strong>Academic Project Disclaimer:</strong> This project is an academic prototype for UPI transaction risk assessment. It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-danger">
              <ShieldAlert size={26} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Confirm Data Deletion</h3>
            </div>

            <p className="text-xs text-secondary mb-6 leading-relaxed">
              Are you sure you want to permanently delete locally stored <strong>{clearTargetMode} MODE</strong> transaction data from SQLite? This cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isClearing}
                onClick={handleConfirmClear}
              >
                {isClearing ? 'Clearing Data...' : `Clear ${clearTargetMode} Data`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Demo Mode Removal Modal */}
      {showRemoveDemo && (
        <div className="modal-overlay" onClick={() => setShowRemoveDemo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>Are you sure you want to permanently remove Demo Mode?</h3>
              </div>
            </div>

            <div className="notice-box security mb-4" style={{ padding: '0.65rem 0.85rem' }}>
              <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="text-xs text-secondary leading-relaxed">
                <strong>Warning:</strong> This will permanently remove Demo Mode, all synthetic demo data, and demo-only functionality from this localhost installation. This action cannot be undone.
              </div>
            </div>

            <p className="text-xs text-tertiary mb-4 leading-relaxed">
              Active Mode data (transactions, alerts, reports, behaviour profiles, uploaded screenshots, and statements) will <strong>NOT</strong> be deleted or modified.
            </p>

            {removeError && (
              <div className="notice-box security mb-4" style={{ padding: '0.6rem 0.85rem' }}>
                <XCircle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs text-danger font-semibold">{removeError}</div>
              </div>
            )}

            <form onSubmit={handleRemoveDemo}>
              <div className="form-group">
                <label className="form-label">Administrator Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="admin123"
                  required
                  autoFocus
                  value={removePassword}
                  onChange={(e) => { setRemovePassword(e.target.value); setRemoveError(''); }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRemoveDemo(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isRemoving || !removePassword}>
                  {isRemoving ? 'Removing...' : 'Remove Demo Mode Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-enable Demo Modal */}
      {showEnableDemo && (
        <div className="modal-overlay" onClick={() => setShowEnableDemo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="var(--pink-light)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Re-enable Demo Mode for Testing</h3>
              </div>
            </div>

            {enableError && (
              <div className="notice-box security mb-4" style={{ padding: '0.6rem 0.85rem' }}>
                <XCircle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs text-danger font-semibold">{enableError}</div>
              </div>
            )}

            <form onSubmit={handleEnableDemo}>
              <div className="form-group">
                <label className="form-label">Administrator Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="admin123"
                  required
                  autoFocus
                  value={enablePassword}
                  onChange={(e) => { setEnablePassword(e.target.value); setEnableError(''); }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnableDemo(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isEnabling || !enablePassword}>
                  {isEnabling ? 'Enabling...' : 'Enable Demo Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
