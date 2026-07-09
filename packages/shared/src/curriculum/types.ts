export interface Word {
  cat: string;
  de: string;
  en: string;
  cat_en: string;
}

export interface Day {
  day: number;
  title: string;
  title_en: string;
  is_test: boolean;
  words: Word[];
}

export interface Curriculum {
  days: Day[];
  test_days: number[];
}
