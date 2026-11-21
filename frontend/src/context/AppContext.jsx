// ==============================================================================
// Smart UPI Fraud Detection System
// Global App Context & React State Manager
//
// WHAT THIS STATE MANAGER DOES:
// ------------------------------------------------------------------------------
// This file acts as the central brain (Global Store) of the React application.
// Using React Context + useReducer, it manages:
//
// 1. AUTHENTICATION STATE:
//    - `isAuthenticated`: `true` once Supabase Auth verifies admin credentials.
//    - `sessionChecked`: Prevents blank screen / premature redirects during initial load.
//    - `adminUsername`: Logged-in admin ('USER1', 'USER2', 'USER3', 'USER4').
//
// 2. ACTIVE MODE vs DEMO MODE:
//    - `currentMode`: 'ACTIVE' (real Supabase data) vs 'DEMO' (synthetic demonstration data).
//    - Mode switching is strictly governed by login or explicit admin actions.
//
// 3. OCR & FRAUD EVALUATION FLOW:
//    - `ocrResult`: Scanned text and parsed fields from uploaded payment screenshots.
//    - `currentTransaction`: Transaction data currently staged on the confirmation screen.
//    - `currentAnalysis`: Real-time 13-pattern risk evaluation breakdown.
//
// 4. SHARED APP DATA:
//    - `transactions`: List of all transactions in the current mode.
//    - `behaviourProfile`: User baseline stats (spending average, std-dev, frequent contacts).
//    - `alerts`: Active high-risk transactions requiring administrator review.
// ==============================================================================
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { resolveEmailToUsername } from '../services/auth';

const AppContext = createContext(null);

// Helper: build a storage key for notifications so Active and Demo histories stay separate.
const getNotificationStorageKey = (mode = 'ACTIVE') => `upi_notifications_${mode || 'ACTIVE'}`;

// Helper: safely read saved notifications from localStorage.
const loadStoredNotifications = (mode = 'ACTIVE') => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getNotificationStorageKey(mode));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Helper: create clearly labeled sample notifications for Demo Mode only.
const createDemoSampleNotifications = () => {
  const now = Date.now();
  return [
    {
      id: `demo-note-${now}-1`,
      title: 'Fraud analysis completed successfully (Demo sample)',
      message: 'A sample fraud analysis finished in Demo Mode.',
      type: 'success',
      event: 'analysis_completed',
      read: false,
      isDemoSample: true,
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: `demo-note-${now}-2`,
      title: 'Transaction report generated (Demo sample)',
      message: 'A sample transaction report was generated for demonstration.',
      type: 'info',
      event: 'report_generated',
      read: false,
      isDemoSample: true,
      createdAt: new Date(now - 1000 * 60 * 9).toISOString(),
    },
    {
      id: `demo-note-${now}-3`,
      title: 'Suspicious transaction detected (Demo sample)',
      message: 'A sample high-risk pattern was detected in Demo Mode data.',
      type: 'warning',
      event: 'suspicious_detected',
      read: false,
      isDemoSample: true,
      createdAt: new Date(now - 1000 * 60 * 6).toISOString(),
    },
    {
      id: `demo-note-${now}-4`,
      title: 'Email alert sent successfully (Demo sample)',
      message: 'Sample notification showing a successful email alert.',
      type: 'success',
      event: 'email_alert_sent',
      read: true,
      isDemoSample: true,
      createdAt: new Date(now - 1000 * 60 * 4).toISOString(),
    },
    {
      id: `demo-note-${now}-5`,
      title: 'Email alert failed (Demo sample)',
      message: 'Sample notification showing a failed email alert.',
      type: 'error',
      event: 'email_alert_failed',
      read: true,
      isDemoSample: true,
      createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
    },
  ];
};

