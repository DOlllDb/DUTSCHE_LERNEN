import { describe, it, expect } from 'vitest';
import { CURRICULUM } from '../src/curriculum/data.js';
import {
  totalWords,
  getDay,
  weekBlocks,
  buildQuiz,
  computeStats,
  shuffle,
  getLearnedWordRefs,
  buildPracticeQuiz,
  allWordRefs,
  weekWordRefs,
  filterStillLearning,
  isStillLearning,
  curriculumTopics,
} from '../src/curriculum/logic.js';
import type { QuizQuestion } from '../src/curriculum/logic.js';
import { emptyProgress, wordKey } from '../src/progress/types.js';
import type { Progress } from '../src/progress/types.js';

/** Builds a Progress with the given [day, idx] pairs flagged 'learning'. */
function learningProgress(pairs: [number, number][], doneDays: number[] = []): Progress {
  const p = emptyProgress();
  for (const d of doneDays) p.doneDays[d] = true;
  for (const [day, idx] of pairs) p.wordStatus[wordKey(day, idx)] = 'learning';
  return p;
}

const keysOf = (questions: QuizQuestion[]) => new Set(questions.map((q) => wordKey(q.day, q.idx)));

describe('curriculum data', () => {
  it('has 60 days', () => {
    expect(CURRICULUM.days).toHaveLength(60);
  });

  it('has 1200 words total', () => {
    expect(totalWords(CURRICULUM)).toBe(1200);
  });

  it('has exactly 9 test days matching is_test flags', () => {
    expect(CURRICULUM.test_days).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 60]);
    const flagged = CURRICULUM.days.filter((d) => d.is_test).map((d) => d.day);
    expect(flagged).toEqual(CURRICULUM.test_days);
  });

  it('getDay finds a day by number', () => {
    expect(getDay(CURRICULUM, 1)?.title).toBe('Zahlen');
    expect(getDay(CURRICULUM, 999)).toBeUndefined();
  });
});

describe('shuffle', () => {
  it('preserves all elements without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(result.slice().sort()).toEqual(input.slice().sort());
  });
});

describe('weekBlocks', () => {
  it('chunks days into 9 blocks ending on each test day', () => {
    const blocks = weekBlocks(CURRICULUM);
    expect(blocks).toHaveLength(9);
    expect(blocks[0]).toEqual({ num: 1, days: [1, 2, 3, 4, 5, 6, 7], testDay: 7 });
    expect(blocks[8].testDay).toBe(60);
    expect(blocks[8].days[0]).toBe(57);
  });
});

describe('buildQuiz', () => {
  it('builds 20 questions for a full week, each with 4 distinct options including the correct answer', () => {
    const questions = buildQuiz(CURRICULUM, emptyProgress(), 7, 'all');
    expect(questions).toHaveLength(20);
    for (const q of questions) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
      expect(['de-en', 'en-de']).toContain(q.direction);
    }
  });

  it('builds a full quiz for the short final block (days 57-60)', () => {
    const questions = buildQuiz(CURRICULUM, emptyProgress(), 60, 'all');
    expect(questions).toHaveLength(20);
  });

  it('carries curriculum position that resolves back to the tested word', () => {
    for (const q of buildQuiz(CURRICULUM, emptyProgress(), 7, 'all')) {
      const w = getDay(CURRICULUM, q.day)!.words[q.idx];
      expect(q.direction === 'de-en' ? w.de : w.en).toBe(q.prompt);
      expect(q.direction === 'de-en' ? w.en : w.de).toBe(q.correct);
    }
  });

  it('never repeats a word within one quiz', () => {
    const questions = buildQuiz(CURRICULUM, emptyProgress(), 14, 'all');
    expect(keysOf(questions).size).toBe(questions.length);
  });

  it("draws only from its own week by default, so the top-up never fires", () => {
    for (const q of buildQuiz(CURRICULUM, emptyProgress(), 14, 'all')) {
      expect(q.day).toBeGreaterThan(7);
      expect(q.day).toBeLessThanOrEqual(14);
    }
  });
});

