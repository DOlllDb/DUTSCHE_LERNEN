import { useState, useEffect } from 'react';
import { computeStats, totalWords, getLearnedWords } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { useAuth } from '../../state/AuthContext.js';
import { LangToggle } from '../LangToggle/LangToggle.js';
import { StatsBar } from '../StatsBar/StatsBar.js';
import { WeekMap } from '../WeekMap/WeekMap.js';
import { DayView } from '../DayView/DayView.js';
import { PracticeQuiz } from '../Quiz/PracticeQuiz.js';
import styles from './AppShell.module.css';

export function AppShell() {
  const { curriculum, progress, loading } = useProgress();
  const { t } = useLang();
  const { user, logout } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);

  useEffect(() => {
    if (selectedDay !== null || !curriculum) return;
    let firstNotDone = curriculum.days[0].day;
    for (const d of curriculum.days) {
      if (!progress.doneDays[d.day]) {
        firstNotDone = d.day;
        break;
      }
      firstNotDone = d.day;
    }
    setSelectedDay(firstNotDone);
  }, [curriculum, progress, selectedDay]);

  if (loading || !curriculum || selectedDay === null) {
    return <div className={styles.app}>Loading…</div>;
  }

  const stats = computeStats(curriculum, progress);
  const pct = Math.round((stats.wordsLearned / totalWords(curriculum)) * 100);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <div>
          <div className={styles.brandEyebrow}>{t('brandEyebrow')}</div>
          <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: t('titleHtml') }} />
          <div className={styles.progressOuter}>
            <div className={styles.progressInner} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={styles.headerRight}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <LangToggle />
            <button className="btn ghost" onClick={() => setPracticeMode(true)}>
              {t('practiceTestButton')}
            </button>
            {user && (
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{user.email}</span>
            )}
            <button className="btn ghost" onClick={logout}>
              Logout
            </button>
          </div>
          <StatsBar />
        </div>
      </div>

      <div className={styles.layout}>
        <WeekMap
          selectedDay={selectedDay}
          onSelectDay={(d) => {
            setSelectedDay(d);
            setPracticeMode(false);
          }}
        />
        {practiceMode ? (
          <PracticeQuiz pool={getLearnedWords(curriculum, progress)} onExit={() => setPracticeMode(false)} />
        ) : (
          <DayView dayNum={selectedDay} />
        )}
      </div>

      <footer className={styles.footer}>{t('footer')}</footer>
    </div>
  );
}
