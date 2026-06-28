/**
 * types/index.ts
 * Phase 1 Gate Quiz — Barrel exports for types
 */

export type {
  QuizStrategy,
  StrategyType,
  QuizQuestion,
  QuizOption,
  AnswerResult,
  QuizPhase,
} from "./engine";
export type { QuizSession } from "./session";
export { createInitialSession } from "./session";
export type {
  QuizGenerateRequest,
  ApiQuestion,
  QuizGenerateResponse,
  AnswerSubmitRequest,
  AnswerSubmitResponse,
  QuizAnswer,
  GateQuizResult,
  CategoryBreakdown,
} from "./api";
