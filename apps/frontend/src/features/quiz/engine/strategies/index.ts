/**
 * strategies/index.ts
 * Phase 1 Gate Quiz — Strategy registry
 *
 * Maps strategy type strings to their implementations.
 * New strategies register here to be discoverable by the quiz engine.
 */

import type { QuizStrategy } from "../../types";
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy";
import { imeQuizStrategy } from "./IMEQuizStrategy";
import { radicalSplitterStrategy } from "./RadicalSplitterStrategy";
import { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";

export { imeQuizStrategy } from "./IMEQuizStrategy";
export { radicalSplitterStrategy } from "./RadicalSplitterStrategy";
export { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";

export const QUIZ_STRATEGIES: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
  "ime-simulator": imeQuizStrategy,
  "radical-splitter": radicalSplitterStrategy,
  "radical-gate": radicalGateQuizStrategy,
};

/** Look up a strategy by type string */
export function getStrategy(type: string): QuizStrategy | undefined {
  return QUIZ_STRATEGIES[type];
}
