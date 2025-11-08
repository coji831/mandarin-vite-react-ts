// Unified types for normalized vocabulary and progress data

export type WordBasic = {
  wordId: string;
  chinese: string;
  pinyin: string;
  english: string;
};

export type WordProgress = {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string | null;
};

export type WordList = {
  itemsById: Record<string, WordBasic>;
  itemIds: string[];
};

export type ProgressList = {
  progressByWordId: Record<string, WordProgress>;
  wordIds: string[];
};
