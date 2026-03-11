/**
 * @file apps/frontend/src/features/quiz/types/index.ts
 * @description Centralized type exports for quiz feature
 */

// Modern Quiz Session API types
export type {
  MysteryBox,
  QuizSessionQuestion,
  QuizSessionStartResponse,
  QuizAnswerRequest,
  QuizAnswerResponse,
  IncorrectWordDetail,
  LeechWordDetail,
  QuizSessionSummary,
} from "./QuizSessionTypes";

// UI component types
export type { QuestionMode, QuizQuestion, QuizAnswer } from "./QuizTypes";
