import { useState } from 'react';
import type { Curriculum, Day, QuizQuestion } from '@deutsch-lernen/shared';
import { buildQuiz } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './Quiz.module.css';

interface Props {
  day: Day;
  curriculum: Curriculum;
  onBackToCards: () => void;
}

interface Answer {
  prompt: string;
  correct: boolean;
  picked: string;
  correctAnswer: string;
}

interface QuizState {
  questions: QuizQuestion[];
  qi: number;
  score: number;
  answers: Answer[];
  finished: boolean;
}

export function Quiz({ day, curriculum, onBackToCards }: Props) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const { progress, submitQuizResult } = useProgress();
  const { t } = useLang();

  const idx = curriculum.test_days.indexOf(day.day);
  const prevTest = idx > 0 ? curriculum.test_days[idx - 1] : 0;
  const rangeLabel = `${prevTest + 1}–${day.day}`;
  const prevScore = progress.testScores[day.day];

  if (!quizState) {
    return (
      <div className={styles.quizIntro}>
        <h3>{t('quizReady')}</h3>
        <p>{t('quizIntro', rangeLabel)}</p>
        {prevScore && (
          <p>
            <strong>{t('lastScore')}</strong> {prevScore.score}/{prevScore.total}
          </p>
        )}
        <button
          className="btn gold"
          style={{ marginTop: 14 }}
          onClick={() => setQuizState({ questions: buildQuiz(curriculum, day.day), qi: 0, score: 0, answers: [], finished: false })}
        >
          {t('startQuiz')}
        </button>
      </div>
    );
  }

  if (quizState.finished) {
    const pct = Math.round((quizState.score / quizState.questions.length) * 100);
    return (
      <div className={styles.quizResult}>
        <div className={styles.quizScore}>
          {quizState.score}/{quizState.questions.length}
        </div>
        <p>{t('resultLine', pct, pct >= 70)}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <button className="btn ghost" onClick={() => setQuizState(null)}>
            {t('retryQuiz')}
          </button>
          <button
            className="btn primary"
            onClick={async () => {
              await submitQuizResult(day.day, quizState.score, quizState.questions.length);
              onBackToCards();
            }}
          >
            {t('markTestDone')}
          </button>
        </div>
        <div className={styles.reviewList}>
          {quizState.answers.map((a, i) => (
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
      </div>
    );
  }

  const q = quizState.questions[quizState.qi];

  function pick(option: string) {
    if (!quizState) return;
    const correct = option === q.correct;
    const answers = [...quizState.answers, { prompt: q.prompt, correct, picked: option, correctAnswer: q.correct }];
    const score = quizState.score + (correct ? 1 : 0);
    setTimeout(() => {
      const qi = quizState.qi + 1;
      setQuizState({ ...quizState, qi, score, answers, finished: qi >= quizState.questions.length });
    }, 700);
    // lock in the answer immediately so buttons disable/highlight during the delay
    setQuizState({ ...quizState, answers, score, qi: quizState.qi, finished: false, questions: quizState.questions });
  }

  return (
    <div>
      <div className={styles.quizQCount}>{t('qCount', quizState.qi + 1, quizState.questions.length)}</div>
      <div className={styles.quizPrompt}>
        <div className={styles.lbl}>{q.direction === 'de-en' ? t('promptDeEn') : t('promptEnDe')}</div>
        <div className={styles.word}>{q.prompt}</div>
      </div>
      <div className={styles.quizOptions}>
        {q.options.map((o, i) => {
          const answered = quizState.answers.length > quizState.qi;
          const lastAnswer = answered ? quizState.answers[quizState.answers.length - 1] : null;
          const isCorrectOpt = answered && o === q.correct;
          const isWrongPicked = answered && lastAnswer?.picked === o && !lastAnswer.correct;
          const cls = [styles.optBtn, isCorrectOpt && styles.correct, isWrongPicked && styles.wrong]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => pick(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
