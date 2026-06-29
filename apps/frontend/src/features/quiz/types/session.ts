/**
 * session.ts
 * Phase 1 Gate Quiz — Session types
 *
 * Defines the session state shape for the strategy-based quiz store.
 */

import type { StrategyType, QuizPhase, QuizQuestion, AnswerResult } from "./engine";
import type { GateQuizResult } from "./api";

import type { QuizStrategyConfig } from "./engine";

/** Overall session state for a strategy-based quiz */
export interface QuizSession {
  strategyType: StrategyType;
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: AnswerResult[];
  score: number;
  timer: number;
  error: string | null;
  attemptId: string | null; // Backend attempt ID for answer persistence
  completionResult: GateQuizResult | null; // Backend completion result after finalizing
  strategyConfig: QuizStrategyConfig | null; // Config fetched from backend at init
}

/** Initial state factory */
export function createInitialSession(strategyType: StrategyType): QuizSession {
  return {
    strategyType,
    phase: "LOADING",
    questions: [],
    currentIndex: 0,
    answers: [],
    score: 0,
    timer: 150, // 2:30 in seconds
    error: null,
    attemptId: null,
    completionResult: null,
    strategyConfig: null,
  };
}
