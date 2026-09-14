// ==============================================================================
// Smart UPI Fraud Detection System
// Frontend API Client (Connecting to FastAPI localhost:8000)
// ==============================================================================
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const api = {
  // System & Auth
  healthCheck: async () => {
    try {
      const res = await client.get('/health');
      return res.data;
    } catch (e) {
      return { status: 'offline', database: 'Disconnected', demoModeEnabled: true };
    }
  },

  verifyModePassword: async (password) => {
    const res = await client.post('/auth/verify-mode-password', { password });
    return res.data;
  },

  removeDemoPermanently: async (password) => {
    const res = await client.post('/settings/remove-demo-permanently', { password });
    return res.data;
  },

  enableDemo: async (password) => {
    const res = await client.post('/settings/enable-demo', { password });
    return res.data;
  },

  // Dashboard stats
  getDashboardStats: async (mode = 'ACTIVE') => {
    const res = await client.get(`/dashboard/stats?mode=${mode}`);
    return res.data;
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const { mode = 'ACTIVE', search, risk_level, recipient, limit = 200, offset = 0 } = params;
    const q = new URLSearchParams({ mode, limit, offset });
    if (search) q.append('search', search);
    if (risk_level) q.append('risk_level', risk_level);
    if (recipient) q.append('recipient', recipient);

    const res = await client.get(`/transactions?${q.toString()}`);
    return res.data;
  },

  confirmTransaction: async (txn) => {
    const res = await client.post('/transactions/confirm', txn);
    return res.data;
  },

  getTransaction: async (txnId) => {
    const res = await client.get(`/transactions/${txnId}`);
    return res.data;
  },

  deleteTransaction: async (txnId) => {
    const res = await client.delete(`/transactions/${txnId}`);
    return res.data;
  },

  batchConfirmTransactions: async (txns, mode = 'ACTIVE') => {
    const res = await client.post(`/transactions/batch-confirm?mode=${mode}`, txns);
    return res.data;
  },

  uploadFile: async (formData) => {
    const res = await client.post('/transactions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  analyseTransaction: async (txnData) => {
    const res = await client.post('/transactions/analyse', txnData);
    return res.data;
  },

  // Profile
  getProfile: async (mode = 'ACTIVE') => {
    const res = await client.get(`/profile?mode=${mode}`);
    return res.data;
  },

  // Alerts
  getAlerts: async (mode = 'ACTIVE', status = null) => {
    const q = new URLSearchParams({ mode });
    if (status) q.append('status', status);
    const res = await client.get(`/alerts?${q.toString()}`);
    return res.data;
  },

  reviewAlert: async (alertId) => {
    const res = await client.post(`/alerts/${alertId}/review`);
    return res.data;
  },

  // Adaptive learning
  getValidatedSamples: async (mode = 'ACTIVE') => {
    const res = await client.get(`/adaptive/samples?mode=${mode}`);
    return res.data;
  },

  addValidatedSample: async (txnId, label, mode = 'ACTIVE', notes = '') => {
    const res = await client.post('/adaptive/samples', {
      transaction_id: txnId,
      label,
      mode,
      notes,
    });
    return res.data;
  },

  retrainModel: async (mode = 'ACTIVE') => {
    const res = await client.post(`/adaptive/retrain?mode=${mode}`);
    return res.data;
  },

  getTrainingHistory: async (mode = 'ACTIVE') => {
    const res = await client.get(`/adaptive/history?mode=${mode}`);
    return res.data;
  },

  // Model monitoring
  getMonitoringMetrics: async (mode = 'ACTIVE') => {
    const res = await client.get(`/monitoring/metrics?mode=${mode}`);
    return res.data;
  },

  // Settings & Clearing
  clearData: async (mode) => {
    const res = await client.post('/settings/clear-data', { mode });
    return res.data;
  },

  // Demo seeder
  seedDemoData: async () => {
    const res = await client.post('/demo/seed');
    return res.data;
  },
};

export default api;
