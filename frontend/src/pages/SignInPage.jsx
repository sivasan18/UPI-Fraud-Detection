import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function SignInPage() {
  const { authenticate } = useApp();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        'Sign-in failed. Check the username and password, then try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="signin-screen">
      <section className="signin-card" aria-labelledby="signin-heading">
        <div className="signin-mark" aria-hidden="true">
          <LockKeyhole size={21} />
        </div>
        <h1 id="signin-heading">Administrator Sign In</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          UPI Fraud Detection & Risk Assessment System
        </p>

        {new URLSearchParams(location.search).has('passwordChanged') && (
          <p className="signin-status" role="status">Password changed. Sign in again.</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Input Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="admin-username">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-username"
                className="form-input"
                type="text"
                autoComplete="username"
                autoCapitalize="characters"
                placeholder="USER1, USER2, USER3, USER4"
                required
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                }}
                style={{
                  paddingLeft: '2.5rem',
                  borderColor: 'var(--yellow-border-active)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--yellow-primary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <User size={16} />
              </div>
            </div>
          </div>

          {/* Password Input Field with Show/Hide Toggle */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className="signin-password-wrap">
              <input
                id="admin-password"
                className="form-input signin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
              />
              <button
                className="signin-visibility"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="signin-error" role="alert">{error}</p>}

          <button
            className="btn btn-primary signin-submit"
            type="submit"
            disabled={isSubmitting || !username || !password}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          <span>Administrator Access: </span>
          <span style={{ color: 'var(--yellow-primary)', fontWeight: 600 }}>USER1</span>,{' '}
          <span style={{ color: 'var(--yellow-primary)', fontWeight: 600 }}>USER2</span>,{' '}
          <span style={{ color: 'var(--yellow-primary)', fontWeight: 600 }}>USER3</span>,{' '}
          <span style={{ color: 'var(--yellow-primary)', fontWeight: 600 }}>USER4</span>
        </div>
      </section>
    </main>
  );
}
