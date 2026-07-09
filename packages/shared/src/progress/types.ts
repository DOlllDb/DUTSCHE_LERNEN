export type WordStatus = 'known' | 'learning';

export interface TestScore {
  score: number;
  total: number;
}

export interface Progress {
  doneDays: Record<number, true>;
  wordStatus: Record<string, WordStatus>;
  testScores: Record<number, TestScore>;
}

export function emptyProgress(): Progress {
  return { doneDays: {}, wordStatus: {}, testScores: {} };
}

export function wordKey(day: number, idx: number): string {
  return `${day}_${idx}`;
}
