// ==============================================================================
// Smart UPI Fraud Detection System
// Top Navigation Header (with mode indicator & conditional demo switch)
// ==============================================================================
import React from 'react';
import { Menu, Bell, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ title, onMenuToggle }) {
  const { currentMode, demoModeEnabled, openPasswordModal, alerts } = useApp();
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  return (
    <header className="topnav">
      <div className="topnav-left">
        {onMenuToggle && (
          <button className="btn btn-ghost btn-sm" onClick={onMenuToggle} aria-label="Open menu">
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: 26, height: 26 }} />
          </div>
          <h1 className="topnav-title">
            UPI Fraud Detection System
          </h1>
        </div>
      </div>

      <div className="topnav-right">
        {/* Prominent Mode Badge */}
        <div className={`mode-badge ${currentMode === 'ACTIVE' ? 'active-mode' : 'demo-mode'}`}>
          <span>{currentMode === 'ACTIVE' ? '● ACTIVE MODE' : '● DEMO MODE'}</span>
        </div>

        {/* Demo Mode Synthetic Data Banner */}
        {currentMode === 'DEMO' && (
          <span className="badge badge-high" style={{ fontSize: '0.62rem', padding: '3px 8px' }}>
            SYNTHETIC DATA
          </span>
        )}

        {/* Switch Mode Button — only shown when demo mode is enabled */}
        {demoModeEnabled && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={openPasswordModal}
            title="Switch between Active and Demo Modes"
            style={{ borderColor: 'var(--pink-border)' }}
          >
            <Lock size={13} color="var(--pink-light)" />
            <span>Switch to {currentMode === 'ACTIVE' ? 'Demo' : 'Active'} Mode</span>
          </button>
        )}

        {/* After demo removal — show Active Only label */}
        {!demoModeEnabled && (
          <span className="badge badge-low" style={{ fontSize: '0.6rem', padding: '3px 8px' }}>
            Active Mode Only
          </span>
        )}

        {/* Alerts Notification Icon */}
        <div className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: 8 }}>
          <Bell size={17} />
          {activeAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#f43f5e',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeAlerts}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
