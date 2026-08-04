import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

/** 'system' follows the OS setting; the other two are explicit overrides. */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'deutsch-lernen:theme';

interface ThemeContextValue {
  choice: ThemeChoice;
  /** What is actually being displayed once 'system' is resolved. */
  resolved: ResolvedTheme;
  /** Flips to the opposite of whatever is currently showing. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredChoice);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Keep following the OS while the choice is still 'system'.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  // The stylesheet keys off data-theme; leaving the attribute off entirely lets
  // the prefers-color-scheme block in theme.css apply on its own.
  useEffect(() => {
    const root = document.documentElement;
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
  }, [choice]);

  const toggleTheme = useCallback(() => {
    setChoice(() => {
      const next: ThemeChoice = resolved === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [resolved]);

  return <ThemeContext.Provider value={{ choice, resolved, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
