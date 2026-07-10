import type { ReactNode } from 'react';
import type { QuizQuestion } from '@deutsch-lernen/shared';
import { useLang } from '../../state/LangContext.js';
import { useQuizSession, type QuizAnswer } from './useQuizSession.js';
import { QuizQuestionCard } from './QuizQuestionCard.js';
import { QuizReviewList } from './QuizReviewList.js';
import styles from './Quiz.module.css';

interface Props {
  questions: QuizQuestion[];
  renderResultActions: (result: { score: number; total: number; answers: QuizAnswer[] }) => ReactNode;
}

/** One question-answering attempt: mount fresh (give the parent a `key` tied to
 * the attempt) each time a new quiz/practice-test run starts, so state resets. */
export function QuizRunner({ questions, renderResultActions }: Props) {
  const { t } = useLang();
  const session = useQuizSession(questions);

  if (session.finished) {
    const pct = session.total > 0 ? Math.round((session.score / session.total) * 100) : 0;
    return (
      <div className={styles.quizResult}>
        <div className={styles.quizScore}>
          {session.score}/{session.total}
        </div>
        <p>{t('resultLine', pct, pct >= 70)}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          {renderResultActions({ score: session.score, total: session.total, answers: session.answers })}
        </div>
        <QuizReviewList answers={session.answers} />
      </div>
    );
  }

  return (
    <QuizQuestionCard
      question={session.current}
      qi={session.qi}
      total={session.total}
      answered={session.answered}
      lastAnswer={session.lastAnswer}
      onAnswer={session.submitAnswer}
    />
  );
}
