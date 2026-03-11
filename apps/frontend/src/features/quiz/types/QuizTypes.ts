/**
 * Quiz type definitions
 * Story 15.5: Core UI component types
 * Story 15.11 Phase 8: Added id field for backend session integration
 */

export type QuestionMode = "multiple_choice" | "type_pinyin" | "type_character";

export type QuizQuestion = {
  id?: string; // Phase 8: Unique identifier for session-based questions (wordId-questionType)
  wordId: string;
  word: string;
  // Backend omits pinyin for type_pinyin questions (security: answer not revealed)
  pinyin?: string;
  // Backend omits english for multiple_choice questions (security: answer not revealed)
  english?: string;
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
  nextReviewDate?: string; // ISO date string for next review
  lapseCount?: number; // Consecutive failures
  currentDelay?: number; // Days until next review
  isLeech?: boolean; // Backend-determined leech flag (lapseCount >= threshold)
  correctAnswer?: string; // Correct answer text from backend (for feedback display)
};
