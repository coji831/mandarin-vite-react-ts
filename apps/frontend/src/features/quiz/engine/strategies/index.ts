/**
 * strategies/index.ts
 * Phase 1 Gate Quiz — Strategy registry
 *
 * Maps strategy type strings to their implementations.
 * New strategies register here to be discoverable by the quiz engine.
 */

import type { QuizStrategy } from "../../types";
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy";

export const QUIZ_STRATEGIES: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
};

/** Look up a strategy by type string */
export function getStrategy(type: string): QuizStrategy | undefined {
  return QUIZ_STRATEGIES[type];
}
