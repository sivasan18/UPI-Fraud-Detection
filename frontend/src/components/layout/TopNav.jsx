// ==============================================================================
// Smart UPI Fraud Detection System
// Top Navigation Header Component
//
// WHAT THIS COMPONENT DISPLAYS:
// ------------------------------------------------------------------------------
// 1. Sidebar Toggle Button (Hamburger icon for desktop sidebar).
// 2. Application Logo & Project Title.
// 3. Authenticated Administrator Badge and Demo Mode indicator.
// 4. Notification Bell (top-right): unread count badge, real app event history,
//    and a mobile-friendly notification panel.
// 5. Sign Out Button (desktop header): safely ends the session and returns to login.
//    On mobile, Sign Out is also available in the bottom navigation.
// ==============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ onMenuToggle }) {
  const navigate = useNavigate();
  const {
    currentMode,
    notifications,
    markNotificationsRead,
    signOut,
    adminUsername,
  } = useApp();

  const [signOutError, setSignOutError] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

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

  // Open/close the notification panel. Mark notifications as read when opened.
  const toggleNotifications = () => {
    setIsNotifOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0) {
        markNotificationsRead();
      }
      return next;
    });
  };

  // Close the panel when clicking outside (desktop and mobile).
  useEffect(() => {
    if (!isNotifOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isNotifOpen]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'success') return <CheckCircle2 size={16} color="#facc15" />;
    if (type === 'warning') return <AlertTriangle size={16} color="#facc15" />;
    if (type === 'error') return <XCircle size={16} color="#facc15" />;
    return <Info size={16} color="#facc15" />;
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        {onMenuToggle && (
          <button
            className="btn btn-ghost btn-sm hamburger-btn topnav-menu-btn"
            onClick={onMenuToggle}
            aria-label="Toggle navigation sidebar"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 topnav-brand">
          <div className="topnav-logo-wrap">
            <img src="/favicon.svg" alt="Logo" className="topnav-logo-img" />
          </div>
          <h1 className="topnav-title">
            UPI Fraud Detection System
          </h1>
        </div>
      </div>

      <div className="topnav-right">
        {/* Authenticated Administrator Username */}
        <div className="admin-badge topnav-admin-badge" title="Signed in Administrator">
          <User size={14} color="#facc15" />
          <span className="admin-badge-name">{adminUsername || 'USER1'}</span>
          <span className="admin-badge-role">[Admin]</span>
        </div>

        {/* Demo Mode Badge & Synthetic Data Banner (hidden in Active Mode) */}
        {currentMode === 'DEMO' && (
          <div className="topnav-demo-indicators">
            <div className="mode-badge demo-mode">
              <span>● DEMO MODE</span>
            </div>
            <span className="badge badge-high topnav-synthetic-badge">
              SYNTHETIC DATA
            </span>
          </div>
        )}

        {/* Notification Bell: stays in the top-right header on desktop and mobile */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm notification-bell-btn"
            onClick={toggleNotifications}
            aria-label="Open notifications"
            aria-expanded={isNotifOpen}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-header">
                <div>
                  <div className="notification-panel-title">Notifications</div>
                  <div className="notification-panel-subtitle">
                    {currentMode === 'DEMO' ? 'Demo Mode (sample notifications labeled)' : 'Active Mode (real application events)'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsNotifOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="notification-list">
                {(notifications || []).length === 0 ? (
                  <div className="notification-empty">
                    <Info size={18} color="#facc15" />
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((note) => (
                    <div key={note.id} className={`notification-item ${!note.read ? 'unread' : ''}`}>
                      <div className="notification-item-icon">{getTypeIcon(note.type)}</div>
                      <div className="notification-item-body">
                        <div className="notification-item-title">{note.title}</div>
                        {note.message && <div className="notification-item-message">{note.message}</div>}
                        <div className="notification-item-meta">
                          <span>{formatTime(note.createdAt)}</span>
                          {note.isDemoSample && <span className="badge badge-info notification-demo-tag">Demo sample</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {signOutError && <span className="text-xs text-danger topnav-error" role="alert">{signOutError}</span>}

        {/* Sign Out Button (desktop header). Mobile users can also sign out from bottom navigation. */}
        <button
          className="btn btn-secondary btn-sm topnav-signout-btn"
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
