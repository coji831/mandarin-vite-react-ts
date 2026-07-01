/**
 * reviewStrategyRegistry.ts
 * Review strategy registry
 *
 * Maps item type strings to their strategy implementations.
 */

import type { ReviewStrategy } from "../types";
import { pinyinReviewStrategy } from "./PinyinReviewStrategy";
import { toneReviewStrategy } from "./ToneReviewStrategy";
import { radicalMeaningReviewStrategy } from "./RadicalMeaningReviewStrategy";
import { characterRadicalReviewStrategy } from "./CharacterRadicalReviewStrategy";

export const REVIEW_STRATEGIES: Record<string, ReviewStrategy> = {
  "pinyin-syllable": pinyinReviewStrategy,
  "tone-syllable": toneReviewStrategy,
  radical: radicalMeaningReviewStrategy,
  "character-radical": characterRadicalReviewStrategy,
};

/** Look up a review strategy by item type */
export function getReviewStrategy(itemType: string): ReviewStrategy | undefined {
  return REVIEW_STRATEGIES[itemType];
}
