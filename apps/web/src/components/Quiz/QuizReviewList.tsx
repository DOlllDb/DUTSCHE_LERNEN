import { useLang } from '../../state/LangContext.js';
import type { QuizAnswer } from './useQuizSession.js';
import styles from './Quiz.module.css';

export function QuizReviewList({ answers }: { answers: QuizAnswer[] }) {
  const { t } = useLang();

  return (
    <div className={styles.reviewList}>
      {answers.map((a, i) => (
        <div key={i} className={`${styles.reviewItem} ${a.correct ? '' : styles.miss}`}>
          <span className={styles.reviewDe}>{a.prompt}</span>
          <span>
            {a.correct
              ? t('reviewCorrect') + a.correctAnswer
              : t('reviewWrongPrefix') + a.picked + t('reviewWrongMid') + a.correctAnswer + ')'}
          </span>
        </div>
      ))}
    </div>
  );
}
