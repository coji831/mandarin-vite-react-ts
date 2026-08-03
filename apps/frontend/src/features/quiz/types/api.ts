/**
 * api.ts
 * Phase 1 Gate Quiz — API types
 *
 * Defines request/response shapes for the quiz backend API.
 */

/** Request body for fetching quiz questions */
export type QuizGenerateRequest = {
  strategyType: string;
  count: number;
};

/** A question from the API response */
export type ApiQuestion = {
  id: string;
  audioKey: string;
  /**
   * @deprecated Tri-modal field — see `expectedPinyin` / `correctOptionId` /
   * `correctGlyph`. Wire name kept (backend payload unchanged).
   */
  correctPinyin: string;
  correctTone: number;
  category: string;
  displayPinyin?: string;
  character?: string | null;
  /** Audio-to-pinyin-tone: expected pinyin string. */
  expectedPinyin?: string;
  /** Radical-gate: the correct multiple-choice option id. */
  correctOptionId?: string;
  /** IME-simulator: the expected Hanzi glyph. */
  correctGlyph?: string;
};

/** Response from the quiz generation endpoint */
export type QuizGenerateResponse = {
  questions: ApiQuestion[];
};

/** Request body for submitting an answer */
export type AnswerSubmitRequest = {
  questionId: string;
  userPinyin: string;
  userTone: number;
  strategyType: string;
};

/** Response from the answer evaluation endpoint */
export type AnswerSubmitResponse = {
  correct: boolean;
  correctPinyin: string;
  correctTone: number;
  feedback: string;
  toneDescription: string;
};

/** Quiz answer record returned from backend after submission */
export type QuizAnswer = {
  id: string;
  attemptId: string;
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  correct: boolean;
  category: string;
};

/** Category breakdown for quiz results */
export type CategoryBreakdown = {
  pinyin: number;
  tones: number;
  pairs: number;
  rules: number;
};

/** Final result of a completed quiz attempt */
export type GateQuizResult = {
  totalScore: number;
  maxScore: number;
  passed: boolean;
  accuracy: number;
  categoryBreakdown: CategoryBreakdown;
};
