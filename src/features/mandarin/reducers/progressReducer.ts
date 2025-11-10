/**
 * progressReducer.ts
 *
 * Responsible for the canonical progress shape that consumers expect:
 * - wordsById: Record<WordId, WordProgress>
 * - wordIds: WordId[]
 *
 * This file is a focused replacement for the previous monolithic `progressReducer`.
 * Automation: see docs/automation/ai-file-operations.md and docs/automation/automation-protocol.md
 */
import { ProgressState, WordProgress } from "../types";

export const progressInitialState: ProgressState = { wordsById: {}, wordIds: [] };

export type ProgressAction =
  | { type: "INIT" }
  | { type: "RESET" }
  | { type: "MARK_WORD_LEARNED"; payload: { id: string; when: string } };

export function progressReducer(
  state: ProgressState = progressInitialState,
  action: ProgressAction
): ProgressState {
  switch (action.type) {
    case "INIT":
      return state;
    case "RESET":
      return progressInitialState;
    case "MARK_WORD_LEARNED": {
      const { id, when } = action.payload;
      const currentWordProgress: WordProgress | undefined = state.wordsById[id];
      if (!currentWordProgress) return state;
      return {
        ...state,
        wordsById: { ...state.wordsById, [id]: { ...currentWordProgress, learnedAt: when } },
      };
    }
    default:
      return state;
  }
}
