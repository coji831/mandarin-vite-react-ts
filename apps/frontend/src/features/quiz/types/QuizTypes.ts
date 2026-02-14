/**
 * Quiz type definitions
 * Story 15.5: Core UI component types
 */

export type QuestionMode = "multiple_choice" | "type_pinyin" | "type_character";

export type QuizQuestion = {
  wordId: string;
  word: string;
  pinyin: string;
  english: string;
  mode: QuestionMode;
  options?: string[]; // Required for multiple_choice mode
};

export type QuizAnswer = {
  wordId: string;
  questionType: QuestionMode;
  userAnswer: string;
  correct: boolean;
  timestamp: Date;
  // Story 15.8: Additional word details for quiz summary
  word?: string; // Chinese character
  pinyin?: string;
  english?: string;
  nextReview?: string; // ISO date string for next review
  lapseCount?: number; // Consecutive failures
  currentDelay?: number; // Days until next review
};
