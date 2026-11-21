// ==============================================================================
// Bottom Navigation (Mobile)
// Shows main navigation options on mobile screens for Active and Demo modes.
// Includes a "More" menu so all existing navigation options and Sign Out remain
// easily accessible without making the bar crowded.
// ==============================================================================
import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, History, Search, AlertTriangle, FileText,
  Settings, Info, BookOpen, UserCircle, Brain, Monitor, MoreHorizontal,
  LogOut, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ACTIVE_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/history', label: 'History', icon: History },
  { path: '/analyse', label: 'Analysis', icon: Search },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

const DEMO_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tutorial', label: 'How It Works', icon: BookOpen },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/history', label: 'History', icon: History },
  { path: '/profile', label: 'Profile', icon: UserCircle },
  { path: '/analyse', label: 'Analysis', icon: Search },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/adaptive', label: 'Adaptive', icon: Brain },
  { path: '/monitoring', label: 'Monitoring', icon: Monitor },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { currentMode, alerts, signOut } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const navItems = useMemo(
    () => (currentMode === 'ACTIVE' ? ACTIVE_NAV_ITEMS : DEMO_NAV_ITEMS),
    [currentMode]
  );

  // Show key items in the bar and keep all remaining items + Sign Out in the More menu.
  const primaryItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);
  const activeAlerts = alerts.filter((a) => a.status === 'active').length;

  const handleSignOut = async () => {
    setSignOutError('');
    try {
      await signOut();
      setMoreOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      setSignOutError(error?.message || 'Could not sign out. Try again.');
      setMoreOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* Expanded menu for additional navigation items and Sign Out */}
      {moreOpen && (
        <div className="bottomnav-more-overlay" onClick={() => setMoreOpen(false)}>
          <div
            className="bottomnav-more-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="More navigation options"
          >
            <div className="bottomnav-more-header">
              <div className="bottomnav-more-title">Navigation & Account</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bottomnav-more-grid">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `bottomnav-more-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.path === '/alerts' && activeAlerts > 0 && (
                      <span className="badge badge-high bottomnav-more-badge">{activeAlerts}</span>
                    )}
                  </NavLink>
                );
              })}

              {/* Sign Out is always easy to find on mobile in this bottom navigation menu */}
              <button type="button" className="bottomnav-more-item signout-item" onClick={handleSignOut}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>

            {signOutError && <div className="text-xs text-danger mt-2" role="alert">{signOutError}</div>}
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon-wrap">
                <Icon size={18} />
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span className="bottom-nav-badge">{activeAlerts}</span>
                )}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className={`bottom-nav-item bottom-nav-more-btn ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="More options"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav-icon-wrap">
            <MoreHorizontal size={18} />
          </span>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>
    </>
  );
}
