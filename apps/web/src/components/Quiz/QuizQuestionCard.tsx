import type { QuizQuestion } from '@deutsch-lernen/shared';
import { useLang } from '../../state/LangContext.js';
import type { QuizAnswer } from './useQuizSession.js';
import styles from './Quiz.module.css';

interface Props {
  question: QuizQuestion;
  qi: number;
  total: number;
  answered: boolean;
  lastAnswer: QuizAnswer | null;
  onAnswer: (option: string) => void;
}

export function QuizQuestionCard({ question, qi, total, answered, lastAnswer, onAnswer }: Props) {
  const { t } = useLang();

  return (
    <div>
      <div className={styles.quizQCount}>{t('qCount', qi + 1, total)}</div>
      <div className={styles.quizPrompt}>
        <div className={styles.lbl}>{question.direction === 'de-en' ? t('promptDeEn') : t('promptEnDe')}</div>
        <div className={styles.word}>{question.prompt}</div>
      </div>
      <div className={styles.quizOptions}>
        {question.options.map((o, i) => {
          const isCorrectOpt = answered && o === question.correct;
          const isWrongPicked = answered && lastAnswer?.picked === o && !lastAnswer.correct;
          const cls = [styles.optBtn, isCorrectOpt && styles.correct, isWrongPicked && styles.wrong]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => onAnswer(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
