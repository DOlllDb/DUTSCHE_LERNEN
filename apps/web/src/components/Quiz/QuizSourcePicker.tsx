import type { QuizSource } from '@deutsch-lernen/shared';
import { useLang } from '../../state/LangContext.js';
import styles from './Quiz.module.css';

const SOURCES: { value: QuizSource; labelKey: 'sourceAll' | 'sourceLearning' }[] = [
  { value: 'all', labelKey: 'sourceAll' },
  { value: 'learning', labelKey: 'sourceLearning' },
];

interface Props {
  value: QuizSource;
  onChange: (source: QuizSource) => void;
  /** How many words in this test's own pool are actually flagged 'still
   * learning'. Drives the hint explaining that a short pool gets topped up. */
  learningCount: number;
}

/** Shared by the weekly test and the practice test, which offer the same
 * choice over different underlying pools. */
export function QuizSourcePicker({ value, onChange, learningCount }: Props) {
  const { t } = useLang();

  return (
    <>
      <div className={styles.pickerLabel}>{t('sourceLabel')}</div>
      <div className={styles.pickerRow}>
        {SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`${styles.pickerBtn} ${value === s.value ? styles.active : ''}`}
            onClick={() => onChange(s.value)}
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {value === 'learning' && (
        <div className={styles.pickerHint}>
          {learningCount === 0 ? t('sourceLearningNone') : t('sourceLearningHint', learningCount)}
        </div>
      )}
    </>
  );
}
