/**
 * Quiz type definitions
 * Story 15.5: Core UI component types
 */

export type QuestionMode = "multiple_choice" | "type_pinyin" | "type_character";

export interface QuizQuestion {
  wordId: string;
  word: string;
  pinyin: string;
  english: string;
  mode: QuestionMode;
  options?: string[]; // Required for multiple_choice mode
}

export interface QuizAnswer {
  wordId: string;
  questionType: QuestionMode;
  userAnswer: string;
  correct: boolean;
  timestamp: Date;
}
