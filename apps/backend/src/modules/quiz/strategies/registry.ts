/**
 * @file apps/backend/src/modules/quiz/strategies/registry.ts
 * @description Quiz strategy registry — maps type names to strategy instances.
 *
 * ONE registry literal. `getStrategy` and `getRegisteredTypes` both read
 * `STRATEGY_MAP`, so a format cannot be registered for lookup but missing from
 * the config list (or vice versa). Epic 26 (§26.4.1) adds the four practice
 * formats here and on the FE registry; the three literals that must stay in
 * step are listed in `../types/quiz.ts`.
 */
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy.js";
import { imeSimulatorStrategy } from "./ImeSimulatorStrategy.js";
import { radicalGateStrategy } from "./RadicalGateStrategy.js";
import { comprehensionQuizStrategy } from "./ComprehensionQuizStrategy.js";
import { qualificationQuizStrategy } from "./QualificationQuizStrategy.js";
import { clozeStrategy } from "./ClozeStrategy.js";
import { sentenceBuildingStrategy } from "./SentenceBuildingStrategy.js";
import { listeningDictationStrategy } from "./ListeningDictationStrategy.js";
import { toneJudgmentStrategy } from "./ToneJudgmentStrategy.js";
import type { QuizStrategy } from "../types/quiz.js";

/** The single source of registered quiz types (insertion order = config order). */
const STRATEGY_MAP: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
  "ime-simulator": imeSimulatorStrategy,
  "radical-gate": radicalGateStrategy,
  comprehension: comprehensionQuizStrategy,
  qualification: qualificationQuizStrategy,
  cloze: clozeStrategy,
  "sentence-building": sentenceBuildingStrategy,
  "listening-dictation": listeningDictationStrategy,
  "tone-judgment": toneJudgmentStrategy,
};

/**
 * Get a registered strategy by type name.
 * @param type - The quiz type identifier
 * @returns The strategy object, or null if not found
 */
export function getStrategy(type: string): QuizStrategy | null {
  return STRATEGY_MAP[type] ?? null;
}

/**
 * Get all registered strategy types.
 * @returns Array of registered type names
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(STRATEGY_MAP);
}
