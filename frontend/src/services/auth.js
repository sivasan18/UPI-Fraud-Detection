// ==============================================================================
// Smart UPI Fraud Detection System
// Supabase Authentication & 4 Administrator Account Mapping
// ==============================================================================
import { supabase, isSupabaseConfigured } from './supabase.js';

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
 * Resolves a username to its internal Supabase email address.
 * Case-insensitive lookup (e.g. 'user1' -> 'user1@achariyacollege.com').
 */
export function resolveUsernameToEmail(inputUsername) {
  if (!inputUsername) return null;
  const normalized = inputUsername.trim().toUpperCase();

  if (USER_DIRECTORY[normalized]) {
    return USER_DIRECTORY[normalized].email;
  }

  // Future-proof: if username is configured directly or if input is already an email
  if (inputUsername.includes('@')) {
    return inputUsername.trim().toLowerCase();
  }

  // Fallback for custom username extension in future
  return `${inputUsername.trim().toLowerCase()}@achariyacollege.com`;
}

/**
 * Resolves a Supabase email address back to the user's display username.
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
 */
export async function signInWithUsername(username, password) {
  const normalizedUsername = (username || '').trim().toUpperCase();
  const email = resolveUsernameToEmail(normalizedUsername);

  if (!email) {
    throw new Error('Invalid username. Please enter USER1, USER2, USER3, or USER4.');
  }

  if (!isSupabaseConfigured()) {
    // Development/Local mock when Supabase credentials are not yet supplied in .env
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
 * Signs out from Supabase Auth.
 */
export async function signOutUser() {
  localStorage.removeItem('upi-admin-local-session');
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  return { success: true };
}

/**
 * Retrieves the current session (persisted across page reloads).
 */
export async function getCurrentSession() {
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
 * Updates the current administrator's password.
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
