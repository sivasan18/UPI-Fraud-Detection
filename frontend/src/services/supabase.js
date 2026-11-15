// ==============================================================================
// Smart UPI Fraud Detection System
// Supabase Client Initialization
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_DB_URL ||
  'https://eojjgcmdxkavnqzkjkjr.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20);
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key-configure-vite-supabase-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'upi-fraud-admin-auth',
    },
  }
);

export default supabase;
