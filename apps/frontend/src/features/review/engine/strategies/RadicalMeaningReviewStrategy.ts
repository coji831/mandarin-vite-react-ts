/**
 * RadicalMeaningReviewStrategy
 * For radical items: user sees glyph → selects English meaning from options → result + rating.
 * No tone selection step — radicals don't have tone numbers to test.
 * Replaces the old RadicalReviewStrategy which tested pinyin name recall.
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";

export const radicalMeaningReviewStrategy: ReviewStrategy = {
  itemType: "radical",
  initialStep: "option",
  feedbackLabel: "Radical",
  showMeaning: true,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "option") return { correct: false };
    const expected = (item.pinyinPlain || "").trim().toLowerCase();
    const userValue = (input.value || "").trim().toLowerCase();
    return { correct: expected.length > 0 && userValue === expected };
  },
};
