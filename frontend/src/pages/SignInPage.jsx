// ==============================================================================
// Smart UPI Fraud Detection and Risk Assessment System
// Hanging College ID Card Login Portal (Strict Black, Yellow & White Theme)
// Administrator Access Portal — Achariya College of Engineering and Technology
//
// WHAT THIS PAGE CONTAINS:
// ------------------------------------------------------------------------------
// 1. Hanging Lanyard Assembly (Lanyard strap with vertical "ACHARIYA COLLEGE" text,
//    metal suspension ring, and physical clip).
// 2. ID Card Header (Shield crest emblem, centered "ADMINISTRATOR" title, and Reg No).
// 3. Four User Selection Buttons (USER 1, USER 2, USER 3, USER 4).
// 4. Dynamic Profile Information (Profile photo, Full Name, Designation, and 2x2 stats).
// 5. Active Mode Authentication Form (Username, password toggle, solid yellow Sign In button).
// 6. Demo Mode Direct Access Button (Quick synthetic demonstration sandbox via password: admin123).
// ==============================================================================
import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ADMIN_PROFILES } from '../data/adminProfiles';
import LanyardClip from '../components/auth/LanyardClip';
import AdminEmblem from '../components/auth/AdminEmblem';
import AdminAvatarFrame from '../components/auth/AdminAvatarFrame';
import IdBarcode from '../components/auth/IdBarcode';
import PulseRingLoader from '../components/common/PulseRingLoader';
import '../styles/ninjaHangingIdCard.css';

