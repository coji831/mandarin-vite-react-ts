/**
 * WordBasic: Basic information for a vocabulary word
 */
export type WordBasic = {
  wordId: string;
  chinese: string;
  pinyin: string;
  english: string;
};

/**
 * WordProgress: Tracks learning progress for a vocabulary word
 */
export type WordProgress = {
  wordId: string;
  learnedAt?: string | null;
};
