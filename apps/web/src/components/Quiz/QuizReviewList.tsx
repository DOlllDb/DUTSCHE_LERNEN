import { useLang } from '../../state/LangContext.js';
import { WordStatusToggle } from '../WordStatusToggle/WordStatusToggle.js';
import type { QuizAnswer } from './useQuizSession.js';
import styles from './Quiz.module.css';

export function QuizReviewList({ answers }: { answers: QuizAnswer[] }) {
  const { t } = useLang();

  return (
    <div className={styles.reviewList}>
      {answers.map((a, i) => (
        <div key={i} className={`${styles.reviewItem} ${a.correct ? '' : styles.miss}`}>
          <span className={styles.reviewDe}>{a.prompt}</span>
          <span className={styles.reviewAnswer}>
            {a.correct
              ? t('reviewCorrect') + a.correctAnswer
              : t('reviewWrongPrefix') + a.picked + t('reviewWrongMid') + a.correctAnswer + ')'}
          </span>
          <WordStatusToggle day={a.day} idx={a.idx} />
        </div>
      ))}
    </div>
  );
}
