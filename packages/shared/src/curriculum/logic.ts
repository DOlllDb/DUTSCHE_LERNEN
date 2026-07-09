import type { Curriculum, Day, Word } from './types.js';
import type { Progress } from '../progress/types.js';

export function totalWords(curriculum: Curriculum): number {
  return curriculum.days.reduce((sum, d) => sum + d.words.length, 0);
}

export function getDay(curriculum: Curriculum, dayNum: number): Day | undefined {
  return curriculum.days.find((d) => d.day === dayNum);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface WeekBlock {
  num: number;
  days: number[];
  testDay: number;
}

export function weekBlocks(curriculum: Curriculum): WeekBlock[] {
  const blocks: WeekBlock[] = [];
  let prev = 0;
  curriculum.test_days.forEach((testDay, i) => {
    const days: number[] = [];
    for (let d = prev + 1; d <= testDay; d++) days.push(d);
    blocks.push({ num: i + 1, days, testDay });
    prev = testDay;
  });
  return blocks;
}

export interface QuizQuestion {
  prompt: string;
  correct: string;
  options: string[];
  direction: 'de-en' | 'en-de';
}

/** Builds the weekly-quiz question set for a test day: up to 20 multiple-choice
 * questions drawn from every word since the previous test day, mixing
 * German->English and English->German prompts with 3 shuffled distractors each. */
export function buildQuiz(curriculum: Curriculum, testDay: number): QuizQuestion[] {
  const idx = curriculum.test_days.indexOf(testDay);
  const prevTest = idx > 0 ? curriculum.test_days[idx - 1] : 0;

  let pool: Word[] = [];
  curriculum.days.forEach((d) => {
    if (d.day > prevTest && d.day <= testDay) pool = pool.concat(d.words);
  });

  const qCount = Math.min(20, pool.length);
  const chosen = shuffle(pool).slice(0, qCount);

  return chosen.map((w) => {
    const deToEn = Math.random() < 0.5;
    const correct = deToEn ? w.en : w.de;
    const prompt = deToEn ? w.de : w.en;
    const distractors = shuffle(pool.filter((p) => p !== w))
      .slice(0, 3)
      .map((p) => (deToEn ? p.en : p.de));
    const options = shuffle([correct, ...distractors]);
    return { prompt, correct, options, direction: deToEn ? 'de-en' : 'en-de' } as QuizQuestion;
  });
}

export interface Stats {
  doneDaysCount: number;
  wordsLearned: number;
  testsPassed: number;
}

export function computeStats(curriculum: Curriculum, progress: Progress): Stats {
  const doneDaysCount = Object.keys(progress.doneDays).length;
  let wordsLearned = 0;
  curriculum.days.forEach((d) => {
    if (progress.doneDays[d.day]) wordsLearned += d.words.length;
  });
  const testsPassed = Object.keys(progress.testScores).length;
  return { doneDaysCount, wordsLearned, testsPassed };
}
