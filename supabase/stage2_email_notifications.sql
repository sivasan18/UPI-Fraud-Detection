-- ==============================================================================
-- UPI Fraud Detection and Risk Assessment System
-- Stage 2: Resend Email Integration, Notification Profiles & Risk Thresholds
-- ==============================================================================

BEGIN;

-- 1. Administrator Profiles & Notification Email Mapping
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    notification_email TEXT,
    email_verified BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Editable Email Templates (High Risk & Critical Risk)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY, -- 'high_risk' or 'critical_risk'
    subject TEXT NOT NULL,
    heading TEXT NOT NULL,
    description TEXT NOT NULL,
    body TEXT NOT NULL,
    sender_name TEXT NOT NULL DEFAULT 'UPI Fraud Shield',
    sender_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
    footer_text TEXT NOT NULL DEFAULT 'This is an automated security alert from the UPI Fraud Detection and Risk Assessment System.',
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT
);

-- Default Templates Insertion
INSERT INTO public.email_templates (id, subject, heading, description, body, sender_name, sender_email, footer_text)
VALUES
(
    'high_risk',
    'SECURITY WARNING: High-Risk UPI Transaction Detected ({{transaction_id}})',
    'High Risk Transaction Alert',
    'A transaction initiated under your account has been flagged with an elevated risk score of {{risk_score}}/100.',
    'A recent payment of ₹{{transaction_amount}} via {{upi_provider}} on {{transaction_date}} triggered multiple suspicious behavioral patterns.\n\nDetected Patterns:\n{{detected_patterns}}\n\nAnalysis Summary:\n{{analysis_summary}}\n\nIf you did not authorize this payment or if the recipient is unfamiliar, please verify the recipient through an independent channel before taking further action.',
    'UPI Fraud Shield',
    'onboarding@resend.dev',
    'This is an automated security alert from the UPI Fraud Detection and Risk Assessment System. Do not share your UPI PIN or OTP with anyone.'
),
(
    'critical_risk',
    'CRITICAL ALERT: Potential UPI Fraud Detected ({{transaction_id}})',
    'Critical Risk Transaction Warning',
    'URGENT: A transaction with critical fraud probability (Score: {{risk_score}}/100) was detected on your account.',
    'CRITICAL RISK: A payment of ₹{{transaction_amount}} via {{upi_provider}} on {{transaction_date}} exhibited severe anomalies.\n\nTriggered Patterns:\n{{detected_patterns}}\n\nSummary:\n{{analysis_summary}}\n\nRECOMMENDED ACTIONS:\n1. Do NOT approve any pending mandates or share your UPI PIN.\n2. Contact your bank immediately to freeze unauthorized debits.\n3. Verify the transaction in your UPI app history.',
    'UPI Fraud Shield',
    'onboarding@resend.dev',
    'This is an automated security alert from the UPI Fraud Detection and Risk Assessment System. Immediate action may be required.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Risk Threshold Configuration (Default: 0-24 Low, 25-51 Warning, 52-74 High, 75-100 Critical)
CREATE TABLE IF NOT EXISTS public.risk_threshold_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    low_min INTEGER NOT NULL DEFAULT 0,
    low_max INTEGER NOT NULL DEFAULT 24,
    warning_min INTEGER NOT NULL DEFAULT 25,
    warning_max INTEGER NOT NULL DEFAULT 51,
    high_min INTEGER NOT NULL DEFAULT 52,
    high_max INTEGER NOT NULL DEFAULT 74,
    critical_min INTEGER NOT NULL DEFAULT 75,
    critical_max INTEGER NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT
);

INSERT INTO public.risk_threshold_config (id, low_min, low_max, warning_min, warning_max, high_min, high_max, critical_min, critical_max)
VALUES ('default', 0, 24, 25, 51, 52, 74, 75, 100)
ON CONFLICT (id) DO NOTHING;

-- 4. Email Notification Delivery Tracking (Idempotent & Auditable)
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    user_id UUID REFERENCES auth.users(id),
    recipient_email TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    resend_id TEXT,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_txn_risk_alert UNIQUE(transaction_id, risk_level)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_created
    ON public.email_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status
    ON public.email_notifications (status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_txn
    ON public.email_notifications (transaction_id);

-- 5. Administrative Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_threshold_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE public.admin_profiles TO authenticated;
GRANT ALL ON TABLE public.email_templates TO authenticated;
GRANT ALL ON TABLE public.risk_threshold_config TO authenticated;
GRANT ALL ON TABLE public.email_notifications TO authenticated;
GRANT ALL ON TABLE public.admin_audit_logs TO authenticated;

-- Policies
-- Admin Profiles: Users can view and edit their own profile
DROP POLICY IF EXISTS "Admins manage own profile" ON public.admin_profiles;
CREATE POLICY "Admins manage own profile" ON public.admin_profiles
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Email Templates: Authenticated admins can view and update templates
DROP POLICY IF EXISTS "Admins shared email templates" ON public.email_templates;
CREATE POLICY "Admins shared email templates" ON public.email_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Risk Thresholds: Authenticated admins can view and update thresholds
DROP POLICY IF EXISTS "Admins shared risk thresholds" ON public.risk_threshold_config;
CREATE POLICY "Admins shared risk thresholds" ON public.risk_threshold_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Email Notifications: Users can view their own transaction notification history
DROP POLICY IF EXISTS "Admins view own email notifications" ON public.email_notifications;
CREATE POLICY "Admins view own email notifications" ON public.email_notifications
    FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Audit Logs: Viewable by authenticated admins
DROP POLICY IF EXISTS "Admins shared audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins shared audit logs" ON public.admin_audit_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
