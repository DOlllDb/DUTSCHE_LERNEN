import { useState } from 'react';
import type { QuizDirection, QuizQuestion, Word } from '@deutsch-lernen/shared';
import { buildPracticeQuiz } from '@deutsch-lernen/shared';
import { useLang } from '../../state/LangContext.js';
import { QuizRunner } from './QuizRunner.js';
import quizStyles from './Quiz.module.css';
import styles from './PracticeQuiz.module.css';
import panelStyles from '../DayView/DayView.module.css';

interface Props {
  pool: Word[];
  onExit: () => void;
}

interface Attempt {
  id: number;
  direction: QuizDirection;
  questions: QuizQuestion[];
}

const DIRECTIONS: { value: QuizDirection; labelKey: 'directionDeEn' | 'directionEnDe' | 'directionMixed' }[] = [
  { value: 'de-en', labelKey: 'directionDeEn' },
  { value: 'en-de', labelKey: 'directionEnDe' },
  { value: 'mixed', labelKey: 'directionMixed' },
];

export function PracticeQuiz({ pool, onExit }: Props) {
  const [direction, setDirection] = useState<QuizDirection>('mixed');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const { t } = useLang();

  function start() {
    setAttempt((prev) => ({ id: (prev?.id ?? 0) + 1, direction, questions: buildPracticeQuiz(pool, direction) }));
  }

  if (!attempt) {
    return (
      <div className={panelStyles.panel}>
        <div className={quizStyles.quizIntro}>
          <h3>{t('practiceTestTitle')}</h3>
          {pool.length === 0 ? (
            <p>{t('practiceTestEmpty')}</p>
          ) : (
            <>
              <p>{t('practiceTestIntro', pool.length)}</p>
              <div className={styles.directionPicker}>
                {DIRECTIONS.map((d) => (
                  <button
                    key={d.value}
                    className={`${styles.directionBtn} ${direction === d.value ? styles.active : ''}`}
                    onClick={() => setDirection(d.value)}
                  >
                    {t(d.labelKey)}
                  </button>
                ))}
              </div>
              <button className="btn gold" onClick={start}>
                {t('startQuiz')}
              </button>
            </>
          )}
          <div style={{ marginTop: 14 }}>
            <button className="btn ghost" onClick={onExit}>
              {t('backToApp')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={panelStyles.panel}>
      <QuizRunner
        key={attempt.id}
        questions={attempt.questions}
        renderResultActions={() => (
          <>
            <button className="btn ghost" onClick={() => setAttempt(null)}>
              {t('practiceAgain')}
            </button>
            <button className="btn primary" onClick={onExit}>
              {t('donePracticing')}
            </button>
          </>
        )}
      />
    </div>
  );
}