describe('buildQuiz with source: learning', () => {
  it('stays within the week when enough words are flagged there', () => {
    const flagged: [number, number][] = [];
    for (let day = 1; day <= 7; day++) for (let idx = 0; idx < 4; idx++) flagged.push([day, idx]);
    const questions = buildQuiz(CURRICULUM, learningProgress(flagged), 7, 'learning');

    expect(questions).toHaveLength(20);
    for (const q of questions) expect(q.day).toBeLessThanOrEqual(7);
  });

  it('tops up from still-learning words in other weeks before unflagged ones', () => {
    const flagged: [number, number][] = [
      [1, 0],
      [2, 5],
      [15, 3],
      [16, 7],
      [22, 1],
    ];
    const questions = buildQuiz(CURRICULUM, learningProgress(flagged), 7, 'learning');
    const keys = keysOf(questions);

    expect(questions).toHaveLength(20);
    // all 5 flagged words must appear -- they are drawn before any filler
    for (const [day, idx] of flagged) expect(keys.has(wordKey(day, idx))).toBe(true);
  });

  it('still yields 20 four-option questions from a single flagged word', () => {
    const questions = buildQuiz(CURRICULUM, learningProgress([[1, 0]]), 7, 'learning');

    expect(questions).toHaveLength(20);
    expect(keysOf(questions).size).toBe(20);
    for (const q of questions) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
    }
  });

  it('falls back to the wider curriculum when nothing is flagged at all', () => {
    const questions = buildQuiz(CURRICULUM, emptyProgress(), 7, 'learning');
    expect(questions).toHaveLength(20);
    expect(keysOf(questions).size).toBe(20);
  });
});

describe('computeStats', () => {
  it('returns zeros for empty progress', () => {
    const stats = computeStats(CURRICULUM, emptyProgress());
    expect(stats).toEqual({ doneDaysCount: 0, wordsLearned: 0, testsPassed: 0 });
  });

  it('counts done days, learned words, and passed tests', () => {
    const progress = emptyProgress();
    progress.doneDays[1] = true;
    progress.doneDays[2] = true;
    progress.testScores[7] = { score: 18, total: 20 };
    const stats = computeStats(CURRICULUM, progress);
    expect(stats.doneDaysCount).toBe(2);
    expect(stats.wordsLearned).toBe(40);
    expect(stats.testsPassed).toBe(1);
  });
});

describe('word ref helpers', () => {
  it('allWordRefs covers the whole curriculum with correct positions', () => {
    const refs = allWordRefs(CURRICULUM);
    expect(refs).toHaveLength(1200);
    expect(refs[0]).toMatchObject({ day: 1, idx: 0 });
    expect(refs[0].word).toEqual(getDay(CURRICULUM, 1)!.words[0]);
    expect(refs[20]).toMatchObject({ day: 2, idx: 0 });
  });

  it('weekWordRefs covers days since the previous test day', () => {
    expect(weekWordRefs(CURRICULUM, 7)).toHaveLength(140);
    const second = weekWordRefs(CURRICULUM, 14);
    expect(second).toHaveLength(140);
    for (const r of second) {
      expect(r.day).toBeGreaterThan(7);
      expect(r.day).toBeLessThanOrEqual(14);
    }
  });

  it('getLearnedWordRefs returns nothing for empty progress', () => {
    expect(getLearnedWordRefs(CURRICULUM, emptyProgress())).toEqual([]);
  });

  it('getLearnedWordRefs returns only words from days marked done, with positions', () => {
    const progress = emptyProgress();
    progress.doneDays[1] = true;
    progress.doneDays[3] = true;
    const refs = getLearnedWordRefs(CURRICULUM, progress);

    expect(refs).toHaveLength(40);
    expect(refs.map((r) => r.word)).toEqual([
      ...getDay(CURRICULUM, 1)!.words,
      ...getDay(CURRICULUM, 3)!.words,
    ]);
    expect(refs[0]).toMatchObject({ day: 1, idx: 0 });
    expect(refs[20]).toMatchObject({ day: 3, idx: 0 });
  });
});

