import { useState } from 'react';
import type { Curriculum, Day, QuizQuestion } from '@deutsch-lernen/shared';
import { buildQuiz } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { QuizRunner } from './QuizRunner.js';
import styles from './Quiz.module.css';

interface Props {
  day: Day;
  curriculum: Curriculum;
  onBackToCards: () => void;
}

interface Attempt {
  id: number;
  questions: QuizQuestion[];
}

export function Quiz({ day, curriculum, onBackToCards }: Props) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const { progress, submitQuizResult } = useProgress();
  const { t } = useLang();

  const idx = curriculum.test_days.indexOf(day.day);
  const prevTest = idx > 0 ? curriculum.test_days[idx - 1] : 0;
  const rangeLabel = `${prevTest + 1}–${day.day}`;
  const prevScore = progress.testScores[day.day];

  function start() {
    setAttempt((prev) => ({ id: (prev?.id ?? 0) + 1, questions: buildQuiz(curriculum, day.day) }));
  }

  if (!attempt) {
    return (
      <div className={styles.quizIntro}>
        <h3>{t('quizReady')}</h3>
        <p>{t('quizIntro', rangeLabel)}</p>
        {prevScore && (
          <p>
            <strong>{t('lastScore')}</strong> {prevScore.score}/{prevScore.total}
          </p>
        )}
        <button className="btn gold" style={{ marginTop: 14 }} onClick={start}>
          {t('startQuiz')}
        </button>
      </div>
    );
  }

  return (
    <QuizRunner
      key={attempt.id}
      questions={attempt.questions}
      renderResultActions={({ score, total }) => (
        <>
          <button className="btn ghost" onClick={() => setAttempt(null)}>
            {t('retryQuiz')}
          </button>
          <button
            className="btn primary"
            onClick={async () => {
              await submitQuizResult(day.day, score, total);
              onBackToCards();
            }}
          >
            {t('markTestDone')}
          </button>
        </>
      )}
    />
  );
}
