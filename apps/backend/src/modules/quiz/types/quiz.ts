/**
 * @file apps/backend/src/modules/quiz/types/quiz.ts
 * @description Type definitions for the Quiz module
 */

/**
 * Quiz strategy interface — describes configuration and question generation.
 */
export interface QuizStrategy {
  type: string;
  questionCount: number;
  passThreshold: number;
  timeLimitMinutes?: number;
  tierRules?: Record<string, { passThreshold?: number }>;
  generateQuestions(userId?: string, ...args: unknown[]): Promise<unknown[]>;
}

/**
 * Quiz attempt type values used across the system.
 *
 * `QuizAttempt.quizType` is an unconstrained `String` (schema.prisma) — there
 * is no enum and no migration, so a new format is registered (see
 * `strategies/registry.ts`) and typed here, nothing else.
 *
 * The BACKEND superset below and the FE union
 * (`apps/frontend/src/features/quiz/types/engine.ts` → `StrategyType`) are kept
 * in step by hand; this comment is the ONE place that records both sides:
 *
 *   FE `StrategyType`:  "audio-to-pinyin" | "audio-to-tone"
 *                     | "audio-to-pinyin-tone" | "ime-simulator"
 *                     | "radical-gate" | "cloze" | "sentence-building"
 *                     | "listening-dictation" | "tone-judgment"
 *
 * Deliberate differences (not drift):
 *   - BE-only:  "comprehension" (passage quiz), "qualification" (HSK fallback).
 *   - FE-only:  "audio-to-pinyin", "audio-to-tone" (legacy FE aliases; no BE
 *               strategy and no attempt is ever created with them — the BE
 *               route therefore cannot reject unknown types without breaking
 *               a FE alias, so `quizType` stays a pass-through string).
 *
 * Epic 26 (§26.4.1) added the four practice formats on BOTH sides.
 */
export type QuizAttemptType =
  | "audio-to-pinyin-tone"
  | "ime-simulator"
  | "radical-gate"
  | "comprehension"
  | "qualification"
  // Epic 26 practice formats — answer encoding per §26.4.2.
  | "cloze"
  | "sentence-building"
  | "listening-dictation"
  | "tone-judgment";
