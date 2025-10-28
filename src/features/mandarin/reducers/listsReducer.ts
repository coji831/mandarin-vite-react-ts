/**
 * listsReducer.ts
 *
 * Responsible for the canonical progress shape that consumers expect:
 * - wordsById: Record<WordId, WordEntity>
 * - wordIds: WordId[]
 *
 * This file is a focused replacement for the previous monolithic `progressReducer`.
 * Automation: see docs/automation/ai-file-operations.md and docs/automation/automation-protocol.md
 */
import { ProgressState, WordEntity } from "../types";

export const listsInitialState: ProgressState = { wordsById: {}, wordIds: [] };

export type ListsAction =
  | { type: "INIT" }
  | { type: "RESET" }
  | { type: "MARK_WORD_LEARNED"; payload: { id: string; when: string } };

export function listsReducer(
  state: ProgressState = listsInitialState,
  action: ListsAction
): ProgressState {
  switch (action.type) {
    case "INIT":
      return state;
    case "RESET":
      return listsInitialState;
    case "MARK_WORD_LEARNED": {
      const { id, when } = action.payload;
      const entity: WordEntity | undefined = state.wordsById[id];
      if (!entity) return state;
      return {
        ...state,
        wordsById: { ...state.wordsById, [id]: { ...entity, learnedAt: when } },
      };
    }
    default:
      return state;
  }
}
