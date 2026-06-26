/**
 * ReviewStrategy interface
 * Each review item type gets its own strategy defining:
 * - Which step to start on
 * - How to evaluate user input
 * - The feedback label for results display
 */

import type { ReviewItem } from "../types/review";

export type ReviewInput = { type: "pinyin"; value: string } | { type: "tone"; value: number };

export interface ReviewEvaluation {
  correct: boolean;
}

export interface ReviewStrategy {
  /** The item type this strategy handles (e.g., "pinyin-syllable") */
  itemType: string;
  /** The initial review step for this type ("pinyin" or "tone") */
  initialStep: "pinyin" | "tone";
  /** Label shown in result feedback (e.g., "Pinyin" or "Tone") */
  feedbackLabel: string;
  /** Whether to show the item's meaning during the review input step */
  showMeaning: boolean;
  /** Evaluate the user's input against the review item */
  evaluate(item: ReviewItem, input: ReviewInput): ReviewEvaluation;
}
