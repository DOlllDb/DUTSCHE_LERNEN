import { useRef, useState } from 'react';
import type { Progress } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { WeekMap } from '../WeekMap/WeekMap.js';
import { TopicList } from '../TopicList/TopicList.js';
import styles from './Sidebar.module.css';

interface Props {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  practiceMode: boolean;
  onStartPractice: () => void;
}

type Tab = 'weeks' | 'topics';

/** The left navigation card: Weeks / Topics tabs over a shared footer holding
 * the practice test entry point and the progress export/import controls. */
export function Sidebar({ selectedDay, onSelectDay, practiceMode, onStartPractice }: Props) {
  const [tab, setTab] = useState<Tab>('weeks');
  const { progress, saveIndicator, overwriteProgress } = useProgress();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deutsch60_fortschritt.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importProgress(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Progress;
        if (data && data.doneDays && data.wordStatus && data.testScores) {
          overwriteProgress(data);
        } else {
          alert(t('importInvalid'));
        }
      } catch {
        alert(t('importFailed'));
      }
    };
    reader.readAsText(file);
  }

  const saveIndicatorText =
    saveIndicator === 'saving'
      ? t('savingIndicator')
      : saveIndicator === 'error'
        ? t('saveErrorIndicator')
        : t('savedIndicator');

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'weeks' ? styles.active : ''}`}
          onClick={() => setTab('weeks')}
        >
          {t('tabWeeks')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'topics' ? styles.active : ''}`}
          onClick={() => setTab('topics')}
        >
          {t('tabTopics')}
        </button>
      </div>

      {tab === 'weeks' ? (
        <WeekMap selectedDay={selectedDay} onSelectDay={onSelectDay} />
      ) : (
        <TopicList selectedDay={selectedDay} onSelectDay={onSelectDay} />
      )}

      <div className={styles.practiceRow}>
        <button
          className={`btn ${practiceMode ? 'primary' : 'ghost'} ${styles.practiceBtn}`}
          onClick={onStartPractice}
        >
          {t('practiceTestButton')}
        </button>
      </div>

      <div className={styles.footerControls}>
        <div className={styles.saveIndicator}>{saveIndicatorText}</div>
        <div className={styles.ioRow}>
          <button className={`btn ghost ${styles.ioBtn}`} onClick={exportProgress}>
            {t('exportBtn')}
          </button>
          <button className={`btn ghost ${styles.ioBtn}`} onClick={() => fileInputRef.current?.click()}>
            {t('importBtn')}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) importProgress(e.target.files[0]);
          }}
        />
      </div>
    </div>
  );
}
