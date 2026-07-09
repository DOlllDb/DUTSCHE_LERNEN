import { computeStats, totalWords } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './StatsBar.module.css';

export function StatsBar() {
  const { curriculum, progress } = useProgress();
  const { t } = useLang();

  if (!curriculum) return null;

  const stats = computeStats(curriculum, progress);
  const total = totalWords(curriculum);

  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <div className={styles.num}>{stats.doneDaysCount}/60</div>
        <div className={styles.lbl}>{t('lblDays')}</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.num}>
          {stats.wordsLearned}/{total}
        </div>
        <div className={styles.lbl}>{t('lblWords')}</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.num}>{stats.testsPassed}/{curriculum.test_days.length}</div>
        <div className={styles.lbl}>{t('lblTests')}</div>
      </div>
    </div>
  );
}
