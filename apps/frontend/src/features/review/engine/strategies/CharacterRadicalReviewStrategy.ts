/**
 * CharacterRadicalReviewStrategy
 * For character-radical items: user sees character → types radical meaning → result + rating.
 * Adapted from the quiz radical-splitter strategy, now part of Review with SRS tracking.
 * Review items include `options` from the backend; evaluation checks against the
 * correct option's meaning (text input).
 */
import type { ReviewStrategy } from "../types";
import type { ReviewItem } from "../../types/review";

export const characterRadicalReviewStrategy: ReviewStrategy = {
  itemType: "character-radical",
  initialStep: "pinyin",
  feedbackLabel: "Character→Radical",
  showMeaning: true,

  evaluate(item: ReviewItem, input): { correct: boolean } {
    // Support both text input (pinyin) and option-based input
    let userValue: string;
    if (input.type === "option") {
      userValue = input.value.trim().toLowerCase();
    } else if (input.type === "pinyin") {
      userValue = input.value.trim().toLowerCase();
    } else {
      return { correct: false };
    }

    // Find the correct option by matching against the item's correct answer
    // The correct option ID is stored in item.itemId (radical ID for character-radical items)
    const correctOptionId = (item.itemId || "").trim().toLowerCase();
    if (!correctOptionId) {
      // Fall back to meaning comparison if no option ID
      return { correct: false };
    }

    // Find the correct option by its ID
    const correctOption = (item.options || []).find((o) => o.id.toLowerCase() === correctOptionId);
    if (!correctOption) return { correct: false };

    // For option-based input: compare against the correct option ID
    if (input.type === "option") {
      return { correct: userValue === correctOptionId };
    }

    // For text (pinyin) input: user types the radical meaning — compare against the meaning
    const expectedMeaning = correctOption.meaning.trim().toLowerCase();
    return { correct: expectedMeaning.length > 0 && userValue === expectedMeaning };
  },
};
