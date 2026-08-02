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

  // ─── Hint system (Story 21.18) ─────────────────────────────────────
  /** Number of hints remaining for the session (starts at 3) */
  hintsRemaining: number;
  /** Current question's phonetic hint — set after wrong answer in IME */
  currentPhoneticHint: PhoneticHintState | null;
  /** Whether the user has shown the radical hint for the current question */
  showRadicalHint: boolean;
  /** Accumulated max score penalty from radical hint usage */
  maxScorePenalty: number;
  /** Per-classification score tracking */
  scoreByType: Record<string, { correct: number; total: number }>;
}

/** State for a phonetic hint (what to display and whether data was found) */
export interface PhoneticHintState {
  /** The phonetic component data, or null if the character has no phonetic component */
  data: {
    glyph: string;
    pinyin: string;
    meaning: string;
  } | null;
  /** Whether the character has a phonetic component (false = no component found) */
  hasPhoneticComponent: boolean;
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
    hintsRemaining: 3,
    currentPhoneticHint: null,
    showRadicalHint: false,
    maxScorePenalty: 0,
    scoreByType: {},
  };
}
