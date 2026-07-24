import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Auth + tenant context for the Captain panel.
 *
 * restaurant_id and role are custom JWT claims stamped by the Postgres
 * access-token hook (public.custom_access_token_hook). We decode them from the
 * access token for the UI; the database enforces scoping via RLS from the same
 * claims. If restaurantId is null on a logged-in user, the hook is disabled or
 * the user has no restaurant_members row.
 */

const AuthContext = createContext(null);

const DEFAULT_CTX = {
  session: null,
  user: null,
  restaurantId: null,
  role: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
};

/** Decode a JWT payload without verifying it (claims are for UI only). */
function decodeClaims(accessToken) {
  if (!accessToken) return {};
  try {
    const payload = accessToken.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) || {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore — the explicit storage wipe + reload below guarantee sign-out
    }
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('sb-') && k.includes('-auth-token'))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // storage unavailable — reload still re-runs getSession()
    }
    setSession(null);
    window.location.assign('/');
  }, []);

  const claims = decodeClaims(session?.access_token);

  const value = {
    session,
    user: session?.user ?? null,
    restaurantId: claims.restaurant_id ?? null,
    role: claims.user_role ?? null,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext) ?? DEFAULT_CTX;
}
