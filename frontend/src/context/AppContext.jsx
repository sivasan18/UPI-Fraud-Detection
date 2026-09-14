// ==============================================================================
// Smart UPI Fraud Detection System
// Global App Context & State Manager (Active Mode Default + Demo Isolation)
// ==============================================================================
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import api from '../services/api';

const AppContext = createContext(null);

const initialState = {
  // Mode Isolation: ACTIVE (default) vs DEMO
  currentMode: 'ACTIVE',
  isPasswordModalOpen: false,
  demoModeEnabled: true, // Feature flag from backend

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
  
  // Validated Feedback Samples (Adaptive Learning)
  validatedSamples: [],
  
  // Model Metrics
  modelMetrics: {
    modelName: 'XGBoost Classifier',
    trainingSamples: '0 (Untrained in Active Mode)',
    validationSamples: '0',
    precision: '—',
    recall: '—',
    f1Score: '—',
    rocAuc: '—',
    isDemo: false,
    lastTrained: 'Not trained yet'
  },

  // System
  isLoading: false,
  systemStatus: 'Online (Localhost SQLite)',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, currentMode: action.payload };

    case 'SET_DEMO_MODE_ENABLED':
      return { ...state, demoModeEnabled: action.payload };

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

  // Check demo mode feature flag from backend on startup
  const checkDemoFlag = useCallback(async () => {
    try {
      const health = await api.healthCheck();
      dispatch({ type: 'SET_DEMO_MODE_ENABLED', payload: health.demoModeEnabled !== false });
    } catch (e) {
      // Default to true if backend unreachable
    }
  }, []);

  // Refresh all mode-isolated data from SQLite Backend
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
      console.warn('Backend connection warning; running local fallback:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentMode]);

  // Initial load on mount
  useEffect(() => {
    checkDemoFlag();
    refreshData(state.currentMode);
  }, [state.currentMode, refreshData, checkDemoFlag]);

  // Mode switcher with password verification (admin123)
  const switchMode = useCallback(async (targetMode, password) => {
    const passTrim = password ? password.trim() : '';
    if (passTrim === 'admin123') {
      dispatch({ type: 'SET_MODE', payload: targetMode });
      
      // If switching to DEMO mode for the first time and empty, seed it
      if (targetMode === 'DEMO') {
        try {
          await api.seedDemoData();
        } catch (e) {}
      }

      await refreshData(targetMode);
      return true;
    }

    try {
      const res = await api.verifyModePassword(password);
      if (res.success) {
        dispatch({ type: 'SET_MODE', payload: targetMode });
        if (targetMode === 'DEMO') {
          await api.seedDemoData();
        }
        await refreshData(targetMode);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
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
      const detail = e?.response?.data?.detail || 'Incorrect administrator password.';
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
      const detail = e?.response?.data?.detail || 'Incorrect password.';
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

  // Confirm and persist transaction into SQLite
  const confirmAndSaveTransaction = useCallback(async (txnData) => {
    try {
      const payload = { ...txnData, mode: state.currentMode };
      const res = await api.confirmTransaction(payload);
      if (res.success) {
        dispatch({ type: 'SET_CURRENT_TRANSACTION', payload: res.transaction });
        dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: res.analysis });
        await refreshData(state.currentMode);
        return res;
      }
    } catch (err) {
      console.error('Error confirming transaction:', err);
    }
    return null;
  }, [state.currentMode, refreshData]);

  // Run Real-time Risk Analysis
  const runAnalysis = useCallback(async (transaction) => {
    try {
      const payload = { ...transaction, mode: state.currentMode };
      const res = await api.analyseTransaction(payload);
      if (res && res.analysis) {
        dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: res.analysis });
        dispatch({ type: 'SET_CURRENT_TRANSACTION', payload: transaction });
        return res.analysis;
      }
    } catch (err) {
      console.error('Analysis error:', err);
    }
    return null;
  }, [state.currentMode]);

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

  // Delete transaction from SQLite
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
