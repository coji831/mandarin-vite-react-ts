/**
 * @file apps/backend/src/modules/quiz/strategies/registry.ts
 * @description Quiz strategy registry — maps type names to strategy instances.
 */
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy.js";
import { imeSimulatorStrategy } from "./ImeSimulatorStrategy.js";
import { radicalGateStrategy } from "./RadicalGateStrategy.js";
import { comprehensionQuizStrategy } from "./ComprehensionQuizStrategy.js";
import { qualificationQuizStrategy } from "./QualificationQuizStrategy.js";
import type { QuizStrategy } from "../types/quiz.js";

/**
 * Get a registered strategy by type name.
 * @param type - The quiz type identifier
 * @returns The strategy object, or null if not found
 */
export function getStrategy(type: string): QuizStrategy | null {
  const strategies: Record<string, QuizStrategy> = {
    "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
    "ime-simulator": imeSimulatorStrategy,
    "radical-gate": radicalGateStrategy,
    comprehension: comprehensionQuizStrategy,
    qualification: qualificationQuizStrategy,
  };
  return strategies[type] ?? null;
}

/**
 * Get all registered strategy types.
 * @returns Array of registered type names
 */
export function getRegisteredTypes(): string[] {
  return Object.keys({
    "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
    "ime-simulator": imeSimulatorStrategy,
    "radical-gate": radicalGateStrategy,
    comprehension: comprehensionQuizStrategy,
    qualification: qualificationQuizStrategy,
  });
}
