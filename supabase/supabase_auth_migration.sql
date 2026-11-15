-- ==============================================================================
-- UPI Fraud Detection and Risk Assessment System
-- Supabase Migration: Clean Flask Tables & Enable Supabase Auth Shared Access
-- Run this in your Supabase Dashboard SQL Editor
-- ==============================================================================

BEGIN;

-- 1. Safely drop obsolete Flask authentication & session tables
-- (Transactions, fraud analyses, alerts, and validated samples are NOT touched)
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.auth_login_attempts CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;

-- 2. Ensure application tables exist and have RLS enabled
ALTER TABLE IF EXISTS public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fraud_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.validated_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_runs ENABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to authenticated Supabase users
GRANT ALL ON TABLE public.system_config TO authenticated;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.fraud_analyses TO authenticated;
GRANT ALL ON TABLE public.alerts TO authenticated;
GRANT ALL ON TABLE public.validated_samples TO authenticated;
GRANT ALL ON TABLE public.training_runs TO authenticated;

-- 4. Set up shared RLS policies for the four administrators
-- All authenticated administrators share the same project data
DROP POLICY IF EXISTS "Admins shared transactions access" ON public.transactions;
CREATE POLICY "Admins shared transactions access" ON public.transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins shared fraud_analyses access" ON public.fraud_analyses;
CREATE POLICY "Admins shared fraud_analyses access" ON public.fraud_analyses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins shared alerts access" ON public.alerts;
CREATE POLICY "Admins shared alerts access" ON public.alerts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins shared validated_samples access" ON public.validated_samples;
CREATE POLICY "Admins shared validated_samples access" ON public.validated_samples
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins shared training_runs access" ON public.training_runs;
CREATE POLICY "Admins shared training_runs access" ON public.training_runs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins shared system_config access" ON public.system_config;
CREATE POLICY "Admins shared system_config access" ON public.system_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
