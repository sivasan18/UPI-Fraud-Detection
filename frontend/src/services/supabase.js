// ==============================================================================
// Smart UPI Fraud Detection System
// Supabase Client Initialization & Configuration Service
//
// WHAT IS SUPABASE IN THIS PROJECT?
// ------------------------------------------------------------------------------
// Supabase is our cloud backend service that provides two essential capabilities:
// 1. PostgreSQL Database: Stores transactions, alerts, and validated training samples.
// 2. Supabase Auth: Manages secure administrator sessions, JWT tokens, and password checks.
//
// HOW ENVIRONMENT VARIABLES WORK IN VITE:
// ------------------------------------------------------------------------------
// - In React + Vite applications, environment variables MUST begin with `VITE_`.
// - Vite reads variables from `frontend/.env` at build/development time.
// - `import.meta.env.VITE_SUPABASE_URL`: Your Supabase project REST endpoint.
// - `import.meta.env.VITE_SUPABASE_ANON_KEY`: Safe public/anonymous API key
//   enforcing Row Level Security (RLS) on PostgreSQL tables.
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

// Read environment variables across browser (Vite) and Node.js environments
const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};

// 1. Supabase Project URL (configured in frontend/.env)
const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_DB_URL ||
  'https://eojjgcmdxkavnqzkjkjr.supabase.co';

// 2. Supabase Anonymous / Publishable Key (configured in frontend/.env)
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

/**
 * Checks whether Supabase credentials have been properly provided in `.env`.
 * Returns `true` if connected to live cloud Supabase, or `false` to enable local fallback.
 */
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20);
};

// 3. Supabase Client Instance
// Configured with session auto-refresh and browser storage persistence
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key-configure-vite-supabase-anon-key',
  {
    auth: {
      persistSession: true,       // Keeps administrator signed in across browser tab refreshes
      autoRefreshToken: true,     // Automatically refreshes expired JWT tokens
      detectSessionInUrl: true,   // Detects password reset / email confirmation redirects
      storageKey: 'upi-fraud-admin-auth', // Unique key used in localStorage
    },
  }
);

export default supabase;
