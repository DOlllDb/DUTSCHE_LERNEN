import { useRef } from 'react';
import { weekBlocks } from '@deutsch-lernen/shared';
import type { Progress } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './WeekMap.module.css';

interface Props {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export function WeekMap({ selectedDay, onSelectDay }: Props) {
  const { curriculum, progress, saveIndicator, overwriteProgress } = useProgress();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!curriculum) return null;

  const blocks = weekBlocks(curriculum);

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
    <div className={styles.weekmap}>
      {blocks.map((b) => (
        <div key={b.num} className={styles.weekBlock}>
          <div className={styles.weekTitle}>
            <span>
              {t('weekLabel')} {b.num}
            </span>
            <span>
              {b.days[0]}–{b.days[b.days.length - 1]}
            </span>
          </div>
          <div className={styles.dayGrid}>
            {b.days.map((dn) => {
              const isTest = dn === b.testDay;
              const isDone = !!progress.doneDays[dn];
              const isActive = dn === selectedDay;
              const cls = [
                styles.dayBtn,
                isTest && styles.test,
                isDone && styles.done,
                isActive && styles.active,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={dn}
                  className={cls}
                  title={`${t('dayTag', dn)}${isTest ? t('testTagSuffix') : ''}`}
                  onClick={() => onSelectDay(dn)}
                >
                  {isTest ? '★' : dn}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.legend}>
        <span>
          <span className={`${styles.dot} ${styles.green}`}></span>
          {t('legendDone')}
        </span>
        <span>
          <span className={`${styles.dot} ${styles.gold}`}></span>
          {t('legendTest')}
        </span>
      </div>

      <div className={styles.footerControls}>
        <div className={styles.saveIndicator}>{saveIndicatorText}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn ghost" style={{ flex: 1, fontSize: 11, padding: '7px 8px' }} onClick={exportProgress}>
            {t('exportBtn')}
          </button>
          <button
            className="btn ghost"
            style={{ flex: 1, fontSize: 11, padding: '7px 8px' }}
            onClick={() => fileInputRef.current?.click()}
          >
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
