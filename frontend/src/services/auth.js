// ==============================================================================
// Smart UPI Fraud Detection System
// Supabase Authentication & 4 Administrator Account Mapping Service
//
// WHAT THIS SERVICE DOES:
// ------------------------------------------------------------------------------
// 1. Manages secure sign-in, session persistence, and sign-out for 4 Administrators.
// 2. Maps simple usernames ('USER1', 'USER2', etc.) to internal Supabase Auth emails.
// 3. Provides graceful offline fallback when Supabase keys are not set in `.env`.
//
// WHY USERNAME-TO-EMAIL MAPPING EXISTS:
// - Supabase Auth natively authenticates using email + password.
// - To keep the user interface beginner-friendly and realistic for an ID card,
//   the frontend lets admins log in using 'USER1', 'USER2', etc.
// - This service silently maps `USER1` -> `user1@achariyacollege.com` before calling Supabase.
// ==============================================================================
import { supabase, isSupabaseConfigured } from './supabase.js';

// ------------------------------------------------------------------------------
// Internal Administrator Directory
// Maps each username to its registered Supabase Auth email.
// (Note: UI display names like 'Gopika' live in `src/data/adminProfiles.js`!)
// ------------------------------------------------------------------------------
export const USER_DIRECTORY = {
  USER1: {
    username: 'USER1',
    email: 'user1@achariyacollege.com',
    role: 'Administrator',
    displayName: 'USER1',
  },
  USER2: {
    username: 'USER2',
    email: 'user2@achariyacollege.com',
    role: 'Administrator',
    displayName: 'USER2',
  },
  USER3: {
    username: 'USER3',
    email: 'user3@achariyacollege.com',
    role: 'Administrator',
    displayName: 'USER3',
  },
  USER4: {
    username: 'USER4',
    email: 'user4@achariyacollege.com',
    role: 'Administrator',
    displayName: 'USER4',
  },
};

/**
 * Resolves a friendly username into its internal Supabase email address.
 * E.g., 'USER1' (or 'user1') becomes 'user1@achariyacollege.com'.
 */
export function resolveUsernameToEmail(inputUsername) {
  if (!inputUsername) return null;
  const normalized = inputUsername.trim().toUpperCase();

  if (USER_DIRECTORY[normalized]) {
    return USER_DIRECTORY[normalized].email;
  }

  // Future-proof: if input is already an email address, keep it
  if (inputUsername.includes('@')) {
    return inputUsername.trim().toLowerCase();
  }

  // Fallback for custom username extensions
  return `${inputUsername.trim().toLowerCase()}@achariyacollege.com`;
}

/**
 * Reverse lookup: Resolves a Supabase Auth email back to its username.
 * E.g., 'user1@achariyacollege.com' becomes 'USER1'.
 */
export function resolveEmailToUsername(email) {
  if (!email) return 'Admin';
  const lower = email.trim().toLowerCase();
  for (const info of Object.values(USER_DIRECTORY)) {
    if (info.email.toLowerCase() === lower) {
      return info.username;
    }
  }
  return email.split('@')[0].toUpperCase();
}

/**
 * Signs in using username + password through Supabase Auth.
 * Includes local offline fallback if Supabase credentials are not connected.
 */
export async function signInWithUsername(username, password) {
  const normalizedUsername = (username || '').trim().toUpperCase();
  const email = resolveUsernameToEmail(normalizedUsername);

  if (!email) {
    throw new Error('Invalid username. Please enter USER1, USER2, USER3, or USER4.');
  }

  // Offline / development fallback mode
  if (!isSupabaseConfigured()) {
    const validUsers = ['USER1', 'USER2', 'USER3', 'USER4'];
    if (validUsers.includes(normalizedUsername) && password === 'admin123') {
      const mockSession = {
        user: { id: `mock-${normalizedUsername}`, email },
        username: normalizedUsername,
        role: 'Administrator',
      };
      localStorage.setItem('upi-admin-local-session', JSON.stringify(mockSession));
      return { success: true, session: mockSession, username: normalizedUsername };
    }
    throw new Error('Invalid username or password (default: admin123).');
  }

  // Live Supabase Authentication call
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Authentication failed. Check your password.');
  }

  const resolvedUsername = resolveEmailToUsername(data.user?.email) || normalizedUsername;
  return {
    success: true,
    user: data.user,
    session: data.session,
    username: resolvedUsername,
  };
}

/**
 * Signs out from Supabase Auth and removes local session tokens.
 */
export async function signOutUser() {
  localStorage.removeItem('upi-admin-local-session');
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[Supabase signOut Notice]:', error.message);
      // Still proceed with local signout so the user is never stuck
    }
  }
  return { success: true };
}

/**
 * Subscribes to Supabase authentication state changes (login, logout, token refresh).
 */
export function subscribeToAuthChanges(callback) {
  if (isSupabaseConfigured()) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data?.subscription || { unsubscribe: () => {} };
  }
  return { unsubscribe: () => {} };
}

/**
 * Retrieves the current session (persisted in localStorage / Supabase across browser reloads).
 */
export async function getCurrentSession() {
  // Check offline local session
  if (!isSupabaseConfigured()) {
    const saved = localStorage.getItem('upi-admin-local-session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        return {
          authenticated: true,
          user: session.user,
          username: session.username,
          role: session.role || 'Administrator',
        };
      } catch {
        localStorage.removeItem('upi-admin-local-session');
      }
    }
    return { authenticated: false, user: null, username: null };
  }

  // Retrieve live Supabase session
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) {
    return { authenticated: false, user: null, username: null };
  }

  const username = resolveEmailToUsername(data.session.user.email);
  return {
    authenticated: true,
    user: data.session.user,
    username,
    role: 'Administrator',
  };
}

/**
 * Updates the current administrator's password in Supabase Auth.
 */
export async function updateAdminPassword(newPassword) {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Password updated locally.' };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message || 'Failed to update password.');
  return { success: true, user: data.user };
}
