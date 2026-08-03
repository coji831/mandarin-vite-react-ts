/**
 * PinyinReviewStrategy
 * For pinyin-syllable items: user types pinyin → result.
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";
import { normalizePinyinForComparison } from "@mandarin/shared-utils";

export const pinyinReviewStrategy: ReviewStrategy = {
  itemType: "pinyin-syllable",
  initialStep: "pinyin",
  feedbackLabel: "Pinyin",
  showMeaning: true,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "pinyin") return { correct: false };
    // Grading parity: canonical compare strips tone marks + trailing digits so
    // "ba1" / "bā" / "ba" all match. Phase 3: prefer plainPinyin, keep pinyinPlain back-compat.
    const expected = item.plainPinyin ?? item.pinyinPlain ?? item.front ?? "";
    const expectedNorm = normalizePinyinForComparison(expected);
    return {
      correct:
        expectedNorm.length > 0 && normalizePinyinForComparison(input.value) === expectedNorm,
    };
  },
};
