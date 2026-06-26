/**
 * RadicalReviewStrategy
 * For radical items: user sees glyph → types pinyin name → result + rating.
 * No tone selection step — radicals don't have tone numbers to test.
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";

export const radicalReviewStrategy: ReviewStrategy = {
  itemType: "radical",
  initialStep: "pinyin",
  feedbackLabel: "Radical",
  showMeaning: false,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "pinyin") return { correct: false };
    const expected = (item.pinyinPlain || "").toLowerCase();
    return { correct: expected.length > 0 && input.value === expected };
  },
};
