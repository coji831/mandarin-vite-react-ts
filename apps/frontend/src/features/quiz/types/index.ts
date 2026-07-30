/**
 * types/index.ts
 * Phase 1 Gate Quiz — Barrel exports for types
 */

export type {
  QuizStrategy,
  QuizStrategyConfig,
  StrategyType,
  QuizQuestion,
  QuizOption,
  AnswerResult,
  QuizPhase,
  PhoneticHint,
} from "./engine";
export type { QuizSession, PhoneticHintState } from "./session";
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
