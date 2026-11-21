// ==============================================================================
// UPI Fraud Detection and Risk Assessment System
// Settings Page — Email Notification Settings, Four Admin Ownership Verification & System Control
// Strict Black (#000000) + Yellow (#facc15) + White (#ffffff) Theme
// ==============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon, Trash2, ShieldAlert, Lock, Database,
  CheckCircle, RefreshCw, AlertTriangle, XCircle, Shield, Info,
  Mail, Sliders, FileText, Bell, Send, Check, Copy, ExternalLink,
  ChevronRight, RefreshCcw, UserCheck, AlertCircle, KeyRound, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function Settings() {
  const {
    currentMode,
    demoModeEnabled,
    databaseBackend,
    adminUsername,
    clearModeData,
    removeDemoPermanently,
    enableDemoMode,
    updatePassword,
  } = useApp();

  // Active Tab: 'recipients' | 'thresholds' | 'templates' | 'logs' | 'general'
  const [activeTab, setActiveTab] = useState('recipients');

  // --------------------------------------------------------------------------
  // Tab 1: Four Admin Email Recipients Configuration (Stored in system_config)
  // --------------------------------------------------------------------------
  const [adminRecipients, setAdminRecipients] = useState({
    USER1: { username: 'USER1', name: 'Gopika', email: 'sivar75@gmail.com', uuid: '15c5209b-cc1a-4510-b6a3-69268fa692b6', verified: true, verified_at: '2026-11-21T21:10:00.000Z' },
    USER2: { username: 'USER2', name: 'Padmashri', email: 'sanvjf@gmail.com', uuid: 'cc9ea8a3-c449-4b15-ae9a-e9b866e87152', verified: false, verified_at: null },
    USER3: { username: 'USER3', name: 'Megala', email: 'ramanid97@gmail.com', uuid: '81ce3767-f86d-49c5-a5d8-6519399d01bc', verified: false, verified_at: null },
    USER4: { username: 'USER4', name: 'Subasri', email: 'kannadhasan815@gmail.com', uuid: '3dbbac56-66de-4b7c-baa9-b6f8f3ad4105', verified: false, verified_at: null },
  });
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsSaving, setRecipientsSaving] = useState(false);
  const [recipientsSuccessMsg, setRecipientsSuccessMsg] = useState('');
  const [recipientsErrorMsg, setRecipientsErrorMsg] = useState('');
  const [testingAdmin, setTestingAdmin] = useState(null); // 'USER1', 'USER2', 'USER3', 'USER4', 'ALL', or null
  const [testResults, setTestResults] = useState(null);

  // --------------------------------------------------------------------------
  // Email Ownership Verification (OTP Modal & State)
  // --------------------------------------------------------------------------
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTargetAdmin, setOtpTargetAdmin] = useState('USER1');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [otpExpiresSeconds, setOtpExpiresSeconds] = useState(300);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [devOtpHint, setDevOtpHint] = useState('');

  // --------------------------------------------------------------------------
  // Tab 2: General & Password States
  // --------------------------------------------------------------------------
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearTargetMode, setClearTargetMode] = useState('ACTIVE');
  const [clearSuccessMsg, setClearSuccessMsg] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const [showRemoveDemo, setShowRemoveDemo] = useState(false);
  const [removePassword, setRemovePassword] = useState('');
  const [removeError, setRemoveError] = useState('');
  const [removeSuccess, setRemoveSuccess] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const [showEnableDemo, setShowEnableDemo] = useState(false);
  const [enablePassword, setEnablePassword] = useState('');
  const [enableError, setEnableError] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --------------------------------------------------------------------------
  // Tab 3: Risk Thresholds Configuration States
  // --------------------------------------------------------------------------
  const [thresholds, setThresholds] = useState({
    low_min: 0,
    low_max: 24,
    warning_min: 25,
    warning_max: 51,
    high_min: 52,
    high_max: 74,
    critical_min: 75,
    critical_max: 100,
  });
  const [thresholdsSaving, setThresholdsSaving] = useState(false);
  const [thresholdsSuccess, setThresholdsSuccess] = useState('');
  const [thresholdsError, setThresholdsError] = useState('');

  // --------------------------------------------------------------------------
  // Tab 4: Email Templates & Live Preview States
  // --------------------------------------------------------------------------
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateLevel, setSelectedTemplateLevel] = useState('HIGH');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    heading: '',
    description: '',
    body: '',
    footer_text: '',
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [copiedVar, setCopiedVar] = useState('');

  // --------------------------------------------------------------------------
  // Tab 5: Email Delivery Logs States
  // --------------------------------------------------------------------------
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // --------------------------------------------------------------------------
  // Initial Data Fetching
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1. Load 4 Admin Email Recipients from system_config
    setRecipientsLoading(true);
    api.getAdminEmailRecipients()
      .then((recips) => {
        if (recips) setAdminRecipients(recips);
      })
      .finally(() => setRecipientsLoading(false));

    // 2. Load Risk Thresholds
    api.getRiskThresholds().then((t) => {
      if (t) setThresholds(t);
    });

    // 3. Load Email Templates
    api.getEmailTemplates().then((tmpls) => {
      if (tmpls && tmpls.length > 0) {
        setTemplates(tmpls);
        const initial = tmpls.find((t) => t.alert_level === 'HIGH') || tmpls[0];
        if (initial) {
          setTemplateForm({
            name: initial.name || '',
            subject: initial.subject || '',
            heading: initial.heading || '',
            description: initial.description || '',
            body: initial.body || '',
            footer_text: initial.footer_text || '',
          });
        }
      }
    });

    // 4. Load Delivery Logs
    loadLogs();
  }, []);

  // Timer effect for OTP countdown & resend cooldown
  useEffect(() => {
    if (!otpModalOpen) return;
    const interval = setInterval(() => {
      setOtpExpiresSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpModalOpen]);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await api.getEmailDeliveryLogs(50);
      setDeliveryLogs(logs || []);
    } catch (err) {
      console.warn('Failed to load logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Four Admin Email Recipients
  // --------------------------------------------------------------------------
  const handleRecipientEmailChange = (adminKey, newEmail) => {
    setRecipientsErrorMsg('');
    setRecipientsSuccessMsg('');
    setAdminRecipients((prev) => ({
      ...prev,
      [adminKey]: {
        ...prev[adminKey],
        email: newEmail,
      },
    }));
  };

  const handleSaveAllRecipients = async (e) => {
    e.preventDefault();
    setRecipientsErrorMsg('');
    setRecipientsSuccessMsg('');
    setRecipientsSaving(true);

    try {
      const res = await api.updateAdminEmailRecipients(adminRecipients);
      if (res.success) {
        setAdminRecipients(res.recipients);
        setRecipientsSuccessMsg('All four administrator recipient email addresses saved successfully in Supabase system_config. Note: Any changed email addresses have had their verification status reset to Unverified.');
        setTimeout(() => setRecipientsSuccessMsg(''), 6000);
      }
    } catch (err) {
      setRecipientsErrorMsg(err?.message || 'Failed to save recipient addresses.');
    } finally {
      setRecipientsSaving(false);
    }
  };

  const handleSendTestEmail = async (targetAdmin) => {
    setTestingAdmin(targetAdmin);
    setTestResults(null);
    try {
      const res = await api.sendTestEmailToAdmin(targetAdmin);
      setTestResults(res);
      await loadLogs();
    } catch (err) {
      setTestResults({
        success: false,
        error: err?.message || 'Test email dispatch failed.',
      });
    } finally {
      setTestingAdmin(null);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Email Ownership Verification (OTP)
  // --------------------------------------------------------------------------
  const handleInitiateVerification = async (targetAdmin) => {
    // Client-side UX check: verify caller account binding
    if (adminUsername && adminUsername !== targetAdmin) {
      setRecipientsErrorMsg(`Account Binding: You are logged in as ${adminUsername}. You can only verify ownership of your own recipient address (${adminRecipients[adminUsername]?.email}). Other administrators must log in to verify their respective addresses.`);
      setTimeout(() => setRecipientsErrorMsg(''), 6000);
      return;
    }

    setOtpTargetAdmin(targetAdmin);
    setOtpCode('');
    setOtpError('');
    setOtpSuccess('');
    setOtpSending(true);
    setDevOtpHint('');
    setAttemptsRemaining(5);

    try {
      const res = await api.sendVerificationOtp(targetAdmin);
      setOtpModalOpen(true);
      setOtpExpiresSeconds(res.expires_in_seconds || 300);
      setOtpCooldownSeconds(res.resend_cooldown_seconds || 60);
      setOtpNotice(res.delivery_notice || '');
      if (res.dev_hint) {
        setDevOtpHint(res.dev_hint);
      }
    } catch (err) {
      setRecipientsErrorMsg(err?.message || 'Failed to send verification code.');
      setTimeout(() => setRecipientsErrorMsg(''), 6000);
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCooldownSeconds > 0) return;
    setOtpError('');
    setOtpSending(true);
    setDevOtpHint('');
    try {
      const res = await api.sendVerificationOtp(otpTargetAdmin);
      setOtpExpiresSeconds(res.expires_in_seconds || 300);
      setOtpCooldownSeconds(res.resend_cooldown_seconds || 60);
      setOtpNotice(res.delivery_notice || '');
      if (res.dev_hint) {
        setDevOtpHint(res.dev_hint);
      }
    } catch (err) {
      setOtpError(err?.message || 'Failed to resend code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await api.verifyOwnershipOtp(otpTargetAdmin, otpCode.trim());
      if (res.verified) {
        setOtpSuccess(res.message || 'Email ownership successfully verified!');
        // Update local state badge immediately
        setAdminRecipients((prev) => ({
          ...prev,
          [otpTargetAdmin]: {
            ...prev[otpTargetAdmin],
            verified: true,
            verified_at: res.verified_at || new Date().toISOString(),
          },
        }));

        setTimeout(() => {
          setOtpModalOpen(false);
          setRecipientsSuccessMsg(`Email ownership verified for ${adminRecipients[otpTargetAdmin]?.name} (${adminRecipients[otpTargetAdmin]?.email})!`);
          setTimeout(() => setRecipientsSuccessMsg(''), 5000);
        }, 1800);
      }
    } catch (err) {
      setOtpError(err?.message || 'Verification failed on server.');
      if (err?.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.attempts_remaining);
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Risk Thresholds
  // --------------------------------------------------------------------------
  const thresholdValidation = useMemo(() => {
    return api.validateThresholds(thresholds);
  }, [thresholds]);

  const handleLowMaxChange = (val) => {
    const lMax = parseInt(val, 10);
    if (isNaN(lMax)) return;
    setThresholds((prev) => ({
      ...prev,
      low_max: lMax,
      warning_min: lMax + 1,
    }));
  };

  const handleWarningMaxChange = (val) => {
    const wMax = parseInt(val, 10);
    if (isNaN(wMax)) return;
    setThresholds((prev) => ({
      ...prev,
      warning_max: wMax,
      high_min: wMax + 1,
    }));
  };

  const handleHighMaxChange = (val) => {
    const hMax = parseInt(val, 10);
    if (isNaN(hMax)) return;
    setThresholds((prev) => ({
      ...prev,
      high_max: hMax,
      critical_min: hMax + 1,
    }));
  };

  const handleResetThresholds = () => {
    setThresholds({ ...api.DEFAULT_THRESHOLDS });
    setThresholdsSuccess('Reset to standard default thresholds (0-24, 25-51, 52-74, 75-100).');
    setTimeout(() => setThresholdsSuccess(''), 3000);
  };

  const handleSaveThresholds = async () => {
    setThresholdsError('');
    setThresholdsSuccess('');
    if (!thresholdValidation.isValid) {
      setThresholdsError(thresholdValidation.error);
      return;
    }
    setThresholdsSaving(true);
    try {
      await api.updateRiskThresholds(thresholds);
      setThresholdsSuccess('Risk notification thresholds saved and enforced successfully.');
      setTimeout(() => setThresholdsSuccess(''), 4000);
    } catch (err) {
      setThresholdsError(err?.message || 'Failed to save risk thresholds.');
    } finally {
      setThresholdsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Email Templates & Live Preview
  // --------------------------------------------------------------------------
  const handleSelectTemplate = (lvl) => {
    setSelectedTemplateLevel(lvl);
    const target = templates.find((t) => t.alert_level === lvl);
    if (target) {
      setTemplateForm({
        name: target.name || '',
        subject: target.subject || '',
        heading: target.heading || '',
        description: target.description || '',
        body: target.body || '',
        footer_text: target.footer_text || '',
      });
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setTemplateSuccess('');
    setTemplateSaving(true);
    try {
      const target = templates.find((t) => t.alert_level === selectedTemplateLevel);
      const res = await api.updateEmailTemplate(target?.id || `tmpl_${selectedTemplateLevel.toLowerCase()}`, {
        ...templateForm,
        alert_level: selectedTemplateLevel,
      });
      if (res.success) {
        setTemplates(res.templates);
        setTemplateSuccess(`Saved ${selectedTemplateLevel} Risk Email Template.`);
        setTimeout(() => setTemplateSuccess(''), 4000);
      }
    } catch (err) {
      console.warn('Template save error:', err);
    } finally {
      setTemplateSaving(false);
    }
  };

  const copyPlaceholder = (placeholder) => {
    navigator.clipboard?.writeText(placeholder);
    setCopiedVar(placeholder);
    setTimeout(() => setCopiedVar(''), 2000);
  };

  const sampleEmailPreviewData = {
    user_name: adminRecipients[adminUsername]?.name || 'Gopika',
    transaction_id: 'TXN-98421074',
    transaction_amount: selectedTemplateLevel === 'CRITICAL' ? 45000 : 7500,
    upi_provider: 'Paytm UPI',
    transaction_date: 'Today, 03:25 PM',
    risk_score: selectedTemplateLevel === 'CRITICAL' ? 88 : 64,
    risk_level: selectedTemplateLevel,
    detectedPatterns: [
      'Pattern P4 — Extreme Spending Deviation (>3x User Mean)',
      'Pattern P5 — High-Value First-Time Beneficiary Transfer',
    ],
    analysisSummary: 'Severe deviation from historical spending profile detected by 13-pattern Explainable AI engine.',
  };

  const previewHtml = useMemo(() => {
    return api.generateEmailHtmlPreview(templateForm, sampleEmailPreviewData);
  }, [templateForm, sampleEmailPreviewData]);

  // --------------------------------------------------------------------------
  // Handlers: Logs & Retry
  // --------------------------------------------------------------------------
  const handleRetryEmail = async (id) => {
    setRetryingId(id);
    try {
      await api.retryEmailNotification(id);
      await loadLogs();
    } catch (err) {
      alert('Retry error: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: General & Password
  // --------------------------------------------------------------------------
  const handleOpenClear = (mode) => {
    setClearTargetMode(mode);
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const success = await clearModeData(clearTargetMode);
    setIsClearing(false);
    setShowClearConfirm(false);
    if (success) {
      setClearSuccessMsg(`Cleared ${clearTargetMode} mode transaction data.`);
      setTimeout(() => setClearSuccessMsg(''), 4000);
    }
  };

  const handleRemoveDemo = async (e) => {
    e.preventDefault();
    setRemoveError('');
    setIsRemoving(true);

    const result = await removeDemoPermanently(removePassword);
    setIsRemoving(false);

    if (result.success) {
      setShowRemoveDemo(false);
      setRemovePassword('');
      setRemoveSuccess('Demo Mode removed. The application is now running in Active Mode only.');
    } else {
      setRemoveError(result.message || 'Incorrect password.');
    }
  };

  const handleEnableDemo = async (e) => {
    e.preventDefault();
    setEnableError('');
    setIsEnabling(true);

    const result = await enableDemoMode(enablePassword);
    setIsEnabling(false);

    if (result.success) {
      setShowEnableDemo(false);
      setEnablePassword('');
      setRemoveSuccess('');
    } else {
      setEnableError(result.message || 'Incorrect password.');
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error?.message || error?.response?.data?.detail || 'Could not change the password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 50 }}>
      {/* Page Header */}
      <div className="page-header mb-6">
        <h1>Settings & Configuration</h1>
        <p>Manage administrator recipient emails, risk thresholds, Resend templates, and system controls.</p>
      </div>

      {/* Modern Black + Yellow Tab Navigation */}
      <div
        className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
        style={{ borderBottom: '1px solid var(--yellow-border)' }}
      >
        <button
          className={`btn btn-sm ${activeTab === 'recipients' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('recipients')}
        >
          <Mail size={15} />
          <span>Email Notification Settings</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'thresholds' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('thresholds')}
        >
          <Sliders size={15} />
          <span>Risk Notification Thresholds</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={15} />
          <span>Email Templates & Live Preview</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('logs')}
        >
          <Bell size={15} />
          <span>Email Delivery Logs</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('general')}
        >
          <Lock size={15} />
          <span>General & Security</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: EMAIL NOTIFICATION SETTINGS (FOUR ADMIN RECIPIENTS)          */}
      {/* ==================================================================== */}
      {activeTab === 'recipients' && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Mail size={18} color="var(--yellow-light)" />
                Email Notification Settings — Four Administrator Recipients & Verification
              </div>
              <span className="badge badge-low">
                Storage: public.system_config
              </span>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-4">
              Configure receiver email addresses and verify ownership for the four administrator accounts.
              When a transaction reaches <strong>High Risk (52–74)</strong> or <strong>Critical Risk (75–100)</strong>,
              an alert is sent via Resend strictly to the respective administrator's verified receiver address.
              Login credentials, usernames, and authentication mappings are strictly preserved.
            </p>

            {recipientsSuccessMsg && (
              <div className="notice-box info mb-4">
                <CheckCircle size={16} color="var(--risk-low)" />
                <div className="text-xs text-secondary font-semibold">{recipientsSuccessMsg}</div>
              </div>
            )}

            {recipientsErrorMsg && (
              <div className="notice-box security mb-4">
                <XCircle size={16} color="#facc15" />
                <div className="text-xs text-danger font-semibold">{recipientsErrorMsg}</div>
              </div>
            )}

            {/* Form for 4 Administrator Recipient Addresses */}
            <form onSubmit={handleSaveAllRecipients}>
              <div className="grid grid-2 gap-4 mb-5">
                {/* Render Each Admin Account */}
                {['USER1', 'USER2', 'USER3', 'USER4'].map((adminKey, idx) => {
                  const recip = adminRecipients[adminKey] || {};
                  const isCurrentAdmin = adminUsername === adminKey;
                  const isVerified = Boolean(recip.verified);

                  return (
                    <div
                      key={adminKey}
                      className="p-4 rounded"
                      style={{
                        background: 'var(--bg-card-subtle)',
                        border: isVerified ? '1px solid var(--yellow-border)' : '1px dashed rgba(250, 204, 21, 0.3)',
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} color="var(--yellow-light)" />
                          <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                            Admin {idx + 1}: {recip.name || adminKey}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isVerified ? (
                            <span className="badge badge-low flex items-center gap-1" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              <CheckCircle size={11} color="var(--risk-low)" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="badge badge-medium flex items-center gap-1" style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(250, 204, 21, 0.12)', color: '#facc15' }}>
                              <AlertTriangle size={11} color="#facc15" />
                              UNVERIFIED
                            </span>
                          )}
                          <span className="badge badge-low text-xs">{adminKey}</span>
                        </div>
                      </div>

                      <div className="text-xs text-tertiary mb-3 flex justify-between items-center">
                        <span>Auth: <code>user{idx + 1}@achariyacollege.com</code></span>
                        {isVerified && recip.verified_at && (
                          <span className="text-xs" style={{ color: 'var(--risk-low)', fontSize: '0.68rem' }}>
                            Verified: {new Date(recip.verified_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="form-group mb-3">
                        <label className="form-label" htmlFor={`email-${adminKey}`}>
                          Receiver Email Address *
                        </label>
                        <input
                          id={`email-${adminKey}`}
                          type="email"
                          className="form-input"
                          placeholder={`${adminKey.toLowerCase()}@yourdomain.com`}
                          required
                          value={recip.email || ''}
                          onChange={(e) => handleRecipientEmailChange(adminKey, e.target.value)}
                        />
                        <span className="text-xs text-tertiary mt-1 block">
                          Changing this address resets its verification status to Unverified upon saving.
                        </span>
                      </div>

                      <div className="flex justify-between items-center flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          {isVerified ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.72rem', color: 'var(--yellow-light)', padding: 0 }}
                              disabled={!isCurrentAdmin || otpSending}
                              onClick={() => handleInitiateVerification(adminKey)}
                              title={!isCurrentAdmin ? `Log in as ${adminKey} to re-verify` : 'Re-verify email ownership'}
                            >
                              <ShieldCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
                              Re-verify Code
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                              disabled={!isCurrentAdmin || otpSending}
                              onClick={() => handleInitiateVerification(adminKey)}
                              title={!isCurrentAdmin ? `Log in as ${adminKey} to verify this email` : 'Send verification code'}
                            >
                              <KeyRound size={12} />
                              {isCurrentAdmin ? 'Send Verification Code' : `Verify (Log in as ${adminKey})`}
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          disabled={testingAdmin !== null}
                          onClick={() => handleSendTestEmail(adminKey)}
                        >
                          {testingAdmin === adminKey ? 'Sending...' : 'Test Send'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center flex-wrap gap-3 p-3 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--yellow-border)' }}>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Shield size={15} color="var(--yellow-light)" />
                  <span>RLS Enforced &bull; Parameterized DB Upsert &bull; Cryptographic Backend OTP</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={testingAdmin !== null}
                    onClick={() => handleSendTestEmail('ALL')}
                  >
                    {testingAdmin === 'ALL' ? 'Testing All 4...' : 'Test All 4 Recipients'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={recipientsSaving}
                  >
                    {recipientsSaving ? 'Saving Recipients...' : 'Save All Receiver Emails'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Test Results Display Card */}
          {testResults && (
            <div className="card mb-6 animate-fade-in" style={{ borderColor: 'var(--yellow-border)' }}>
              <div className="card-header">
                <div className="card-title flex items-center gap-2">
                  <Send size={18} color="var(--yellow-light)" />
                  Resend Test Transmission Results
                </div>
                <span className="badge badge-low">
                  Sender: onboarding@resend.dev
                </span>
              </div>

              {testResults.error ? (
                <div className="notice-box security mb-2">
                  <XCircle size={16} color="#facc15" />
                  <div className="text-xs text-danger font-semibold">{testResults.error}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.results?.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded flex items-center justify-between flex-wrap gap-2"
                      style={{
                        background: res.status === 'accepted' ? 'rgba(250, 204, 21, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${res.status === 'accepted' ? 'var(--yellow-border)' : 'rgba(255, 255, 255, 0.1)'}`,
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: '#ffffff' }}>
                            {res.name} ({res.admin})
                          </span>
                          <span className="text-xs text-tertiary">&bull; {res.email}</span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: res.status === 'accepted' ? 'var(--risk-low)' : '#a1a1a1' }}>
                          {res.status === 'accepted'
                            ? `Accepted & Delivered by Resend (Message ID: ${res.resend_id})`
                            : res.reason || 'Not delivered'}
                        </div>
                      </div>

                      <span
                        className={`badge ${res.status === 'accepted' ? 'badge-low' : 'badge-critical'}`}
                        style={{ textTransform: 'uppercase' }}
                      >
                        {res.status}
                      </span>
                    </div>
                  ))}

                  <div className="notice-box info mt-3" style={{ padding: '0.65rem 0.85rem' }}>
                    <Info size={15} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div className="text-xs text-secondary leading-relaxed">
                      <strong>Resend Sandbox Delivery Note:</strong> Resend's free trial domain (<code>onboarding@resend.dev</code>) delivers to the registered account owner (<code>sivar75@gmail.com</code>). To dispatch live external emails to all 4 domains in production, verify your custom domain in the Resend dashboard at <code>resend.com/domains</code>.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* EMAIL OWNERSHIP VERIFICATION OTP MODAL                               */}
      {/* ==================================================================== */}
      {otpModalOpen && (
        <div className="modal-overlay" onClick={() => setOtpModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={22} color="#facc15" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#facc15' }}>Verify Email Ownership</h3>
                <span className="text-xs text-tertiary">
                  Account: {adminRecipients[otpTargetAdmin]?.name} ({otpTargetAdmin}) &bull; {adminRecipients[otpTargetAdmin]?.email}
                </span>
              </div>
            </div>

            <p className="text-xs text-secondary mb-4 leading-relaxed">
              Enter the six-digit verification code generated by the backend to verify that you own this recipient email address.
            </p>

            {otpSuccess && (
              <div className="notice-box info mb-4">
                <CheckCircle size={16} color="var(--risk-low)" />
                <div className="text-xs text-secondary font-semibold">{otpSuccess}</div>
              </div>
            )}

            {otpError && (
              <div className="notice-box security mb-4">
                <AlertCircle size={16} color="#facc15" />
                <div className="text-xs text-danger font-semibold">{otpError}</div>
              </div>
            )}

            {otpNotice && (
              <div className="p-3 mb-4 rounded text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(250,204,21,0.2)' }}>
                <span className="text-secondary">{otpNotice}</span>
              </div>
            )}

            {devOtpHint && (
              <div className="p-3 mb-4 rounded text-xs" style={{ background: 'rgba(250, 204, 21, 0.08)', border: '1px solid var(--yellow-border)' }}>
                <div className="text-xs font-semibold text-yellow-light mb-1">
                  🧪 Sandbox Testing Notice:
                </div>
                <div className="text-secondary">
                  Due to Resend sandbox restrictions on unverified domains, this code was generated on the backend:
                  <strong className="font-mono text-sm block mt-1" style={{ color: '#facc15', letterSpacing: 3 }}>
                    {devOtpHint}
                  </strong>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="form-group mb-4">
                <label className="form-label text-center block" htmlFor="otp-input-field">
                  Six-Digit Verification Code
                </label>
                <input
                  id="otp-input-field"
                  type="text"
                  maxLength={6}
                  autoFocus
                  className="form-input text-center font-mono font-bold"
                  placeholder="000000"
                  style={{
                    fontSize: '24px',
                    letterSpacing: '8px',
                    padding: '12px',
                    maxWidth: 240,
                    margin: '0 auto',
                    display: 'block',
                  }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-tertiary mb-5">
                <span>
                  Code expires in: <strong style={{ color: otpExpiresSeconds < 60 ? '#facc15' : '#ffffff' }}>{formatTimer(otpExpiresSeconds)}</strong>
                </span>
                <span>
                  Remaining attempts: <strong>{attemptsRemaining} of 5</strong>
                </span>
              </div>

              <div className="flex justify-between items-center flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: otpCooldownSeconds > 0 ? '#666666' : 'var(--yellow-light)' }}
                  disabled={otpCooldownSeconds > 0 || otpSending}
                  onClick={handleResendOtp}
                >
                  {otpCooldownSeconds > 0 ? `Resend code in ${otpCooldownSeconds}s` : 'Resend Code'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setOtpModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={otpVerifying || otpCode.length !== 6 || otpExpiresSeconds <= 0}
                  >
                    {otpVerifying ? 'Verifying...' : 'Verify Email Ownership'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: RISK NOTIFICATION THRESHOLDS                                  */}
      {/* ==================================================================== */}
      {activeTab === 'thresholds' && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Sliders size={18} color="var(--yellow-light)" />
                Continuous Risk Score Notification Rules (0 – 100)
              </div>
              <span className={`badge ${thresholdValidation.isValid ? 'badge-low' : 'badge-critical'}`}>
                {thresholdValidation.isValid ? '● ZERO GAP / OVERLAP ENFORCED' : '⚠ INVALID BOUNDARIES'}
              </span>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-4">
              Configure the exact score thresholds governing in-app notifications and Resend emails.
              Boundary constraints ensure continuous coverage from 0 to 100 with zero gaps and zero overlaps.
            </p>

            {thresholdsSuccess && (
              <div className="notice-box info mb-4">
                <CheckCircle size={16} color="var(--risk-low)" />
                <div className="text-xs text-secondary font-semibold">{thresholdsSuccess}</div>
              </div>
            )}

            {thresholdsError && (
              <div className="notice-box security mb-4">
                <XCircle size={16} color="#facc15" />
                <div className="text-xs text-danger font-semibold">{thresholdsError}</div>
              </div>
            )}

            <div className="grid grid-2 gap-4 mb-6">
              {/* Tier 1: Low Risk */}
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--yellow-light)' }}>1. LOW RISK TIER</span>
                  <span className="badge badge-low">{thresholds.low_min} – {thresholds.low_max}</span>
                </div>
                <p className="text-xs text-tertiary mb-3">
                  Normal baseline. Triggers in-app confirmation & browser toast. <strong>No email sent.</strong>
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-secondary">Range Upper Limit:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    style={{ width: 80, padding: '4px 8px' }}
                    value={thresholds.low_max}
                    onChange={(e) => handleLowMaxChange(e.target.value)}
                  />
                  <span className="text-xs text-tertiary">(Starts at 0)</span>
                </div>
              </div>

              {/* Tier 2: Warning */}
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--yellow-light)' }}>2. WARNING TIER</span>
                  <span className="badge badge-medium">{thresholds.warning_min} – {thresholds.warning_max}</span>
                </div>
                <p className="text-xs text-tertiary mb-3">
                  Moderate anomaly. Triggers website warning popup & browser notification. <strong>No email sent.</strong>
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-secondary">Range Upper Limit:</label>
                  <input
                    type="number"
                    min={thresholds.warning_min}
                    max="74"
                    className="form-input"
                    style={{ width: 80, padding: '4px 8px' }}
                    value={thresholds.warning_max}
                    onChange={(e) => handleWarningMaxChange(e.target.value)}
                  />
                  <span className="text-xs text-tertiary">(Starts at {thresholds.warning_min})</span>
                </div>
              </div>

              {/* Tier 3: High Risk */}
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm" style={{ color: '#facc15' }}>3. HIGH RISK TIER</span>
                  <span className="badge badge-high">{thresholds.high_min} – {thresholds.high_max}</span>
                </div>
                <p className="text-xs text-tertiary mb-3">
                  Suspicious behavior. Triggers website banner + <strong>Resend Security Email Alert</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-secondary">Range Upper Limit:</label>
                  <input
                    type="number"
                    min={thresholds.high_min}
                    max="99"
                    className="form-input"
                    style={{ width: 80, padding: '4px 8px' }}
                    value={thresholds.high_max}
                    onChange={(e) => handleHighMaxChange(e.target.value)}
                  />
                  <span className="text-xs text-tertiary">(Starts at {thresholds.high_min})</span>
                </div>
              </div>

              {/* Tier 4: Critical Risk */}
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm" style={{ color: '#facc15' }}>4. CRITICAL RISK TIER</span>
                  <span className="badge badge-critical">{thresholds.critical_min} – 100</span>
                </div>
                <p className="text-xs text-tertiary mb-3">
                  Severe fraud risk. Triggers critical danger modal + <strong>Priority Resend Email Alert</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary">Fixed Range:</span>
                  <span className="font-mono text-sm text-primary font-bold">
                    {thresholds.critical_min} to 100 (Ends at 100)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetThresholds}
              >
                Reset to Standard Defaults (0-24, 25-51, 52-74, 75-100)
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={thresholdsSaving || !thresholdValidation.isValid}
                onClick={handleSaveThresholds}
              >
                {thresholdsSaving ? 'Saving Thresholds...' : 'Save & Enforce Thresholds'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: EMAIL TEMPLATES & LIVE HTML PREVIEW                           */}
      {/* ==================================================================== */}
      {activeTab === 'templates' && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <FileText size={18} color="var(--yellow-light)" />
                Resend Email Template Editor & Live Responsive Preview
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${selectedTemplateLevel === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectTemplate('HIGH')}
                >
                  High Risk Template (52–74)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedTemplateLevel === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectTemplate('CRITICAL')}
                >
                  Critical Risk Template (75–100)
                </button>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-4">
              Edit the HTML email template dispatched to administrators.
              Click any variable chip below to copy its dynamic placeholder into your subject, heading, or body.
            </p>

            <div className="mb-4 p-3 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--yellow-border)' }}>
              <div className="text-xs text-tertiary mb-2 font-semibold">
                CLICK TO COPY DYNAMIC PLACEHOLDERS:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  '{{user_name}}',
                  '{{transaction_id}}',
                  '{{transaction_amount}}',
                  '{{upi_provider}}',
                  '{{transaction_date}}',
                  '{{risk_score}}',
                  '{{risk_level}}',
                  '{{detected_patterns}}',
                  '{{analysis_summary}}',
                ].map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => copyPlaceholder(ph)}
                  >
                    {copiedVar === ph ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                    <code>{ph}</code>
                  </button>
                ))}
              </div>
            </div>

            {templateSuccess && (
              <div className="notice-box info mb-4">
                <CheckCircle size={16} color="var(--risk-low)" />
                <div className="text-xs text-secondary font-semibold">{templateSuccess}</div>
              </div>
            )}

            <div className="grid grid-2 gap-6">
              <form onSubmit={handleSaveTemplate}>
                <div className="form-group mb-3">
                  <label className="form-label">Template Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Email Subject Line</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Email Main Heading</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={templateForm.heading}
                    onChange={(e) => setTemplateForm({ ...templateForm, heading: e.target.value })}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Description / Subtitle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Main Security Body Guidance</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Footer Disclaimer Text</label>
                  <input
                    type="text"
                    className="form-input"
                    value={templateForm.footer_text}
                    onChange={(e) => setTemplateForm({ ...templateForm, footer_text: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={templateSaving}>
                  {templateSaving ? 'Saving Template...' : `Save ${selectedTemplateLevel} Risk Template`}
                </button>
              </form>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-tertiary">
                    LIVE PREVIEW (BLACK + YELLOW THEME)
                  </span>
                  <span className="badge badge-low text-xs">
                    Score: {sampleEmailPreviewData.risk_score} / 100
                  </span>
                </div>

                <div
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid var(--yellow-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    maxHeight: 520,
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: EMAIL DELIVERY LOGS & RESEND MONITORING                       */}
      {/* ==================================================================== */}
      {activeTab === 'logs' && (
        <div className="animate-fade-in">
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Bell size={18} color="var(--yellow-light)" />
                Resend Email Alert Delivery Logs & Status Tracking
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadLogs}
                disabled={logsLoading}
              >
                <RefreshCcw size={14} className={logsLoading ? 'animate-spin' : ''} />
                Refresh Logs
              </button>
            </div>

            <p className="text-xs text-secondary leading-relaxed mb-4">
              Audit trail of suspicious fraud alert emails dispatched via Resend.
              Logs track recipient verification, alert level, delivery state, and Resend message IDs.
            </p>

            {deliveryLogs.length === 0 ? (
              <div className="p-8 text-center" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10 }}>
                <Mail size={32} color="#facc15" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
                <h4 className="text-sm font-semibold mb-1">No Email Alerts Dispatched Yet</h4>
                <p className="text-xs text-tertiary">
                  When a transaction exceeds the suspicious threshold (score &ge; 52), an individual email is automatically sent and logged here.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Transaction ID</th>
                      <th>Recipient</th>
                      <th>Risk Level</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Resend Message ID</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-tertiary">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}
                        </td>
                        <td className="font-mono font-semibold" style={{ color: '#ffffff' }}>
                          {log.transaction_id}
                        </td>
                        <td className="text-secondary">{log.recipient_email}</td>
                        <td>
                          <span className={`badge ${log.alert_level === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                            {log.alert_level}
                          </span>
                        </td>
                        <td className="font-mono font-bold" style={{ color: 'var(--yellow-light)' }}>
                          {log.risk_score}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              log.status === 'sent'
                                ? 'badge-low'
                                : log.status === 'failed'
                                ? 'badge-critical'
                                : 'badge-medium'
                            }`}
                          >
                            {log.status?.toUpperCase() || 'SENT'}
                          </span>
                        </td>
                        <td className="font-mono text-tertiary" style={{ fontSize: '0.72rem' }}>
                          {log.resend_message_id ? log.resend_message_id.slice(0, 16) + '...' : '—'}
                        </td>
                        <td>
                          {log.status === 'failed' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                              disabled={retryingId === log.id}
                              onClick={() => handleRetryEmail(log.id)}
                            >
                              {retryingId === log.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: GENERAL & SECURITY (Existing Password & Demo Controls)        */}
      {/* ==================================================================== */}
      {activeTab === 'general' && (
        <div className="animate-fade-in">
          {/* Change Administrator Password */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Lock size={18} color="var(--yellow-light)" />
                Change Administrator Password
              </div>
            </div>
            {passwordError && <p className="text-danger text-sm mb-3" role="alert">{passwordError}</p>}
            {passwordSuccess && <p className="text-success text-sm mb-3" style={{ color: 'var(--risk-low)' }}>{passwordSuccess}</p>}
            <form onSubmit={handleChangePassword}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="current-admin-password">Current password</label>
                  <input
                    id="current-admin-password"
                    className="form-input"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-admin-password">New password</label>
                  <input
                    id="new-admin-password"
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-admin-password">Confirm new password</label>
                  <input
                    id="confirm-admin-password"
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing password…' : 'Change password'}
              </button>
            </form>
          </div>

          {clearSuccessMsg && (
            <div className="notice-box info mb-5">
              <CheckCircle size={18} color="var(--risk-low)" />
              <div>{clearSuccessMsg}</div>
            </div>
          )}

          {removeSuccess && (
            <div className="notice-box info mb-5" style={{ borderColor: 'rgba(250, 204, 21, 0.4)', background: 'rgba(250, 204, 21, 0.06)' }}>
              <CheckCircle size={18} color="var(--risk-low)" />
              <div className="text-sm text-secondary">{removeSuccess}</div>
            </div>
          )}

          {/* Mode Management */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Lock size={18} color="var(--yellow-light)" />
                Application Mode Control
              </div>
              <span className={`badge ${currentMode === 'ACTIVE' ? 'badge-low' : 'badge-demo'}`}>
                Current: ● {currentMode} MODE
              </span>
            </div>

            {demoModeEnabled ? (
              <>
                <p className="text-xs text-secondary mb-4 leading-relaxed">
                  The application uses <strong>{databaseBackend}</strong> for Active Mode. Demo Mode remains separate and requires administrator verification.
                </p>

                <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                        {currentMode === 'ACTIVE' ? '● ACTIVE MODE (Real Supabase Storage)' : '● DEMO MODE (Synthetic Data Sandbox)'}
                      </div>
                      <div className="text-xs text-tertiary mt-1">
                        {currentMode === 'ACTIVE'
                          ? 'Administrator mode for genuine transaction verification. To switch modes, sign out and select Demo Mode at login.'
                          : 'Presentation sandbox with pre-configured synthetic transactions. To switch modes, sign out and sign in as an Administrator.'}
                      </div>
                    </div>
                  </div>
                </div>

                {currentMode === 'DEMO' && (
                  <div className="notice-box info mt-4" style={{ padding: '0.6rem 0.85rem' }}>
                    <AlertTriangle size={15} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div className="text-xs text-secondary">
                      <strong>DEMO MODE — SYNTHETIC DATA.</strong> This data is for project demonstration only. Active Mode data is not affected.
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid rgba(250, 204, 21, 0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} color="#facc15" />
                  <div className="font-semibold text-sm" style={{ color: '#facc15' }}>Demo Mode: Permanently Removed</div>
                </div>
                <p className="text-xs text-secondary leading-relaxed mb-3">
                  Application is running in Active Mode only. All synthetic demo data and demo-only options have been permanently removed.
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setShowEnableDemo(true); setEnableError(''); setEnablePassword(''); }}
                  style={{ color: 'var(--yellow-light)', padding: 0 }}
                >
                  Re-enable Demo Mode for testing...
                </button>
              </div>
            )}
          </div>

          {/* Database Data Management */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <Database size={18} color="var(--yellow-light)" />
                {databaseBackend} Data Management
              </div>
            </div>

            <div className={demoModeEnabled ? 'grid grid-2' : ''}>
              {/* Clear Active Data */}
              <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 size={16} color="#facc15" />
                  <h4 className="text-sm font-semibold">Clear Active Data</h4>
                </div>
                <p className="text-xs text-secondary mb-4">
                  Permanently clears Active Mode transaction records.
                </p>
                <button className="btn btn-danger btn-sm" onClick={() => handleOpenClear('ACTIVE')}>
                  Clear Active Data
                </button>
              </div>

              {/* Clear Demo Data */}
              {demoModeEnabled && (
                <div className="p-4" style={{ background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--yellow-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw size={16} color="var(--yellow-light)" />
                    <h4 className="text-sm font-semibold">Clear Demo Data</h4>
                  </div>
                  <p className="text-xs text-secondary mb-4">
                    Clears synthetic demo records without affecting Active Mode data.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenClear('DEMO')}>
                    Clear Demo Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Permanent Demo Removal */}
          {demoModeEnabled && (
            <div className="card mb-6" style={{ borderColor: 'rgba(250, 204, 21, 0.3)' }}>
              <div className="card-header">
                <div className="card-title flex items-center gap-2" style={{ color: '#facc15' }}>
                  <AlertTriangle size={18} />
                  Permanent Demo Mode Removal
                </div>
                <span className="badge" style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', fontSize: '0.65rem' }}>
                  ⚠ Irreversible
                </span>
              </div>

              <p className="text-xs text-secondary mb-4 leading-relaxed">
                After the professor approves the project, you can permanently remove Demo Mode from this installation.
                This will delete all synthetic demo data, disable demo features, and retain all Active Mode user data.
              </p>

              <button
                className="btn btn-danger"
                onClick={() => { setShowRemoveDemo(true); setRemoveError(''); setRemovePassword(''); }}
              >
                <AlertTriangle size={14} /> Remove Demo Mode Permanently
              </button>
            </div>
          )}

          {/* Academic Disclaimer */}
          <div className="notice-box info">
            <Info size={16} color="var(--yellow-light)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-tertiary leading-relaxed">
              <strong>Academic Project Disclaimer:</strong> This project is an academic prototype for UPI transaction risk assessment.
              It does not access bank accounts, initiate payments, or guarantee that a transaction is safe or fraudulent.
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-danger">
              <ShieldAlert size={26} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Confirm Data Deletion</h3>
            </div>

            <p className="text-xs text-secondary mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong>{clearTargetMode} MODE</strong> transaction data from {databaseBackend}? This cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isClearing}
                onClick={handleConfirmClear}
              >
                {isClearing ? 'Clearing Data...' : `Clear ${clearTargetMode} Data`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Demo Mode Removal Modal */}
      {showRemoveDemo && (
        <div className="modal-overlay" onClick={() => setShowRemoveDemo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#facc15" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#facc15' }}>Are you sure you want to permanently remove Demo Mode?</h3>
              </div>
            </div>

            <div className="notice-box security mb-4" style={{ padding: '0.65rem 0.85rem' }}>
              <AlertTriangle size={15} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="text-xs text-secondary leading-relaxed">
                <strong>Warning:</strong> This permanently removes Demo Mode, its synthetic data, and demo-only functionality from this application. This action cannot be undone.
              </div>
            </div>

            <p className="text-xs text-tertiary mb-4 leading-relaxed">
              Active Mode data (transactions, alerts, reports, behaviour profiles, uploaded screenshots, and statements) will <strong>NOT</strong> be deleted or modified.
            </p>

            {removeError && (
              <div className="notice-box security mb-4" style={{ padding: '0.6rem 0.85rem' }}>
                <XCircle size={15} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs text-danger font-semibold">{removeError}</div>
              </div>
            )}

            <form onSubmit={handleRemoveDemo}>
              <div className="form-group">
                <label className="form-label">Administrator Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Configured administrator password"
                  required
                  autoFocus
                  value={removePassword}
                  onChange={(e) => { setRemovePassword(e.target.value); setRemoveError(''); }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRemoveDemo(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isRemoving || !removePassword}>
                  {isRemoving ? 'Removing...' : 'Remove Demo Mode Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-enable Demo Modal */}
      {showEnableDemo && (
        <div className="modal-overlay" onClick={() => setShowEnableDemo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="var(--yellow-light)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Re-enable Demo Mode for Testing</h3>
              </div>
            </div>

            {enableError && (
              <div className="notice-box security mb-4" style={{ padding: '0.6rem 0.85rem' }}>
                <XCircle size={15} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs text-danger font-semibold">{enableError}</div>
              </div>
            )}

            <form onSubmit={handleEnableDemo}>
              <div className="form-group">
                <label className="form-label">Administrator Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Configured administrator password"
                  required
                  autoFocus
                  value={enablePassword}
                  onChange={(e) => { setEnablePassword(e.target.value); setEnableError(''); }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnableDemo(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isEnabling || !enablePassword}>
                  {isEnabling ? 'Enabling...' : 'Enable Demo Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
