// ==============================================================================
// Smart UPI Fraud Detection System
// Mode Switching Modal (Password: admin123)
// ==============================================================================
import React, { useState } from 'react';
import { Lock, X, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ModeSwitchModal({ isOpen, onClose }) {
  const { currentMode, switchMode, demoModeEnabled } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  // If demo mode has been permanently removed, don't show switch modal
  if (!demoModeEnabled) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={22} color="var(--pink-light)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Demo Mode Permanently Removed</h3>
          </div>
          <p className="text-sm text-secondary mb-4">
            Demo Mode has been permanently removed from this localhost installation. Application is running in Active Mode only.
          </p>
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const targetMode = currentMode === 'ACTIVE' ? 'DEMO' : 'ACTIVE';

  const handleVerifyAndSwitch = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const success = await switchMode(targetMode, password);
      if (success) {
        setPassword('');
        setError('');
        onClose();
      } else {
        setError('Incorrect administrator password.');
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Incorrect administrator password.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="var(--pink-light)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Administrator Password Required</h3>
              <p className="text-xs text-tertiary">Switch between Active Mode and Demo Mode</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 mb-4" style={{ background: 'rgba(236,72,153,0.06)', borderRadius: 8, border: '1px solid var(--pink-border)' }}>
          <div className="text-xs text-secondary mb-1">
            Current: <strong style={{ color: currentMode === 'ACTIVE' ? 'var(--risk-low)' : 'var(--pink-light)' }}>● {currentMode} MODE</strong>
          </div>
          <div className="text-xs text-tertiary">
            Target: <strong className="text-pink">● {targetMode} MODE</strong>
          </div>
        </div>

        {/* Demo mode warning */}
        {targetMode === 'DEMO' && (
          <div className="notice-box info mb-4" style={{ padding: '0.6rem 0.85rem' }}>
            <AlertCircle size={15} color="var(--pink-light)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-secondary">
              Demo Mode uses synthetic data for project demonstration only. Your Active Mode data will not be modified.
            </div>
          </div>
        )}

        {error && (
          <div className="notice-box security mb-4" style={{ padding: '0.65rem 0.9rem' }}>
            <AlertCircle size={16} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-danger font-semibold">{error}</div>
          </div>
        )}

        <form onSubmit={handleVerifyAndSwitch}>
          <div className="form-group">
            <label className="form-label">Enter Administrator Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isVerifying || !password}>
              {isVerifying ? 'Verifying...' : `Switch to ${targetMode} Mode`}
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
