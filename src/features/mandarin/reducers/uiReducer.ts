/**
 * uiReducer.ts
 *
 * Small reducer for UI flags related to progress (loading states, timestamps).
 * Automation: see docs/automation/ai-file-operations.md
 */
export interface UiState {
  isLoading: boolean;
  lastUpdated?: string | null;
}

export const uiInitialState: UiState = { isLoading: false, lastUpdated: null };

export type UiAction =
  | { type: "UI/SET_LOADING"; payload: { isLoading: boolean } }
  | { type: "UI/SET_UPDATED"; payload: { when: string } };

export function uiReducer(state: UiState = uiInitialState, action: UiAction): UiState {
  switch (action.type) {
    case "UI/SET_LOADING":
      return { ...state, isLoading: action.payload.isLoading };
    case "UI/SET_UPDATED":
      return { ...state, lastUpdated: action.payload.when };
    default:
      return state;
  }
}
