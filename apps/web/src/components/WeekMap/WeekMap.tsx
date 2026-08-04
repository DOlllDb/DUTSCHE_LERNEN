import { weekBlocks } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './WeekMap.module.css';

interface Props {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

/** The day grid for the sidebar's "Weeks" tab. The surrounding card, the
 * tabs, and the export/import controls live in Sidebar. */
export function WeekMap({ selectedDay, onSelectDay }: Props) {
  const { curriculum, progress } = useProgress();
  const { t } = useLang();

  if (!curriculum) return null;

  return (
    <>
      {weekBlocks(curriculum).map((b) => (
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
    </>
  );
}
