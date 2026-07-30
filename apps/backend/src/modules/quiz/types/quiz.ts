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
 */
export type QuizAttemptType =
  "audio-to-pinyin-tone" | "ime-simulator" | "radical-gate" | "comprehension" | "qualification";
