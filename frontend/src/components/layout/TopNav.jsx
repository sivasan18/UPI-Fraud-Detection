// ==============================================================================
// Smart UPI Fraud Detection System
// Top Navigation Header Component
//
// WHAT THIS COMPONENT DISPLAYS:
// ------------------------------------------------------------------------------
// 1. Sidebar Toggle Button (Hamburger icon for collapsing / expanding the menu).
// 2. Application Logo & Project Title.
// 3. Authenticated Administrator Badge (e.g., `USER 1 [Admin]`).
// 4. Demo Mode Indicator (shown exclusively when running in Demo Mode).
// 5. Active Alerts Bell Icon (with real-time unread alert count badge).
// 6. Sign Out Button:
//    - Safely terminates the Supabase Auth session and returns the user to the
//      Sign-In page. (This is how users switch between Active and Demo modes).
// ==============================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ onMenuToggle }) {
  const navigate = useNavigate();
  const {
    currentMode,
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
      navigate('/login', { replace: true });
    } catch (error) {
      setSignOutError(error?.message || 'Could not sign out. Try again.');
      navigate('/login', { replace: true });
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

        {/* Demo Mode Badge & Synthetic Data Banner (hidden in Active Mode for clean Admin view) */}
        {currentMode === 'DEMO' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div className="mode-badge demo-mode">
              <span>● DEMO MODE</span>
            </div>
            <span className="badge badge-high" style={{ fontSize: '0.62rem', padding: '3px 8px' }}>
              SYNTHETIC DATA
            </span>
          </div>
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