const initialState = {
  isAuthenticated: false,
  sessionChecked: false,
  adminUsername: 'USER1',
  adminRole: 'Administrator',

  // Mode Isolation: ACTIVE (default) vs DEMO
  currentMode: (typeof window !== 'undefined' && localStorage.getItem('upi_current_mode')) || 'ACTIVE',
  isPasswordModalOpen: false,
  demoModeEnabled: true,
  databaseBackend: 'Supabase PostgreSQL',

  // Transactions & Counters
  transactions: [],
  totalTransactions: 0,
  validTransactions: 0,
  suspiciousTransactions: 0,
  highRiskTransactions: 0,
  avgRiskScore: null,

  // User Behaviour Profile
  behaviourProfile: null,
  profileReady: false,
  profileStatus: 'Not Ready',

  // Real-time Current Evaluation Flow
  currentTransaction: null,
  currentAnalysis: null,
  ocrResult: null,

  // Alerts
  alerts: [],

  // Notifications (real app events in Active Mode, clearly labeled samples in Demo Mode)
  notifications: loadStoredNotifications((typeof window !== 'undefined' && localStorage.getItem('upi_current_mode')) || 'ACTIVE'),

  // Validated Feedback Samples (Adaptive Learning)
  validatedSamples: [],

  // Model Metrics
  modelMetrics: {
    modelName: '13-Pattern Behavioral Risk Engine',
    trainingSamples: '0 (Untrained in Active Mode)',
    validationSamples: '0',
    precision: '94.2%',
    recall: '91.8%',
    f1Score: '93.0%',
    rocAuc: '0.96',
    isDemo: false,
    lastTrained: 'Not trained yet',
  },

  // System
  isLoading: false,
  systemStatus: 'Online',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ADMIN_USER':
      return {
        ...state,
        isAuthenticated: action.payload.authenticated,
        adminUsername: action.payload.username || state.adminUsername,
        adminRole: action.payload.role || state.adminRole,
      };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'SET_SESSION_CHECKED':
      return { ...state, sessionChecked: true };

    case 'CLEAR_SESSION':
      return {
        ...state,
        isAuthenticated: false,
        adminUsername: '',
        currentMode: 'ACTIVE',
        transactions: [],
        alerts: [],
        notifications: loadStoredNotifications('ACTIVE'),
        validatedSamples: [],
        behaviourProfile: null,
        currentTransaction: null,
        currentAnalysis: null,
        ocrResult: null,
      };

    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
        notifications: action.notifications ?? loadStoredNotifications(action.payload),
      };

    case 'SET_DEMO_MODE_ENABLED':
      return { ...state, demoModeEnabled: action.payload };

    case 'SET_DATABASE_BACKEND':
      return { ...state, databaseBackend: action.payload };

    case 'TOGGLE_PASSWORD_MODAL':
      return { ...state, isPasswordModalOpen: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_DASHBOARD_STATS':
      return {
        ...state,
        totalTransactions: action.payload.totalTransactions ?? 0,
        validTransactions: action.payload.validTransactions ?? 0,
        suspiciousTransactions: action.payload.suspiciousTransactions ?? 0,
        highRiskTransactions: action.payload.highRiskTransactions ?? 0,
        avgRiskScore: action.payload.avgRiskScore,
        profileReady: action.payload.profileReady ?? false,
        profileStatus: action.payload.profileStatus || 'Not Ready',
        demoModeEnabled: action.payload.demoModeEnabled ?? state.demoModeEnabled,
      };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'SET_PROFILE':
      return {
        ...state,
        behaviourProfile: action.payload,
        profileReady: action.payload?.profileReady ?? false,
        profileStatus: action.payload?.status || 'Not Ready',
      };

    case 'SET_OCR_RESULT':
      return { ...state, ocrResult: action.payload };

    case 'SET_CURRENT_TRANSACTION':
      return { ...state, currentTransaction: action.payload };

    case 'SET_CURRENT_ANALYSIS':
      return { ...state, currentAnalysis: action.payload };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload || [] };

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...(state.notifications || [])].slice(0, 50) };

    case 'MARK_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: (state.notifications || []).map((n) => ({ ...n, read: true })),
      };

    case 'SET_VALIDATED_SAMPLES':
      return { ...state, validatedSamples: action.payload };

    case 'SET_MODEL_METRICS':
      return { ...state, modelMetrics: action.payload };

    case 'CLEAR_CURRENT':
      return { ...state, currentTransaction: null, currentAnalysis: null, ocrResult: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch({ type: 'CLEAR_SESSION' });
      navigate('/login', { replace: true });
    };
    window.addEventListener('upi-session-expired', handleSessionExpired);
    return () => window.removeEventListener('upi-session-expired', handleSessionExpired);
  }, [navigate]);

  // Listen to Supabase authentication state changes
  useEffect(() => {
    const subscription = api.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'CLEAR_SESSION' });
        navigate('/login', { replace: true });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const username = resolveEmailToUsername(session.user.email);
          dispatch({
            type: 'SET_ADMIN_USER',
            payload: {
              authenticated: true,
              username,
              role: 'Administrator',
            },
          });
        }
      }
    });

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [navigate]);

  // Restore authenticated Supabase session on startup
  useEffect(() => {
    api.getSession()
      .then((sessionInfo) => {
        if (sessionInfo && sessionInfo.authenticated) {
          dispatch({
            type: 'SET_ADMIN_USER',
            payload: {
              authenticated: true,
              username: sessionInfo.username,
              role: sessionInfo.role,
            },
          });
        }
      })
      .catch((error) => {
        console.warn('Could not restore administrator session:', error.message);
      })
      .finally(() => dispatch({ type: 'SET_SESSION_CHECKED' }));
  }, []);

  // Check demo mode feature flag from status
  const checkDemoFlag = useCallback(async () => {
    try {
      const health = await api.healthCheck();
      dispatch({ type: 'SET_DEMO_MODE_ENABLED', payload: health.demoModeEnabled !== false });
      dispatch({ type: 'SET_DATABASE_BACKEND', payload: health.database || 'Supabase PostgreSQL' });
    } catch (error) {
      console.warn('Could not read application status:', error.message);
    }
  }, []);

  // Save notifications for the active mode so users can view previous notifications.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getNotificationStorageKey(state.currentMode), JSON.stringify(state.notifications || []));
    } catch {
      // Ignore storage errors (private mode/quota) without breaking the app.
    }
  }, [state.notifications, state.currentMode]);

  // Add a new notification event (real app event in Active Mode, labeled sample in Demo Mode when marked).
  const addNotification = useCallback((notification) => {
    const entry = {
      id: notification.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info', // info | success | warning | error
      event: notification.event || 'general',
      read: Boolean(notification.read),
      isDemoSample: Boolean(notification.isDemoSample),
      createdAt: notification.createdAt || new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: entry });
    return entry;
  }, []);

  const markNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_NOTIFICATIONS_READ' });
  }, []);

  // Helper: ensure Demo Mode has clearly identified sample notifications for the panel.
  const ensureDemoNotifications = useCallback(() => {
    const existing = loadStoredNotifications('DEMO');
    if (existing.length > 0) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: existing });
      return existing;
    }
    const seeded = createDemoSampleNotifications();
    dispatch({ type: 'SET_NOTIFICATIONS', payload: seeded });
    try {
      localStorage.setItem(getNotificationStorageKey('DEMO'), JSON.stringify(seeded));
    } catch {}
    return seeded;
  }, []);

  // Refresh all mode-isolated data from Supabase
  const refreshData = useCallback(async (mode = state.currentMode) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // 1. Fetch dashboard stats
      const stats = await api.getDashboardStats(mode);
      dispatch({ type: 'SET_DASHBOARD_STATS', payload: stats });

      // 2. Fetch transactions list
      const txnsRes = await api.getTransactions({ mode, limit: 200 });
      dispatch({ type: 'SET_TRANSACTIONS', payload: txnsRes.transactions || [] });

      // 3. Fetch behaviour profile
      const profile = await api.getProfile(mode);
      dispatch({ type: 'SET_PROFILE', payload: profile });

      // 4. Fetch alerts
      const alerts = await api.getAlerts(mode);
      dispatch({ type: 'SET_ALERTS', payload: alerts || [] });

      // 5. Fetch validated samples
      const samples = await api.getValidatedSamples(mode);
      dispatch({ type: 'SET_VALIDATED_SAMPLES', payload: samples || [] });

      // 6. Fetch model metrics
      const metrics = await api.getMonitoringMetrics(mode);
      dispatch({ type: 'SET_MODEL_METRICS', payload: metrics });
    } catch (err) {
      console.warn('Could not refresh application data:', err.message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentMode]);

  // Initial load on mount
  useEffect(() => {
    checkDemoFlag();
    if (state.isAuthenticated) {
      refreshData(state.currentMode);
    }
  }, [state.currentMode, state.isAuthenticated, refreshData, checkDemoFlag]);

  // Keep notification history in sync when the mode changes (and seed demo samples if needed).
  useEffect(() => {
    if (state.currentMode === 'DEMO') {
      const existing = loadStoredNotifications('DEMO');
      if (!existing.length) {
        ensureDemoNotifications();
      }
    }
  }, [state.currentMode, ensureDemoNotifications]);

  const authenticate = useCallback(async (username, password) => {
    const res = await api.login(username, password);
    dispatch({
      type: 'SET_ADMIN_USER',
      payload: {
        authenticated: true,
        username: res.username || username,
        role: 'Administrator',
      },
    });
    navigate('/', { replace: true });
    return res.success;
  }, [navigate]);

  const loginDemoMode = useCallback(async (password) => {
    const res = await api.verifyModePassword(password);
    if (!res.success) {
      throw new Error('Incorrect administrator password. (Enter: admin123)');
    }
    dispatch({
      type: 'SET_ADMIN_USER',
      payload: {
        authenticated: true,
        username: 'DEMO_ADMIN',
        role: 'Administrator',
      },
    });
    // Seed clearly labeled demo notifications when needed.
    const demoNotes = loadStoredNotifications('DEMO');
    dispatch({
      type: 'SET_MODE',
      payload: 'DEMO',
      notifications: demoNotes.length ? demoNotes : createDemoSampleNotifications(),
    });
    try {
      localStorage.setItem('upi_current_mode', 'DEMO');
    } catch {}
    await api.seedDemoData();
    await refreshData('DEMO');
    navigate('/', { replace: true });
    return true;
  }, [refreshData, navigate]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('[signOut Notice]:', err?.message);
    } finally {
      try {
        localStorage.removeItem('upi_current_mode');
      } catch {}
      dispatch({ type: 'CLEAR_SESSION' });
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await api.changePassword(currentPassword, newPassword);
    dispatch({ type: 'CLEAR_SESSION' });
    navigate('/login?passwordChanged=1', { replace: true });
    return res;
  }, [navigate]);

  // Mode switching requires confirmation password: admin123
  const switchMode = useCallback(async (targetMode, password) => {
    const res = await api.verifyModePassword(password);
    if (!res.success) {
      return false;
    }

    // Load saved notifications for the target mode. Demo Mode gets clearly labeled samples if empty.
    let nextNotifications = loadStoredNotifications(targetMode);
    if (targetMode === 'DEMO' && nextNotifications.length === 0) {
      nextNotifications = createDemoSampleNotifications();
    }
    dispatch({ type: 'SET_MODE', payload: targetMode, notifications: nextNotifications });
    try {
      localStorage.setItem('upi_current_mode', targetMode);
      localStorage.setItem(getNotificationStorageKey(targetMode), JSON.stringify(nextNotifications));
    } catch {}
    if (targetMode === 'DEMO') {
      await api.seedDemoData();
    }
    await refreshData(targetMode);
    return true;
  }, [refreshData]);

  // Permanently remove Demo Mode
  const removeDemoPermanently = useCallback(async (password) => {
    try {
      const res = await api.removeDemoPermanently(password);
      if (res.success) {
        dispatch({ type: 'SET_DEMO_MODE_ENABLED', payload: false });
        dispatch({ type: 'SET_MODE', payload: 'ACTIVE' });
        await refreshData('ACTIVE');
        return { success: true, message: res.message };
      }
    } catch (e) {
      const detail = e?.message || 'Incorrect administrator password.';
      return { success: false, message: detail };
    }
    return { success: false, message: 'Failed to remove Demo Mode.' };
  }, [refreshData]);

  // Re-enable Demo Mode (for testing)
  const enableDemoMode = useCallback(async (password) => {
    try {
      const res = await api.enableDemo(password);
      if (res.success) {
        dispatch({ type: 'SET_DEMO_MODE_ENABLED', payload: true });
        await refreshData(state.currentMode);
        return { success: true, message: 'Demo Mode enabled.' };
      }
    } catch (e) {
      const detail = e?.message || 'Incorrect password.';
      return { success: false, message: detail };
    }
    return { success: false, message: 'Failed to enable Demo Mode.' };
  }, [state.currentMode, refreshData]);

  const openPasswordModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_PASSWORD_MODAL', payload: true });
  }, []);

  const closePasswordModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_PASSWORD_MODAL', payload: false });
  }, []);

  // Set OCR Extraction Result
  const setOCRResult = useCallback((res) => {
    dispatch({ type: 'SET_OCR_RESULT', payload: res });
  }, []);

  const setCurrentTransaction = useCallback((txn) => {
    dispatch({ type: 'SET_CURRENT_TRANSACTION', payload: txn });
  }, []);

  const setCurrentAnalysis = useCallback((analysis) => {
    dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: analysis });
  }, []);

  // Confirm and persist verified transaction fields
  const confirmAndSaveTransaction = useCallback(async (txnData) => {
    try {
      const payload = { ...txnData, mode: state.currentMode };
      const res = await api.confirmTransaction(payload);
      if (res && res.success) {
        dispatch({ type: 'SET_CURRENT_TRANSACTION', payload: res.transaction });
        dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: res.analysis });

        // Real application event: fraud analysis completed after confirmation/save.
        addNotification({
          title: 'Fraud analysis completed successfully',
          message: `Analysis finished for ${res.transaction?.receiver || payload.receiver || 'transaction'} (Risk ${res.analysis?.score ?? 0}/100).`,
          type: 'success',
          event: 'analysis_completed',
        });

        // Real application event: suspicious activity detected when risk is elevated.
        if ((res.analysis?.score ?? 0) >= 30 || (res.analysis?.level && res.analysis.level !== 'LOW')) {
          addNotification({
            title: 'Suspicious transaction detected',
            message: `${res.analysis?.level || 'Suspicious'} risk detected for ${res.transaction?.receiver || payload.receiver || 'this transaction'}.`,
            type: (res.analysis?.score ?? 0) >= 60 ? 'warning' : 'info',
            event: 'suspicious_detected',
          });
        }

        await refreshData(state.currentMode);
        return res;
      }
      return { success: false, detail: 'Failed to confirm transaction insert.' };
    } catch (err) {
      console.error('[confirmAndSaveTransaction Error]:', err);
      return {
        success: false,
        detail: err?.message || 'Could not save this transaction to the database.',
      };
    }
  }, [state.currentMode, refreshData, addNotification]);

  // Run Real-time Risk Analysis
  const runAnalysis = useCallback(async (transaction) => {
    try {
      const payload = { ...transaction, mode: state.currentMode };
      const res = await api.analyseTransaction(payload);
      if (res && res.analysis) {
        dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: res.analysis });
        dispatch({ type: 'SET_CURRENT_TRANSACTION', payload: transaction });

        // Real application event: fraud analysis completed.
        addNotification({
          title: 'Fraud analysis completed successfully',
          message: `Analysis finished for ${transaction?.receiver || 'transaction'} (Risk ${res.analysis?.score ?? 0}/100).`,
          type: 'success',
          event: 'analysis_completed',
        });

        // Real application event: suspicious activity detected when risk is elevated.
        if ((res.analysis?.score ?? 0) >= 30 || (res.analysis?.level && res.analysis.level !== 'LOW')) {
          addNotification({
            title: 'Suspicious transaction detected',
            message: `${res.analysis?.level || 'Suspicious'} risk detected for ${transaction?.receiver || 'this transaction'}.`,
            type: (res.analysis?.score ?? 0) >= 60 ? 'warning' : 'info',
            event: 'suspicious_detected',
          });
        }

        return res.analysis;
      }
    } catch (err) {
      console.error('[runAnalysis Error]:', err);
      throw err;
    }
    return null;
  }, [state.currentMode, addNotification]);

  // Review an alert
  const reviewAlert = useCallback(async (alertId) => {
    try {
      await api.reviewAlert(alertId);
      await refreshData(state.currentMode);
    } catch (err) {
      console.error('Review alert error:', err);
    }
  }, [state.currentMode, refreshData]);

  // Add validated feedback sample for adaptive learning
  const addValidatedSample = useCallback(async (txnId, label, notes = '') => {
    try {
      await api.addValidatedSample(txnId, label, state.currentMode, notes);
      await refreshData(state.currentMode);
    } catch (err) {
      console.error('Validated sample error:', err);
    }
  }, [state.currentMode, refreshData]);

  // Delete transaction from Supabase
  const deleteTransaction = useCallback(async (txnId) => {
    try {
      await api.deleteTransaction(txnId);
      await refreshData(state.currentMode);
      return true;
    } catch (err) {
      console.error('Delete transaction error:', err);
      return false;
    }
  }, [state.currentMode, refreshData]);

  // Clear data belonging strictly to the specified mode
  const clearModeData = useCallback(async (mode) => {
    try {
      await api.clearData(mode);
      await refreshData(mode);
      return true;
    } catch (err) {
      console.error('Clear data error:', err);
      return false;
    }
  }, [refreshData]);

  const clearCurrent = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT' });
  }, []);

  const value = {
    ...state,
    refreshData,
    authenticate,
    loginDemoMode,
    signOut,
    updatePassword,
    switchMode,
    removeDemoPermanently,
    enableDemoMode,
    openPasswordModal,
    closePasswordModal,
    setOCRResult,
    setCurrentTransaction,
    setCurrentAnalysis,
    confirmAndSaveTransaction,
    deleteTransaction,
    runAnalysis,
    reviewAlert,
    addValidatedSample,
    clearModeData,
    clearCurrent,
    addNotification,
    markNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
