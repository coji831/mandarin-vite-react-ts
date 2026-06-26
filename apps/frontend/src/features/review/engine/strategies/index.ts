/**
 * Review strategy registry
 * Maps item type strings to their strategy implementations.
 */
import type { ReviewStrategy } from "../types";
import { pinyinReviewStrategy } from "./PinyinReviewStrategy";
import { toneReviewStrategy } from "./ToneReviewStrategy";
import { radicalReviewStrategy } from "./RadicalReviewStrategy";

export const REVIEW_STRATEGIES: Record<string, ReviewStrategy> = {
  "pinyin-syllable": pinyinReviewStrategy,
  "tone-syllable": toneReviewStrategy,
  radical: radicalReviewStrategy,
};

/** Look up a review strategy by item type */
export function getReviewStrategy(itemType: string): ReviewStrategy | undefined {
  return REVIEW_STRATEGIES[itemType];
}
