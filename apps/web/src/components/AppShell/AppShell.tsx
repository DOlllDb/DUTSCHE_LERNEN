import { useState, useEffect } from 'react';
import { computeStats, totalWords } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { useAuth } from '../../state/AuthContext.js';
import { LangToggle } from '../LangToggle/LangToggle.js';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle.js';
import { StatsBar } from '../StatsBar/StatsBar.js';
import { Sidebar } from '../Sidebar/Sidebar.js';
import { DayView } from '../DayView/DayView.js';
import { PracticeQuiz } from '../Quiz/PracticeQuiz.js';
import styles from './AppShell.module.css';

/** The local part of an email -- "someone@example.com" -> "someone". */
function usernameOf(email: string): string {
  return email.split('@')[0];
}

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
          <div className={styles.headerControls}>
            <LangToggle />
            <ThemeToggle />
            {user && <span className={styles.username}>{usernameOf(user.email)}</span>}
            <button className="btn ghost" onClick={logout}>
              {t('logoutBtn')}
            </button>
          </div>
          <StatsBar />
        </div>
      </div>

      <div className={styles.layout}>
        <Sidebar
          selectedDay={selectedDay}
          onSelectDay={(d) => {
            setSelectedDay(d);
            setPracticeMode(false);
          }}
          practiceMode={practiceMode}
          onStartPractice={() => setPracticeMode(true)}
        />
        {practiceMode ? (
          <PracticeQuiz onExit={() => setPracticeMode(false)} />
        ) : (
          <DayView key={selectedDay} dayNum={selectedDay} />
        )}
      </div>

      <footer className={styles.footer}>{t('footer')}</footer>
    </div>
  );
}
