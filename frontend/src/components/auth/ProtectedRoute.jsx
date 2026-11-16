// ==============================================================================
// Smart UPI Fraud Detection System
// Protected Route Guard (React Router 6)
// Redirects unauthenticated users to /login and prevents premature redirects
// ==============================================================================
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function ProtectedRoute() {
  const { isAuthenticated, sessionChecked } = useApp();
  const location = useLocation();

  // 1. Wait until initial Supabase session check is complete
  if (!sessionChecked) {
    return (
      <main
        className="signin-screen"
        aria-busy="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#000000',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 38,
              height: 38,
              border: '3px solid rgba(250, 204, 21, 0.15)',
              borderTopColor: '#facc15',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#a3a3a3', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            Checking authentication session…
          </p>
        </div>
      </main>
    );
  }

  // 2. Redirect unauthenticated users immediately to /login with replace: true
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Render child protected routes within Layout
  return <Outlet />;
}
