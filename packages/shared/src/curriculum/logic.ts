import type { Curriculum, Day, Word } from './types.js';
import type { Progress } from '../progress/types.js';
import { wordKey } from '../progress/types.js';

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

/** A word plus its position in the curriculum. `Word` alone has no
 * back-reference, so this is what lets a quiz result map back to
 * `wordKey(day, idx)` in Progress. */
export interface WordRef {
  word: Word;
  day: number;
  idx: number;
}

export interface QuizQuestion {
  prompt: string;
  correct: string;
  options: string[];
  direction: 'de-en' | 'en-de';
  /** Curriculum position of the word being tested. */
  day: number;
  idx: number;
}

/** 'mixed' picks a random direction per question, like the weekly test does. */
export type QuizDirection = 'de-en' | 'en-de' | 'mixed';

/** Which words a test draws from. 'learning' means ONLY words the user
 * explicitly flagged as still-learning -- words with no stored status do not
 * count, so this pool is often small and needs topping up. */
export type QuizSource = 'all' | 'learning';

const DEFAULT_QUESTION_COUNT = 20;
const OPTION_COUNT = 4;

function refsOfDay(d: Day): WordRef[] {
  return d.words.map((word, idx) => ({ word, day: d.day, idx }));
}

/** Every word in the curriculum. Used as the distractor pool and as the last
 * fallback tier when a filtered pool is too small. */
export function allWordRefs(curriculum: Curriculum): WordRef[] {
  return curriculum.days.flatMap(refsOfDay);
}

/** The words a weekly test covers: everything after the previous test day, up
 * to and including `testDay`. */
export function weekWordRefs(curriculum: Curriculum, testDay: number): WordRef[] {
  const i = curriculum.test_days.indexOf(testDay);
  const prevTest = i > 0 ? curriculum.test_days[i - 1] : 0;
  return curriculum.days.filter((d) => d.day > prevTest && d.day <= testDay).flatMap(refsOfDay);
}

/** All words from days the user has marked done -- the same definition of
 * "learned" that the stats bar's word count already uses. */
export function getLearnedWordRefs(curriculum: Curriculum, progress: Progress): WordRef[] {
  return curriculum.days.filter((d) => progress.doneDays[d.day]).flatMap(refsOfDay);
}

/** True only when the user explicitly tapped "still learning" for this word.
 * A word with no stored status is NOT still-learning. */
export function isStillLearning(progress: Progress, ref: WordRef): boolean {
  return progress.wordStatus[wordKey(ref.day, ref.idx)] === 'learning';
}

export function filterStillLearning(refs: WordRef[], progress: Progress): WordRef[] {
  return refs.filter((r) => isStillLearning(progress, r));
}

/** Fills `primary` up to `target` from ordered fallback tiers, never repeating
 * a word already present. Each tier is shuffled so top-ups aren't always the
 * earliest days. */
function topUp(primary: WordRef[], tiers: WordRef[][], target: number): WordRef[] {
  const out = primary.slice();
  const seen = new Set(out.map((r) => wordKey(r.day, r.idx)));

  for (const tier of tiers) {
    if (out.length >= target) break;
    for (const ref of shuffle(tier)) {
      if (out.length >= target) break;
      const k = wordKey(ref.day, ref.idx);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(ref);
    }
  }
  return out;
}

/**
 * Distractors come from `distractorPool` (normally the whole curriculum), NOT
 * from `pool`. Drawing them from `pool` used to yield fewer than 4 options
 * whenever the question pool was small -- e.g. a 2-word still-learning filter
 * produced 2-option questions. Options are also deduped by text so two words
 * sharing a translation can't collapse the count either.
 */
function buildQuestionsFromPool(
  pool: WordRef[],
  distractorPool: WordRef[],
  direction: QuizDirection,
  maxCount: number = DEFAULT_QUESTION_COUNT
): QuizQuestion[] {
  const chosen = shuffle(pool).slice(0, Math.min(maxCount, pool.length));

  return chosen.map((ref) => {
    const deToEn = direction === 'mixed' ? Math.random() < 0.5 : direction === 'de-en';
    const answerText = (r: WordRef) => (deToEn ? r.word.en : r.word.de);

    const correct = answerText(ref);
    const prompt = deToEn ? ref.word.de : ref.word.en;

    const used = new Set<string>([correct]);
    const distractors: string[] = [];
    for (const cand of shuffle(distractorPool)) {
      if (distractors.length >= OPTION_COUNT - 1) break;
      if (cand.day === ref.day && cand.idx === ref.idx) continue;
      const text = answerText(cand);
      if (used.has(text)) continue;
      used.add(text);
      distractors.push(text);
    }

    return {
      prompt,
      correct,
      options: shuffle([correct, ...distractors]),
      direction: deToEn ? 'de-en' : 'en-de',
      day: ref.day,
      idx: ref.idx,
    };
  });
}

/**
 * Weekly test for a given test day. `source` picks the primary pool; if that
 * pool has fewer than 20 words it is topped up from still-learning words
 * elsewhere, then from the rest of the curriculum.
 *
 * For `source: 'all'` the week always holds at least 80 words, so the top-up
 * never fires and behaviour is unchanged.
 */
export function buildQuiz(
  curriculum: Curriculum,
  progress: Progress,
  testDay: number,
  source: QuizSource = 'all'
): QuizQuestion[] {
  const everything = allWordRefs(curriculum);
  const weekRefs = weekWordRefs(curriculum, testDay);
  const primary = source === 'learning' ? filterStillLearning(weekRefs, progress) : weekRefs;

  const pool = topUp(
    primary,
    source === 'learning' ? [filterStillLearning(everything, progress), everything] : [everything],
    DEFAULT_QUESTION_COUNT
  );

  return buildQuestionsFromPool(pool, everything, 'mixed');
}

/**
 * Anytime practice test. 'all' draws from every word on days marked done;
 * 'learning' from only the explicitly-flagged ones, topped up first with other
 * still-learning words, then other *learned* words (more useful filler than
 * unseen vocabulary), then the wider curriculum.
 *
 * Returns [] when no day has been completed yet -- the caller shows the
 * "finish a day first" message instead.
 */
export function buildPracticeQuiz(
  curriculum: Curriculum,
  progress: Progress,
  direction: QuizDirection,
  source: QuizSource = 'all'
): QuizQuestion[] {
  const learned = getLearnedWordRefs(curriculum, progress);
  if (learned.length === 0) return [];

  const everything = allWordRefs(curriculum);
  const primary = source === 'learning' ? filterStillLearning(learned, progress) : learned;

  const pool = topUp(
    primary,
    source === 'learning'
      ? [filterStillLearning(everything, progress), learned, everything]
      : [everything],
    DEFAULT_QUESTION_COUNT
  );

  return buildQuestionsFromPool(pool, everything, direction);
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
