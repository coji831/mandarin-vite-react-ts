export type Card = {
  wordId: string;
  character: string;
  pinyin: string;
  meaning: string;
  mastered?: boolean;
  lastReviewed?: string;
  reviewCount?: number;
  nextReview?: string;
};
