import { useState } from 'react';
import type { QuizDirection, QuizQuestion, QuizSource } from '@deutsch-lernen/shared';
import { buildPracticeQuiz, getLearnedWordRefs, filterStillLearning } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { QuizRunner } from './QuizRunner.js';
import { QuizSourcePicker } from './QuizSourcePicker.js';
import quizStyles from './Quiz.module.css';
import panelStyles from '../DayView/DayView.module.css';

interface Props {
  onExit: () => void;
}

interface Attempt {
  id: number;
  questions: QuizQuestion[];
}

const DIRECTIONS: { value: QuizDirection; labelKey: 'directionDeEn' | 'directionEnDe' | 'directionMixed' }[] = [
  { value: 'de-en', labelKey: 'directionDeEn' },
  { value: 'en-de', labelKey: 'directionEnDe' },
  { value: 'mixed', labelKey: 'directionMixed' },
];

export function PracticeQuiz({ onExit }: Props) {
  const [direction, setDirection] = useState<QuizDirection>('mixed');
  const [source, setSource] = useState<QuizSource>('all');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const { curriculum, progress } = useProgress();
  const { t } = useLang();

  if (!curriculum) return null;

  // Captured after the guard so the closure below sees a non-nullable value.
  const loaded = curriculum;
  const learnedRefs = getLearnedWordRefs(loaded, progress);
  const learningCount = filterStillLearning(learnedRefs, progress).length;

  function start() {
    setAttempt((prev) => ({
      id: (prev?.id ?? 0) + 1,
      questions: buildPracticeQuiz(loaded, progress, direction, source),
    }));
  }

  if (!attempt) {
    return (
      <div className={panelStyles.panel}>
        <div className={quizStyles.quizIntro}>
          <h3>{t('practiceTestTitle')}</h3>
          {learnedRefs.length === 0 ? (
            <p>{t('practiceTestEmpty')}</p>
          ) : (
            <>
              <p>{t('practiceTestIntro', learnedRefs.length)}</p>

              <div className={quizStyles.pickerLabel}>{t('directionLabel')}</div>
              <div className={quizStyles.pickerRow}>
                {DIRECTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`${quizStyles.pickerBtn} ${direction === d.value ? quizStyles.active : ''}`}
                    onClick={() => setDirection(d.value)}
                  >
                    {t(d.labelKey)}
                  </button>
                ))}
              </div>

              <QuizSourcePicker value={source} onChange={setSource} learningCount={learningCount} />

              <button className="btn gold" style={{ marginTop: 14 }} onClick={start}>
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
