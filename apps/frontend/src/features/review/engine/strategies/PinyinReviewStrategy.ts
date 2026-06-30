/**
 * PinyinReviewStrategy
 * For pinyin-syllable items: user types pinyin → result.
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";

export const pinyinReviewStrategy: ReviewStrategy = {
  itemType: "pinyin-syllable",
  initialStep: "pinyin",
  feedbackLabel: "Pinyin",
  showMeaning: true,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "pinyin") return { correct: false };
    const expected = (item.pinyinPlain || item.front || "").toLowerCase();
    return { correct: expected.length > 0 && input.value === expected };
  },
};
