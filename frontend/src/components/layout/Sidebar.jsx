// ==============================================================================
// Smart UPI Fraud Detection System
// Sidebar Navigation Component
// Dynamic Active Mode vs Demo Mode Navigation Visibility
// ==============================================================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, History, UserCircle, Search,
  AlertTriangle, FileText, Brain, Monitor, Settings, Info,
  ChevronLeft, BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ACTIVE_NAV_SECTIONS = [
  {
    section: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Transactions',
    items: [
      { path: '/upload', label: 'Upload Transactions', icon: Upload },
      { path: '/history', label: 'Transaction History', icon: History },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { path: '/analyse', label: 'Fraud Analysis', icon: Search },
      { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
      { path: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    section: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/about', label: 'About Project', icon: Info },
    ],
  },
];

const DEMO_NAV_SECTIONS = [
  {
    section: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/tutorial', label: 'How It Works', icon: BookOpen },
    ],
  },
  {
    section: 'Transactions',
    items: [
      { path: '/upload', label: 'Upload Transactions', icon: Upload },
      { path: '/history', label: 'Transaction History', icon: History },
      { path: '/profile', label: 'Behaviour Profile', icon: UserCircle },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { path: '/analyse', label: 'Fraud Analysis', icon: Search },
      { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
      { path: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    section: 'System',
    items: [
      { path: '/adaptive', label: 'Adaptive Learning', icon: Brain },
      { path: '/monitoring', label: 'Model Monitoring', icon: Monitor },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/about', label: 'About Project', icon: Info },
    ],
  },
];

export default function Sidebar({ isCollapsed, onClose }) {
  const { currentMode, databaseBackend, alerts } = useApp();
  const activeAlerts = alerts.filter((a) => a.status === 'active').length;

  const sections = currentMode === 'ACTIVE' ? ACTIVE_NAV_SECTIONS : DEMO_NAV_SECTIONS;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img src="/favicon.svg" alt="Shield Logo" />
        </div>
        <div className="logo-text">
          <h3>UPI Fraud Detection</h3>
        </div>
        {onClose && (
          <button
            className="btn btn-ghost btn-sm close-sidebar-btn"
            onClick={onClose}
            style={{ marginLeft: 'auto', padding: 4 }}
            aria-label="Close sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {sections.map((sec, secIdx) => (
          <div key={`section-${secIdx}`} className="sidebar-section-group">
            <div className="sidebar-section-label">
              {sec.section}
            </div>
            {sec.items.map((item) => {
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
                    <span
                      className="badge badge-high"
                      style={{ marginLeft: 'auto', fontSize: '0.66rem', padding: '2px 7px' }}
                    >
                      {activeAlerts}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Mode Indicator */}
        <div
          className="sidebar-status"
          style={{
            marginBottom: '6px',
            background: currentMode === 'ACTIVE' ? 'rgba(250, 204, 21, 0.08)' : 'rgba(250, 204, 21, 0.12)',
            borderRadius: '6px',
            padding: '4px 8px',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#facc15',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600, color: '#facc15' }}>
            {currentMode === 'ACTIVE' ? 'ACTIVE MODE' : 'DEMO MODE'}
          </span>
        </div>

        {/* Database backend */}
        <div className="sidebar-status">
          <span className="status-dot online" />
          <span>{databaseBackend || 'Supabase PostgreSQL'}</span>
        </div>
      </div>
    </aside>
  );
}
