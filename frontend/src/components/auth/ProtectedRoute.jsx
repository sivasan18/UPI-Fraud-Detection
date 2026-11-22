// ==============================================================================
// Smart UPI Fraud Detection System
// Protected Route Guard (React Router 6)
// Redirects unauthenticated users to /login and prevents premature redirects
// ==============================================================================
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import PulseRingLoader from '../common/PulseRingLoader';

export default function ProtectedRoute() {
  const { isAuthenticated, sessionChecked } = useApp();
  const location = useLocation();

  // 1. Wait until initial Supabase session check is complete
  if (!sessionChecked) {
    return (
      <PulseRingLoader
        variant="fullscreen"
        size="lg"
        message="UPI FRAUD DETECTION SYSTEM"
        subtitle="Verifying security credentials…"
      />
    );
  }

  // 2. Redirect unauthenticated users immediately to /login with replace: true
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Render child protected routes within Layout
  return <Outlet />;
}
