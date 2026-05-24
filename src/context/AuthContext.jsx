// Auth context — provides user session state via Supabase Auth
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async (accessToken) => {
    if (!accessToken) {
      setProfile(null);
      return;
    }
    try {
      const response = await fetch('/api/profiles/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    }
  };

  const refetchProfile = async () => {
    const token = session?.access_token;
    if (token) {
      await fetchProfile(token);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        await fetchProfile(s.access_token);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.access_token) {
          await fetchProfile(s.access_token);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: data.error || 'Failed to register.' } };
      }

      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Failed to register.' } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: data.error || 'Failed to log in.' } };
      }

      if (data?.access_token && data?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Failed to log in.' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  // Helper to get JWT token for API calls
  const getToken = () => session?.access_token ?? null;

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, refetchProfile, signUp, signIn, signOut, updatePassword, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
