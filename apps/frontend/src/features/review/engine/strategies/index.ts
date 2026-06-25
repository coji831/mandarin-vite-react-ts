/**
 * Review strategy registry
 * Maps item type strings to their strategy implementations.
 */
import type { ReviewStrategy } from "../types";
import { pinyinReviewStrategy } from "./PinyinReviewStrategy";
import { toneReviewStrategy } from "./ToneReviewStrategy";

export const REVIEW_STRATEGIES: Record<string, ReviewStrategy> = {
  "pinyin-syllable": pinyinReviewStrategy,
  "tone-syllable": toneReviewStrategy,
};

/** Look up a review strategy by item type */
export function getReviewStrategy(itemType: string): ReviewStrategy | undefined {
  return REVIEW_STRATEGIES[itemType];
}
