// ==============================================================================
// Smart UPI Fraud Detection and Risk Assessment System
// Hanging College ID Card Login Page (Strict Black, Yellow & White Theme)
// Administrator Access Portal — Achariya College of Engineering and Technology
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
import '../styles/ninjaHangingIdCard.css';

export default function SignInPage() {
  const { authenticate } = useApp();
  const location = useLocation();

  // Active Administrator selection (Default: USER 1 - Megha Mittal / USER1)
  const [selectedAdmin, setSelectedAdmin] = useState(ADMIN_PROFILES[0]);
  const [username, setUsername] = useState(ADMIN_PROFILES[0].username);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable administrator placeholder names (can be edited inline or updated later)
  const [adminNames, setAdminNames] = useState(() =>
    ADMIN_PROFILES.reduce((acc, admin) => {
      acc[admin.id] = admin.fullName;
      return acc;
    }, {})
  );
  const [isEditingName, setIsEditingName] = useState(false);

  // Handle Administrator Selection (USER 1 .. USER 4)
  const handleSelectAdmin = (adminObj) => {
    setSelectedAdmin(adminObj);
    setUsername(adminObj.username);
    setIsEditingName(false);
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

  const currentDisplayName = adminNames[selectedAdmin.id] || selectedAdmin.fullName;

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
                  title={`Select ${admin.userLabel} (${adminNames[admin.id] || admin.fullName})`}
                >
                  <span className="admin-select-title">{admin.userLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Profile Photo Frame (Female Avatar) & Circular Admin Badge */}
          <AdminAvatarFrame
            persona={{
              ...selectedAdmin,
              fullName: currentDisplayName,
            }}
          />

          {/* Identity Block: Editable Full Name & Administrator Designation */}
          <div className="ninja-identity-block">
            {isEditingName ? (
              <input
                type="text"
                className="admin-name-edit-input"
                value={currentDisplayName}
                onChange={(e) =>
                  setAdminNames((prev) => ({
                    ...prev,
                    [selectedAdmin.id]: e.target.value,
                  }))
                }
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                }}
                autoFocus
                aria-label="Edit administrator name"
              />
            ) : (
              <h2
                className="ninja-full-name admin-editable-name"
                onClick={() => setIsEditingName(true)}
                title="Click to edit administrator name"
              >
                <span>{currentDisplayName}</span>
                <span className="admin-name-edit-pencil" aria-hidden="true">✎</span>
              </h2>
            )}
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
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid #000000',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                    <span>Verifying Access…</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
