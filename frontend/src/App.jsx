// ==============================================================================
// Smart UPI Fraud Detection System
// Application Router with Centralized Route Protection & Logout Redirection
// ==============================================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/Dashboard';
import Tutorial from './pages/Tutorial';
import UploadTransaction from './pages/UploadTransaction';
import OCRExtraction from './pages/OCRExtraction';
import DataConfirmation from './pages/DataConfirmation';
import TransactionHistory from './pages/TransactionHistory';
import BehaviourProfile from './pages/BehaviourProfile';
import AnalyseTransaction from './pages/AnalyseTransaction';
import FraudAnalysisResult from './pages/FraudAnalysisResult';
import SuspiciousAlert from './pages/SuspiciousAlert';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import AdaptiveLearning from './pages/AdaptiveLearning';
import ModelMonitoring from './pages/ModelMonitoring';
import Settings from './pages/Settings';
import AboutProject from './pages/AboutProject';

function App() {
  const { isAuthenticated, sessionChecked } = useApp();

  // 1. Initial Session Verification Guard: Prevent premature redirects while Supabase resolves session
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

  return (
    <Routes>
      {/* 2. Public Login Route: If authenticated user visits /login, redirect to Dashboard */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignInPage />}
      />
      <Route
        path="/signin"
        element={<Navigate to="/login" replace />}
      />

      {/* 3. Protected Routes: All private application pages require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/upload" element={<UploadTransaction />} />
          <Route path="/extraction" element={<OCRExtraction />} />
          <Route path="/confirm" element={<DataConfirmation />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/profile" element={<BehaviourProfile />} />
          <Route path="/analyse" element={<AnalyseTransaction />} />
          <Route path="/result" element={<FraudAnalysisResult />} />
          <Route path="/suspicious" element={<SuspiciousAlert />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/adaptive" element={<AdaptiveLearning />} />
          <Route path="/monitoring" element={<ModelMonitoring />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<AboutProject />} />
        </Route>
      </Route>

      {/* 4. Wildcard Catch-All: Redirect unknown paths to / (if authenticated) or /login */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
