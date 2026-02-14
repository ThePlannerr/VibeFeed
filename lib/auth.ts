import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

import { APP_ENV } from '@/lib/env';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

export type AuthSnapshot = {
  enabled: boolean;
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  emailConfirmedAt: string | null;
};

export type AuthActionResult = {
  ok: boolean;
  message: string;
  requiresEmailVerification?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DELETE_ACCOUNT_CONFIRMATION = 'DELETE_MY_ACCOUNT';

let supabaseClient: SupabaseClient | null = null;

export const isAuthConfigured = () => APP_ENV.authEnabled;

export const validateEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false as const, message: 'Enter a valid email address.' };
  }
  return { ok: true as const, value: normalized };
};

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    return { ok: false as const, message: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return {
      ok: false as const,
      message: 'Password must include upper, lower, and a number.',
    };
  }
  return { ok: true as const };
};

export const getSupabaseClient = () => {
  if (!isAuthConfigured()) {
    throw new Error('Auth is not configured. Add Supabase public env vars.');
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(APP_ENV.supabaseUrl!, APP_ENV.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: AsyncStorage,
    },
  });

  return supabaseClient;
};

export const toAuthSnapshot = (session: Session | null): AuthSnapshot => {
  if (!session?.user) {
    return {
      enabled: isAuthConfigured(),
      status: 'signed_out',
      userId: null,
      email: null,
      emailConfirmedAt: null,
    };
  }

  return {
    enabled: isAuthConfigured(),
    status: 'signed_in',
    userId: session.user.id,
    email: session.user.email ?? null,
    emailConfirmedAt: session.user.email_confirmed_at ?? null,
  };
};

export const toAuthErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};
