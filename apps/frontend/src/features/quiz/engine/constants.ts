/**
 * engine/constants.ts — values shared by more than one strategy or surface.
 */

import type { StrategyType } from "../types";

/**
 * Tone descriptions for feedback display.
 * Shared across quiz strategies.
 */
export const TONE_DESCRIPTIONS: Record<number, string> = {
  1: "high level",
  2: "rising",
  3: "low dipping",
  4: "falling",
  0: "neutral",
};

/**
 * Single-select formats — the question is answered by choosing ONE option.
 *
 * Declared ONCE (Epic 26 §26.3.1): this set used to be duplicated as
 * `MULTIPLE_CHOICE_STRATEGIES` in `QuizRouter` and `FeedbackView`, which with the
 * four new formats would have silently routed a cloze or tone-judgment question
 * through the pinyin `QuestionView` (audio + typed pinyin) instead of its own
 * option surface.
 */
export const SELECT_ONE_STRATEGIES: ReadonlySet<StrategyType> = new Set<StrategyType>([
  "radical-gate",
  "cloze",
  "tone-judgment",
]);

/**
 * Formats whose strategy authors the announcement sentence itself.
 *
 * The tone/option formats read a verdict from a tone number ("Correct. Tone 2."),
 * but an Epic 26 practice answer is a token, an ordered sentence or a typed
 * transcription — so the strategy writes the whole sentence into
 * `AnswerResult.feedback` and the store announces that, unsplit.
 */
export const AUTHORED_ANNOUNCEMENT_STRATEGIES: ReadonlySet<StrategyType> = new Set<StrategyType>([
  "cloze",
  "sentence-building",
  "listening-dictation",
  "tone-judgment",
]);
