/**
 * ToneReviewStrategy
 * For tone-syllable items: user selects tone → result.
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";

export const toneReviewStrategy: ReviewStrategy = {
  itemType: "tone-syllable",
  initialStep: "tone",
  feedbackLabel: "Tone",
  showMeaning: true,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    if (input.type !== "tone") return { correct: false };
    // If correctTone is undefined, no penalty (item doesn't have tone data)
    return { correct: item.correctTone === undefined || input.value === item.correctTone };
  },
};
