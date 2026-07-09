import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Day, Word } from '@deutsch-lernen/shared';
import { T, type TKey, type UiLang } from './translations.js';

const STORAGE_KEY = 'deutsch-lernen:uiLang';

interface LangContextValue {
  uiLang: UiLang;
  toggleLang: () => void;
  t: (key: TKey, ...args: any[]) => string;
  dayTitle: (day: Day) => string;
  catLabel: (word: Word) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function readInitialLang(): UiLang {
  if (typeof window === 'undefined') return 'de';
  return (window.localStorage.getItem(STORAGE_KEY) as UiLang | null) ?? 'de';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLang] = useState<UiLang>(readInitialLang);

  const toggleLang = useCallback(() => {
    setUiLang((prev) => {
      const next = prev === 'de' ? 'en' : 'de';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TKey, ...args: any[]) => {
      const entry = T[key][uiLang];
      return typeof entry === 'function' ? (entry as (...a: any[]) => string)(...args) : entry;
    },
    [uiLang]
  );

  const dayTitle = useCallback((day: Day) => (uiLang === 'en' ? day.title_en : day.title), [uiLang]);
  const catLabel = useCallback((word: Word) => (uiLang === 'en' ? word.cat_en : word.cat), [uiLang]);

  return (
    <LangContext.Provider value={{ uiLang, toggleLang, t, dayTitle, catLabel }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
