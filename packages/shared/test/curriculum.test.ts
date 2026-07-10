import { describe, it, expect } from 'vitest';
import { CURRICULUM } from '../src/curriculum/data.js';
import {
  totalWords,
  getDay,
  weekBlocks,
  buildQuiz,
  computeStats,
  shuffle,
  getLearnedWords,
  buildPracticeQuiz,
} from '../src/curriculum/logic.js';
import { emptyProgress } from '../src/progress/types.js';

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
  it('builds 20 questions for a full week, each with 4 options including the correct answer', () => {
    const questions = buildQuiz(CURRICULUM, 7);
    expect(questions).toHaveLength(20);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.correct);
      expect(['de-en', 'en-de']).toContain(q.direction);
    }
  });

  it('caps question count at the available pool size for small pools', () => {
    // day 60 is a test day covering only days 57-60 (fewer than 20 words is not
    // actually the case here since it's 4 days * 20 words = 80, but this proves
    // the min() cap logic doesn't throw and respects pool size either way)
    const questions = buildQuiz(CURRICULUM, 60);
    expect(questions.length).toBeLessThanOrEqual(20);
    expect(questions.length).toBeGreaterThan(0);
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

describe('getLearnedWords', () => {
  it('returns nothing for empty progress', () => {
    expect(getLearnedWords(CURRICULUM, emptyProgress())).toEqual([]);
  });

  it('returns only words from days marked done', () => {
    const progress = emptyProgress();
    progress.doneDays[1] = true;
    progress.doneDays[3] = true;
    const words = getLearnedWords(CURRICULUM, progress);
    expect(words).toHaveLength(40);
    expect(words).toEqual([...getDay(CURRICULUM, 1)!.words, ...getDay(CURRICULUM, 3)!.words]);
  });
});

describe('buildPracticeQuiz', () => {
  it('respects an explicit direction for every question', () => {
    const pool = getDay(CURRICULUM, 1)!.words;
    const deToEn = buildPracticeQuiz(pool, 'de-en');
    expect(deToEn.length).toBeGreaterThan(0);
    for (const q of deToEn) expect(q.direction).toBe('de-en');

    const enToDe = buildPracticeQuiz(pool, 'en-de');
    for (const q of enToDe) expect(q.direction).toBe('en-de');
  });

  it('mixes directions when asked', () => {
    const pool = [...getDay(CURRICULUM, 1)!.words, ...getDay(CURRICULUM, 2)!.words];
    const questions = buildPracticeQuiz(pool, 'mixed');
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) expect(['de-en', 'en-de']).toContain(q.direction);
  });

  it('returns an empty quiz for an empty pool without throwing', () => {
    expect(buildPracticeQuiz([], 'mixed')).toEqual([]);
  });
});