export default function SignInPage() {
  const { authenticate, loginDemoMode } = useApp();
  const location = useLocation();

  // Active Administrator selection (Default: USER 1 - Gopika / USER1)
  const [selectedAdmin, setSelectedAdmin] = useState(ADMIN_PROFILES[0]);
  const [username, setUsername] = useState(ADMIN_PROFILES[0].username);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo Mode Login Modal State
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoPassword, setDemoPassword] = useState('');
  const [demoError, setDemoError] = useState('');
  const [isDemoVerifying, setIsDemoVerifying] = useState(false);

  // Handle Administrator Selection (USER 1 .. USER 4)
  const handleSelectAdmin = (adminObj) => {
    setSelectedAdmin(adminObj);
    setUsername(adminObj.username);
    setError('');
  };

  // Submit Authentication
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authenticate(username, password);
      setPassword('');
    } catch (requestError) {
      setError(
        requestError?.message ||
        'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Demo Mode Login
  const handleDemoSubmit = async (event) => {
    event.preventDefault();
    setDemoError('');
    setIsDemoVerifying(true);
    try {
      await loginDemoMode(demoPassword);
      setDemoPassword('');
      setShowDemoModal(false);
    } catch (err) {
      setDemoError(err?.message || 'Incorrect demo password (admin123).');
      setIsDemoVerifying(false);
    }
  };

  return (
    <main className="hanging-screen" aria-label="Administrator Authentication Card">
      {/* 1. Lanyard Strap with ACHARIYA COLLEGE Branding & Chrome Clip Assembly */}
      <LanyardClip />

      {/* 2. Hanging ID Card with Physics Sway Animation */}
      <div className="hanging-card-wrapper">
        <section className="id-card" aria-labelledby="id-card-title-heading">
          {/* Glass glare specular line across card surface */}
          <div className="id-card-sheen" aria-hidden="true" />

          {/* Top oblong punched slot through which lanyard ring passes */}
          <div className="id-card-slot" aria-hidden="true" />

          {/* Header: Academic Shield Crest, ADMINISTRATOR Title, Registration Number */}
          <header className="id-card-header">
            <div className="id-card-title-group">
              <AdminEmblem size={22} color="#facc15" />
              <h1 id="id-card-title-heading" className="id-card-title">
                ADMINISTRATOR
              </h1>
            </div>
            <span className="id-card-reg-no">{selectedAdmin.regNumber}</span>
          </header>

          {/* Four Selectable Administrators: USER 1, USER 2, USER 3, USER 4 */}
          <div className="admin-selector-strip" role="tablist" aria-label="Select Administrator">
            {ADMIN_PROFILES.map((admin) => {
              const isSelected = selectedAdmin.id === admin.id;
              return (
                <button
                  key={admin.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`admin-select-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectAdmin(admin)}
                  title={`Select ${admin.userLabel} (${admin.fullName})`}
                >
                  <span className="admin-select-title">{admin.userLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Profile Photo Frame (Female Avatar) & Circular Admin Badge */}
          <AdminAvatarFrame persona={selectedAdmin} />

          {/* Identity Block: Administrator Real Full Name & Designation (Non-editable) */}
          <div className="ninja-identity-block">
            <h2 className="ninja-full-name">
              {selectedAdmin.fullName}
            </h2>
            <p className="ninja-designation">{selectedAdmin.designation}</p>
          </div>

          {/* 2x2 Metadata Stats Grid: College, Location, Department, Since */}
          <div className="ninja-stats-grid">
            <div className="ninja-stat-item">
              <span className="ninja-stat-label">College</span>
              <span className="ninja-stat-value">{selectedAdmin.college}</span>
            </div>
            <div className="ninja-stat-item">
              <span className="ninja-stat-label">Location</span>
              <span className="ninja-stat-value">{selectedAdmin.location}</span>
            </div>
            <div className="ninja-stat-item">
              <span className="ninja-stat-label">Department</span>
              <span className="ninja-stat-value">{selectedAdmin.department}</span>
            </div>
            <div className="ninja-stat-item">
              <span className="ninja-stat-label">Since</span>
              <span className="ninja-stat-value">{selectedAdmin.since}</span>
            </div>
          </div>

          {/* Barcode & Status Strip */}
          <IdBarcode regNumber={selectedAdmin.regNumber} handle={selectedAdmin.handle} />

          {/* Login Form Section: Username, Password & Solid Yellow SIGN IN Button */}
          <div className="id-login-section">
            {new URLSearchParams(location.search).has('passwordChanged') && (
              <div className="id-login-status" role="status">
                Password updated successfully. Please sign in with your new password.
              </div>
            )}

            {error && (
              <div className="id-login-error" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Username Input Field */}
              <div className="id-input-group">
                <label className="id-input-label" htmlFor="admin-username-input">
                  <span>Username</span>
                  <span style={{ fontSize: '0.62rem', color: '#a3a3a3', fontWeight: 600 }}>
                    {selectedAdmin.userLabel}
                  </span>
                </label>
                <div className="id-input-wrapper">
                  <div className="id-input-icon">
                    <User size={16} />
                  </div>
                  <input
                    id="admin-username-input"
                    className="id-text-input"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="characters"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>

              {/* Password Input Field (No default password hint displayed) */}
              <div className="id-input-group">
                <label className="id-input-label" htmlFor="admin-password-input">
                  <span>Password</span>
                </label>
                <div className="id-input-wrapper">
                  <div className="id-input-icon">
                    <LockKeyhole size={16} />
                  </div>
                  <input
                    id="admin-password-input"
                    className="id-text-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    className="id-password-toggle"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Solid Yellow SIGN IN Button */}
              <button
                className="id-signin-btn"
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
              >
                {isSubmitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <PulseRingLoader variant="inline" size={18} />
                    <span>Verifying Access…</span>
                  </span>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Quick Demo Mode Direct Access Button */}
              <div style={{ marginTop: '0.9rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoModal(true);
                    setDemoError('');
                    setDemoPassword('');
                  }}
                  style={{
                    background: 'rgba(250, 204, 21, 0.05)',
                    border: '1px dashed rgba(250, 204, 21, 0.45)',
                    borderRadius: '8px',
                    color: '#facc15',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    fontFamily: "'Space Grotesk', monospace, sans-serif",
                    letterSpacing: '0.06em',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  title="Launch Demo Mode with pre-seeded synthetic data (Password: admin123)"
                >
                  <span>⚡ Demo Mode Login (Password: admin123)</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Demo Mode Direct Login Modal */}
      {showDemoModal && (
        <div
          className="modal-overlay"
          onClick={() => !isDemoVerifying && setShowDemoModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(250, 204, 21, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LockKeyhole size={18} color="#facc15" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#facc15' }}>
                    Demo Mode Login
                  </h3>
                  <p className="text-xs text-tertiary">
                    Enter the demo password to immediately explore synthetic data
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDemoModal(false)}
                disabled={isDemoVerifying}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              className="p-3 mb-4"
              style={{
                background: 'rgba(250, 204, 21, 0.08)',
                borderRadius: 8,
                border: '1px solid rgba(250, 204, 21, 0.3)',
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Demo Mode loads 30 pre-configured synthetic transactions and benchmark risk profiles for college review demonstration.
            </div>

            {demoError && (
              <div
                className="notice-box security mb-4"
                style={{
                  padding: '0.65rem 0.9rem',
                  background: 'rgba(250, 204, 21, 0.1)',
                  border: '1px solid #facc15',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} color="#facc15" />
                <span style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: 600 }}>
                  {demoError}
                </span>
              </div>
            )}

            <form onSubmit={handleDemoSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#facc15', fontSize: '0.78rem', fontWeight: 700 }}>
                  Demo Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="admin123"
                  required
                  autoFocus
                  value={demoPassword}
                  onChange={(e) => {
                    setDemoPassword(e.target.value);
                    setDemoError('');
                  }}
                  style={{
                    width: '100%',
                    background: '#0a0a0a',
                    border: '1px solid rgba(250, 204, 21, 0.4)',
                    color: '#ffffff',
                    borderRadius: 8,
                    padding: '0.6rem 0.8rem',
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDemoModal(false)}
                  disabled={isDemoVerifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isDemoVerifying || !demoPassword}
                  style={{
                    background: '#facc15',
                    color: '#000000',
                    fontWeight: 700,
                    border: 0,
                    padding: '0.6rem 1.2rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {isDemoVerifying ? (
                    <>
                      <PulseRingLoader variant="inline" size={16} />
                      <span>Verifying & Launching Demo…</span>
                    </>
                  ) : (
                    'Verify & Launch Demo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
