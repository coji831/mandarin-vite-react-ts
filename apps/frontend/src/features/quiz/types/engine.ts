/**
 * engine.ts
 * Phase 1 Gate Quiz — Strategy pattern types for quiz engine
 *
 * Defines the QuizStrategy interface and related types used by
 * the strategy-based quiz engine to support multiple quiz modes.
 */

/** Supported quiz strategy types */
export type StrategyType = "audio-to-type";

/** Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS */
export type QuizPhase = "LOADING" | "QUESTION" | "INPUT" | "FEEDBACK" | "RESULTS" | "ERROR";

/** A single question within a strategy-based quiz session */
export interface QuizQuestion {
  id: string;
  audioKey: string; // e.g., "bā" — for TTS
  correctPinyin: string; // pinyin without tone marks for comparison
  correctTone: number; // 0-4 (0=neutral)
  category: "pinyin" | "tones" | "pairs" | "rules";
  displayPinyin?: string; // pinyin WITH tone marks
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
 * QuizStrategy interface
 * All quiz modes implement this contract to define their
 * question generation, answer evaluation, and feedback logic.
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

  /** Number of questions per session */
  readonly questionCount: number;

  /** Pass threshold (0-1, e.g. 0.9 for 90%) */
  readonly passThreshold: number;

  /** Time limit in minutes */
  readonly timeLimitMinutes: number;

  /** Generate questions for a session */
  generateQuestions(): Promise<QuizQuestion[]>;

  /** Evaluate a user's answer and return feedback */
  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult;
}
