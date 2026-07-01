/**
 * quizStrategyRegistry.ts
 * Phase 1 Gate Quiz — Strategy registry
 *
 * Maps strategy type strings to their implementations.
 * New strategies register here to be discoverable by the quiz engine.
 *
 * Note: radical-splitter moved to Review system as CharacterRadicalReviewStrategy.
 */

import type { QuizStrategy } from "../../types";
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy";
import { imeQuizStrategy } from "./IMEQuizStrategy";
import { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";

export const QUIZ_STRATEGIES: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
  "ime-simulator": imeQuizStrategy,
  "radical-gate": radicalGateQuizStrategy,
};

/** Look up a strategy by type string */
export function getStrategy(type: string): QuizStrategy | undefined {
  return QUIZ_STRATEGIES[type];
}
