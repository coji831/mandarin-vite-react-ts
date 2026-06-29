/**
 * engine.ts
 * Phase 1 Gate Quiz — Strategy pattern types for quiz engine
 *
 * Defines the QuizStrategy interface and related types used by
 * the strategy-based quiz engine to support multiple quiz modes.
 */

/** Supported quiz strategy types */
export type StrategyType =
  | "audio-to-pinyin"
  | "audio-to-tone"
  | "audio-to-pinyin-tone"
  | "ime-simulator"
  | "radical-gate";

/** Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS */
export type QuizPhase = "LOADING" | "QUESTION" | "INPUT" | "FEEDBACK" | "RESULTS" | "ERROR";

/** An option in a multiple-choice quiz question */
export interface QuizOption {
  glyph: string;
  meaning: string;
  id: string;
}

/** A single question within a strategy-based quiz session */
export interface QuizQuestion {
  id: string;
  audioKey: string; // e.g., "bā" — for TTS
  correctPinyin: string; // pinyin without tone marks for comparison (or correct option ID for MC)
  correctTone: number; // 0-4 (0=neutral)
  category: string; // e.g., "pinyin" | "tones" | "pairs" | "rules" | "ime" | "radical-core-lockdown" | "radical-predictor"
  displayPinyin?: string; // pinyin WITH tone marks
  character?: string | null; // Chinese character for TTS (e.g., "八")
  meaning?: string | null; // English meaning of the character
  options?: QuizOption[]; // Multiple-choice options (for radical strategies)
  prompt?: string; // Custom prompt text (for radical predictor questions)
}

/** Result of evaluating a user's answer */
export interface AnswerResult {
  correct: boolean;
  userPinyin: string;
  userTone: number;
  correctPinyin: string;
  correctTone: number;
  feedback: string;
  toneDescription: string;
}

/**
 * Quiz strategy runtime configuration fetched from backend.
 * Backend is the source of truth; strategies no longer carry these values.
 */
export interface QuizStrategyConfig {
  type: string;
  questionCount: number;
  passThreshold: number;
  timeLimitMinutes: number;
  tierRules: Record<string, { passThreshold: number }> | null;
}

/**
 * QuizStrategy interface
 * All quiz modes implement this contract to define their
 * question generation, answer evaluation, and feedback logic.
 * Numeric config (questionCount, passThreshold, timeLimitMinutes)
 * is fetched at runtime from the backend — see QuizStrategyConfig.
 */
export interface QuizStrategy {
  /** Unique identifier for this strategy */
  readonly type: StrategyType;

  /** Human-readable label */
  readonly label: string;

  /** Icon/emoji for display */
  readonly icon: string;

  /** Phase level number */
  readonly phase: number;

  /** Generate questions for a session */
  generateQuestions(count?: number): Promise<QuizQuestion[]>;

  /** Evaluate a user's answer and return feedback */
  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult;
}
