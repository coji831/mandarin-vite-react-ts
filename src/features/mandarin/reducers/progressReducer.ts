/**
 * progressReducer.ts
 *
 * Minimal reducer skeleton for the Mandarin "Progress" domain (Epic 9 - Story 9.1).
 * - Exports `initialState` so the provider (Story 9.2) can import a deterministic initial value.
 * - Keep the implementation minimal and consumer-compatible; avoid consumer-facing API changes.
 * - Testing is intentionally omitted from the implementation docs per project guidance.
 */

import type { ProgressState, WordEntity } from "../types/ProgressNormalized";

export const initialState: ProgressState = { wordsById: {}, wordIds: [] };

export type Action =
  | { type: "INIT" }
  | { type: "RESET" }
  | { type: "MARK_WORD_LEARNED"; payload: { id: string; when: string } };

export function progressReducer(
  state: ProgressState = initialState,
  action: Action
): ProgressState {
  switch (action.type) {
    case "INIT":
      return state;
    case "RESET":
      return initialState;
    case "MARK_WORD_LEARNED": {
      const { id, when } = action.payload;
      const entity = state.wordsById[id];
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
