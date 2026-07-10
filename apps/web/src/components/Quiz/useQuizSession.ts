import { useState } from 'react';
import type { QuizQuestion } from '@deutsch-lernen/shared';

export interface QuizAnswer {
  prompt: string;
  correct: boolean;
  picked: string;
  correctAnswer: string;
}

interface QuizSessionState {
  qi: number;
  score: number;
  answers: QuizAnswer[];
  finished: boolean;
}

const ANSWER_REVEAL_DELAY_MS = 700;

/** Drives the question-by-question flow shared by the weekly test and the
 * anytime practice test: current question, scoring, and the brief
 * highlight-then-advance delay after each answer. */
export function useQuizSession(questions: QuizQuestion[]) {
  const [state, setState] = useState<QuizSessionState>({ qi: 0, score: 0, answers: [], finished: false });

  const current = questions[state.qi];
  const lastAnswer = state.answers.length > state.qi ? state.answers[state.answers.length - 1] : null;
  const answered = lastAnswer !== null;

  function submitAnswer(option: string) {
    if (!current || answered) return;
    const correct = option === current.correct;
    const answer: QuizAnswer = { prompt: current.prompt, correct, picked: option, correctAnswer: current.correct };

    setState((prev) => ({
      ...prev,
      answers: [...prev.answers, answer],
      score: prev.score + (correct ? 1 : 0),
    }));

    setTimeout(() => {
      setState((prev) => {
        const qi = prev.qi + 1;
        return { ...prev, qi, finished: qi >= questions.length };
      });
    }, ANSWER_REVEAL_DELAY_MS);
  }

  return {
    current,
    qi: state.qi,
    total: questions.length,
    score: state.score,
    answers: state.answers,
    finished: state.finished,
    answered,
    lastAnswer,
    submitAnswer,
  };
}
