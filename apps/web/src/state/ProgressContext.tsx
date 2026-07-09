import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Curriculum, Progress, WordStatus } from '@deutsch-lernen/shared';
import { emptyProgress, wordKey } from '@deutsch-lernen/shared';
import { fetchCurriculum } from '../api/curriculum.api.js';
import * as progressApi from '../api/progress.api.js';

interface ProgressContextValue {
  curriculum: Curriculum | null;
  progress: Progress;
  loading: boolean;
  saveIndicator: 'saved' | 'saving' | 'error';
  toggleDayDone: (dayNum: number) => void;
  setWordStatus: (day: number, idx: number, status: WordStatus) => void;
  submitQuizResult: (testDay: number, score: number, total: number) => Promise<void>;
  overwriteProgress: (next: Progress) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<Progress>(emptyProgress());
  const [loading, setLoading] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    Promise.all([fetchCurriculum(), progressApi.fetchProgress()]).then(([c, p]) => {
      setCurriculum(c);
      setProgress(p);
      setLoading(false);
    });
  }, []);

  const persist = useCallback((next: Progress) => {
    setSaveIndicator('saving');
    progressApi
      .saveProgress(next)
      .then(() => setSaveIndicator('saved'))
      .catch(() => setSaveIndicator('error'));
  }, []);

  const toggleDayDone = useCallback(
    (dayNum: number) => {
      setProgress((prev) => {
        const next: Progress = { ...prev, doneDays: { ...prev.doneDays } };
        if (next.doneDays[dayNum]) delete next.doneDays[dayNum];
        else next.doneDays[dayNum] = true;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setWordStatus = useCallback(
    (day: number, idx: number, status: WordStatus) => {
      setProgress((prev) => {
        const next: Progress = { ...prev, wordStatus: { ...prev.wordStatus, [wordKey(day, idx)]: status } };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const submitQuizResult = useCallback(async (testDay: number, score: number, total: number) => {
    setSaveIndicator('saving');
    try {
      const next = await progressApi.submitQuizResult(testDay, score, total);
      setProgress(next);
      setSaveIndicator('saved');
    } catch {
      setSaveIndicator('error');
    }
  }, []);

  const overwriteProgress = useCallback(
    (next: Progress) => {
      setProgress(next);
      persist(next);
    },
    [persist]
  );

  return (
    <ProgressContext.Provider
      value={{
        curriculum,
        progress,
        loading,
        saveIndicator,
        toggleDayDone,
        setWordStatus,
        submitQuizResult,
        overwriteProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
