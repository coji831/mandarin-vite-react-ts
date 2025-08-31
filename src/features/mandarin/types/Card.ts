export type Card = {
  wordId: string;
  character: string;
  pinyin: string;
  meaning: string;
  sentence: string;
  sentencePinyin: string;
  sentenceMeaning: string;
  mastered?: boolean;
  lastReviewed?: string;
  reviewCount?: number;
  nextReview?: string;
};
