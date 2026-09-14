// ==============================================================================
// Smart UPI Fraud Detection System
// Sidebar Navigation Component
// ==============================================================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, History, UserCircle, Search,
  AlertTriangle, FileText, Brain, Monitor, Settings, Info,
  ChevronLeft, Database, BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { section: 'Overview' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tutorial', label: 'How It Works', icon: BookOpen },
  
  { section: 'Transactions' },
  { path: '/upload', label: 'Upload Transactions', icon: Upload },
  { path: '/history', label: 'Transaction History', icon: History },
  { path: '/profile', label: 'Behaviour Profile', icon: UserCircle },
  
  { section: 'Intelligence' },
  { path: '/analyse', label: 'Fraud Analysis', icon: Search },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileText },
  
  { section: 'System' },
  { path: '/adaptive', label: 'Adaptive Learning', icon: Brain },
  { path: '/monitoring', label: 'Model Monitoring', icon: Monitor },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About Project', icon: Info },
];

export default function Sidebar({ isOpen, onClose }) {
  const { currentMode, demoModeEnabled, alerts } = useApp();
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src="/favicon.svg" alt="Shield Logo" />
          </div>
          <div className="logo-text">
            <h3>UPI Fraud Detection</h3>
          </div>
          {onClose && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ marginLeft: 'auto', padding: 4 }}
              aria-label="Close menu"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.section) {
              return (
                <div className="sidebar-section-label" key={`section-${i}`}>
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
                end={item.path === '/'}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span className="badge badge-high" style={{ marginLeft: 'auto', fontSize: '0.66rem', padding: '2px 7px' }}>
                    {activeAlerts}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {/* Current Mode Indicator */}
          <div
            className="sidebar-status"
            style={{
              marginBottom: '6px',
              background: currentMode === 'ACTIVE' ? 'rgba(16,185,129,0.08)' : 'rgba(236,72,153,0.1)',
              borderColor: currentMode === 'ACTIVE' ? 'rgba(16,185,129,0.25)' : 'rgba(236,72,153,0.3)',
              color: currentMode === 'ACTIVE' ? '#34d399' : '#f472b6',
            }}
          >
            <Database size={13} />
            <span>{currentMode === 'ACTIVE' ? '● ACTIVE MODE' : '● DEMO MODE'}</span>
          </div>

          {/* Demo mode synthetic data warning */}
          {currentMode === 'DEMO' && (
            <div className="sidebar-status" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', marginBottom: 6 }}>
              <AlertTriangle size={12} />
              <span style={{ fontSize: '0.62rem' }}>SYNTHETIC DATA — Demo Only</span>
            </div>
          )}

          {/* Demo removal status */}
          {!demoModeEnabled && (
            <div className="sidebar-status" style={{ color: '#34d399', borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', marginBottom: 6 }}>
              <span style={{ fontSize: '0.62rem' }}>Active Mode Only</span>
            </div>
          )}

          <div className="sidebar-status">
            <div className="status-dot" />
            <span>System: SQLite Localhost</span>
          </div>
        </div>
      </aside>
    </>
  );
}
