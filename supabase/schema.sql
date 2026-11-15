-- ==============================================================================
-- UPI Fraud Detection and Risk Assessment System
-- Supabase PostgreSQL Schema (Four Administrators Shared Access)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    amount DOUBLE PRECISION NOT NULL,
    date TEXT,
    date_iso TEXT,
    time TEXT,
    hour INTEGER,
    minute INTEGER,
    sender TEXT,
    sender_upi TEXT,
    receiver TEXT,
    receiver_upi TEXT,
    status TEXT,
    merchant TEXT,
    category TEXT,
    location TEXT,
    device TEXT,
    source_type TEXT,
    validated INTEGER NOT NULL DEFAULT 1,
    risk_score INTEGER,
    risk_level TEXT,
    risk_type TEXT,
    risk_factors TEXT,
    recommendation TEXT,
    remarks TEXT,
    payment_mode TEXT,
    bank TEXT,
    autopay_mandate TEXT,
    expected_recurring_amount DOUBLE PRECISION,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fraud_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    risk_type TEXT NOT NULL,
    detected_patterns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    pattern_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    detected_patterns_details JSONB NOT NULL DEFAULT '[]'::JSONB,
    not_detected_patterns JSONB NOT NULL DEFAULT '[]'::JSONB,
    all_patterns_checked JSONB NOT NULL DEFAULT '[]'::JSONB,
    factors JSONB NOT NULL DEFAULT '[]'::JSONB,
    profile_status TEXT,
    why JSONB NOT NULL DEFAULT '[]'::JSONB,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    severity TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_type TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.validated_samples (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    feedback_notes TEXT,
    validated_by TEXT DEFAULT 'Administrator',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.training_runs (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'ACTIVE',
    model_name TEXT NOT NULL,
    samples_count INTEGER NOT NULL,
    precision DOUBLE PRECISION,
    recall DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    roc_auc DOUBLE PRECISION,
    status TEXT DEFAULT 'completed',
    trained_at TEXT NOT NULL
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_mode_external_id
    ON public.transactions (mode, transaction_id)
    WHERE transaction_id <> '';
CREATE INDEX IF NOT EXISTS idx_transactions_mode_created
    ON public.transactions (mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_mode_risk
    ON public.transactions (mode, risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_mode_created
    ON public.alerts (mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_transaction_created
    ON public.fraud_analyses (transaction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_pattern_ids
    ON public.fraud_analyses USING GIN (pattern_ids);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validated_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_runs ENABLE ROW LEVEL SECURITY;

-- Grants for authenticated users
GRANT ALL ON TABLE public.system_config TO authenticated;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.fraud_analyses TO authenticated;
GRANT ALL ON TABLE public.alerts TO authenticated;
GRANT ALL ON TABLE public.validated_samples TO authenticated;
GRANT ALL ON TABLE public.training_runs TO authenticated;

-- Policies for shared administrator access
CREATE POLICY "Admins shared transactions access" ON public.transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins shared fraud_analyses access" ON public.fraud_analyses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins shared alerts access" ON public.alerts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins shared validated_samples access" ON public.validated_samples
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins shared training_runs access" ON public.training_runs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins shared system_config access" ON public.system_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
