/**
 * api.ts
 * Phase 1 Gate Quiz — API types
 *
 * Defines request/response shapes for the quiz backend API.
 */

/** Request body for fetching quiz questions */
export interface QuizGenerateRequest {
  strategyType: string;
  count: number;
}

/** A question from the API response */
export interface ApiQuestion {
  id: string;
  audioKey: string;
  correctPinyin: string;
  correctTone: number;
  category: string;
  displayPinyin?: string;
  character?: string | null;
}

/** Response from the quiz generation endpoint */
export interface QuizGenerateResponse {
  questions: ApiQuestion[];
}

/** Request body for submitting an answer */
export interface AnswerSubmitRequest {
  questionId: string;
  userPinyin: string;
  userTone: number;
  strategyType: string;
}

/** Response from the answer evaluation endpoint */
export interface AnswerSubmitResponse {
  correct: boolean;
  correctPinyin: string;
  correctTone: number;
  feedback: string;
  toneDescription: string;
}

/** Quiz answer record returned from backend after submission */
export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  correct: boolean;
  category: string;
}

/** Category breakdown for quiz results */
export interface CategoryBreakdown {
  pinyin: number;
  tones: number;
  pairs: number;
  rules: number;
}

/** Final result of a completed quiz attempt */
export interface GateQuizResult {
  totalScore: number;
  maxScore: number;
  passed: boolean;
  accuracy: number;
  categoryBreakdown: CategoryBreakdown;
}
