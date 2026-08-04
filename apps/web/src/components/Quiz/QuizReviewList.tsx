import { wordKey } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import type { QuizAnswer } from './useQuizSession.js';
import styles from './Quiz.module.css';

export function QuizReviewList({ answers }: { answers: QuizAnswer[] }) {
  const { progress, setWordStatus } = useProgress();
  const { t } = useLang();

  return (
    <div className={styles.reviewList}>
      {answers.map((a, i) => {
        const known = progress.wordStatus[wordKey(a.day, a.idx)] === 'known';
        const label = known ? t('markedKnown') : t('markKnown');

        return (
          <div key={i} className={`${styles.reviewItem} ${a.correct ? '' : styles.miss}`}>
            <span className={styles.reviewDe}>{a.prompt}</span>
            <span className={styles.reviewAnswer}>
              {a.correct
                ? t('reviewCorrect') + a.correctAnswer
                : t('reviewWrongPrefix') + a.picked + t('reviewWrongMid') + a.correctAnswer + ')'}
            </span>
            <button
              type="button"
              className={`${styles.markKnownBtn} ${known ? styles.isKnown : ''}`}
              disabled={known}
              title={label}
              aria-label={label}
              onClick={() => setWordStatus(a.day, a.idx, 'known')}
            >
              ✓
            </button>
          </div>
        );
      })}
    </div>
  );
}
