import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { AuthResponse } from '@deutsch-lernen/shared';
import * as authApi from '../api/auth.api.js';
import { setAccessToken, setSessionExpiredHandler } from '../api/client.js';

interface User {
  id: number;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<void>;
  /** Registration no longer logs the user in -- they must confirm their email first. */
  register: (email: string, password: string) => Promise<void>;
  /** Used by the verify-email page: it already has an AuthResponse from the
   * verify call, it just needs to apply it to session state. */
  applySession: (res: AuthResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const applySession = useCallback((res: AuthResponse) => {
    setAccessToken(res.accessToken);
    setUser(res.user);
    setStatus('authenticated');
  }, []);

  // Refresh-token rotation is one-shot: presenting the same token twice makes the
  // second call fail. React 18 StrictMode intentionally double-invokes effects in
  // dev, which would otherwise fire this exact call twice and let whichever one
  // settles last stomp the other's result. Guard with a ref so it only ever runs
  // once per real page load.
  const didAttemptRefresh = useRef(false);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    if (didAttemptRefresh.current) return;
    didAttemptRefresh.current = true;

    authApi.refresh().then(applySession).catch(() => setStatus('anonymous'));
  }, [clearSession, applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      applySession(res);
    },
    [applySession]
  );

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register({ email, password });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, applySession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
