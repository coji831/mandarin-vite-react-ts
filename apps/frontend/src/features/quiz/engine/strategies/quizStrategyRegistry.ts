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
import { clozeStrategy } from "./ClozeStrategy";
import { imeQuizStrategy } from "./IMEQuizStrategy";
import { listeningDictationStrategy } from "./ListeningDictationStrategy";
import { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";
import { sentenceBuildingStrategy } from "./SentenceBuildingStrategy";
import { toneJudgmentStrategy } from "./ToneJudgmentStrategy";

/**
 * Every registered strategy, keyed by its `?type=` id. A strategy present here is
 * what turns `?type=<id>` into a session; an id missing from this map falls back
 * to the empty entry surface with no error (the silent-fallback trap, §26.4.4).
 */
export const QUIZ_STRATEGIES: Record<string, QuizStrategy> = {
  "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
  "ime-simulator": imeQuizStrategy,
  "radical-gate": radicalGateQuizStrategy,
  // Epic 26 practice formats (§26.4.1) — ids must match the backend registry.
  cloze: clozeStrategy,
  "sentence-building": sentenceBuildingStrategy,
  "listening-dictation": listeningDictationStrategy,
  "tone-judgment": toneJudgmentStrategy,
};

/** Look up a strategy by type string */
export function getStrategy(type: string): QuizStrategy | undefined {
  return QUIZ_STRATEGIES[type];
}
