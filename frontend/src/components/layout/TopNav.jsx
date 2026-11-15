// ==============================================================================
// Smart UPI Fraud Detection System
// Top Navigation Header
// Displays Authenticated Admin Username, Hamburger Toggle, Mode Badge, & Sign Out
// ==============================================================================
import React from 'react';
import { Menu, Bell, Lock, LogOut, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ onMenuToggle }) {
  const {
    currentMode,
    demoModeEnabled,
    openPasswordModal,
    alerts,
    signOut,
    adminUsername,
  } = useApp();
  const [signOutError, setSignOutError] = React.useState('');
  const activeAlerts = alerts.filter((a) => a.status === 'active').length;

  const handleSignOut = async () => {
    setSignOutError('');
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error?.message || 'Could not sign out. Try again.');
    }
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        {onMenuToggle && (
          <button
            className="btn btn-ghost btn-sm hamburger-btn"
            onClick={onMenuToggle}
            aria-label="Toggle navigation sidebar"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src="/favicon.svg" alt="Logo" style={{ width: 26, height: 26 }} />
          </div>
          <h1 className="topnav-title">
            UPI Fraud Detection System
          </h1>
        </div>
      </div>

      <div className="topnav-right">
        {/* Authenticated Administrator Username */}
        <div
          className="admin-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid var(--yellow-border)',
            borderRadius: '8px',
            padding: '4px 10px',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
          title="Signed in Administrator"
        >
          <User size={14} color="#facc15" />
          <span style={{ color: '#facc15' }}>{adminUsername || 'USER1'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>[Admin]</span>
        </div>

        {/* Mode Badge */}
        <div className={`mode-badge ${currentMode === 'ACTIVE' ? 'active-mode' : 'demo-mode'}`}>
          <span>{currentMode === 'ACTIVE' ? '● ACTIVE MODE' : '● DEMO MODE'}</span>
        </div>

        {/* Demo Mode Synthetic Data Banner */}
        {currentMode === 'DEMO' && (
          <span className="badge badge-high" style={{ fontSize: '0.62rem', padding: '3px 8px' }}>
            SYNTHETIC DATA
          </span>
        )}

        {/* Switch Mode Button */}
        {demoModeEnabled && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={openPasswordModal}
            title="Switch between Active and Demo Modes"
            style={{ borderColor: 'var(--yellow-border)' }}
          >
            <Lock size={13} color="var(--yellow-light)" />
            <span>Switch to {currentMode === 'ACTIVE' ? 'Demo' : 'Active'} Mode</span>
          </button>
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
                background: '#facc15',
                color: '#000000',
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

        {signOutError && <span className="text-xs text-danger" role="alert">{signOutError}</span>}

        {/* Sign Out Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSignOut}
          title="Sign out and return to login screen"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