describe('curriculumTopics', () => {
  const topics = curriculumTopics(CURRICULUM);

  it('covers every word exactly once across all topics', () => {
    expect(topics.reduce((n, t) => n + t.refs.length, 0)).toBe(1200);
    const keys = new Set(topics.flatMap((t) => t.refs.map((r) => wordKey(r.day, r.idx))));
    expect(keys.size).toBe(1200);
  });

  it('lists topics in order of first appearance', () => {
    expect(topics[0].cat).toBe('Zahlen');
    expect(topics[0].cat_en).toBe('Numbers');
    const firstDays = topics.map((t) => t.days[0]);
    expect(firstDays).toEqual([...firstDays].sort((a, b) => a - b));
  });

  it('records the ascending, de-duplicated days a topic spans', () => {
    const zahlen = topics.find((t) => t.cat === 'Zahlen')!;
    expect(zahlen.days).toEqual([1, 2]);
    expect(zahlen.refs).toHaveLength(30);

    for (const t of topics) {
      expect(new Set(t.days).size).toBe(t.days.length);
      expect(t.days).toEqual([...t.days].sort((a, b) => a - b));
      // every ref really belongs to one of the recorded days
      for (const r of t.refs) expect(t.days).toContain(r.day);
    }
  });

  it('gives every topic a non-empty label pair', () => {
    for (const t of topics) {
      expect(t.cat.length).toBeGreaterThan(0);
      expect(t.cat_en.length).toBeGreaterThan(0);
    }
  });
});

describe('still-learning filter', () => {
  it('treats an unset status as NOT still-learning', () => {
    expect(filterStillLearning(weekWordRefs(CURRICULUM, 7), emptyProgress())).toEqual([]);
  });

  it('treats a known status as NOT still-learning', () => {
    const progress = emptyProgress();
    progress.wordStatus[wordKey(1, 0)] = 'known';
    expect(filterStillLearning(weekWordRefs(CURRICULUM, 7), progress)).toEqual([]);
    expect(isStillLearning(progress, { word: getDay(CURRICULUM, 1)!.words[0], day: 1, idx: 0 })).toBe(false);
  });

  it('picks up only the explicitly flagged words', () => {
    const progress = learningProgress([
      [1, 0],
      [2, 5],
    ]);
    const refs = filterStillLearning(weekWordRefs(CURRICULUM, 7), progress);

    expect(refs).toHaveLength(2);
    expect(refs.map((r) => ({ day: r.day, idx: r.idx }))).toEqual([
      { day: 1, idx: 0 },
      { day: 2, idx: 5 },
    ]);
  });
});

describe('buildPracticeQuiz', () => {
  const doneFirstTwoDays = () => learningProgress([], [1, 2]);

  it('respects an explicit direction for every question', () => {
    const progress = doneFirstTwoDays();

    const deToEn = buildPracticeQuiz(CURRICULUM, progress, 'de-en');
    expect(deToEn.length).toBeGreaterThan(0);
    for (const q of deToEn) expect(q.direction).toBe('de-en');

    const enToDe = buildPracticeQuiz(CURRICULUM, progress, 'en-de');
    for (const q of enToDe) expect(q.direction).toBe('en-de');
  });

  it('mixes directions when asked', () => {
    const questions = buildPracticeQuiz(CURRICULUM, doneFirstTwoDays(), 'mixed');
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) expect(['de-en', 'en-de']).toContain(q.direction);
  });

  it('returns an empty quiz when no day has been completed yet', () => {
    expect(buildPracticeQuiz(CURRICULUM, emptyProgress(), 'mixed')).toEqual([]);
  });

  it('draws only from learned days by default', () => {
    for (const q of buildPracticeQuiz(CURRICULUM, doneFirstTwoDays(), 'mixed', 'all')) {
      expect(q.day).toBeLessThanOrEqual(2);
    }
  });

  it('prefers other learned words as filler for a sparse still-learning pool', () => {
    // 40 learned words, only 1 flagged -- the 19 filler slots should all still
    // come from the learned days rather than the wider curriculum.
    const progress = learningProgress([[1, 0]], [1, 2]);
    const questions = buildPracticeQuiz(CURRICULUM, progress, 'mixed', 'learning');

    expect(questions).toHaveLength(20);
    expect(keysOf(questions).has(wordKey(1, 0))).toBe(true);
    for (const q of questions) expect(q.day).toBeLessThanOrEqual(2);
  });

  it('still yields four distinct options from a single flagged word', () => {
    const progress = learningProgress([[1, 0]], [1]);
    for (const q of buildPracticeQuiz(CURRICULUM, progress, 'mixed', 'learning')) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
    }
  });
});
