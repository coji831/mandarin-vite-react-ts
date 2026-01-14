/**
 * uiReducer.ts
 *
 * Small reducer for UI flags related to progress (loading states, timestamps).
 * Automation: see docs/automation/ai-file-operations.md
 */

import { UiState, WordBasic } from "../types";

export const uiInitialState: UiState = {
  isLoading: false,
  lastUpdated: null,
  selectedList: null,
  selectedWords: [],
  error: "",
};

export type UiAction =
  | { type: "UI/SET_LOADING"; payload: { isLoading: boolean } }
  | { type: "UI/SET_UPDATED"; payload: { when: string } }
  | { type: "UI/SET_SELECTED_LIST"; payload: { listId: string | null } }
  | { type: "UI/SET_SELECTED_WORDS"; payload: { words: WordBasic[] } }
  | { type: "UI/SET_ERROR"; payload: { error?: string } };

export function uiReducer(state: UiState = uiInitialState, action: UiAction): UiState {
  switch (action.type) {
    case "UI/SET_LOADING":
      return { ...state, isLoading: action.payload.isLoading };
    case "UI/SET_UPDATED":
      return { ...state, lastUpdated: action.payload.when };
    case "UI/SET_SELECTED_LIST":
      return { ...state, selectedList: action.payload.listId };
    case "UI/SET_SELECTED_WORDS":
      return { ...state, selectedWords: action.payload.words };
    case "UI/SET_ERROR":
      return { ...state, error: action.payload.error ?? "" };
    default:
      return state;
  }
}
