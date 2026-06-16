/**
 * uiStore.prelude.ts
 *
 * DEPRECATED: Will be removed in Story 17.6.
 * Use uiStore.ts (Zustand) instead.
 */
export type UiState = {
  isLoading: boolean;
  lastUpdated: string | null;
  selectedList: string | null;
  selectedWords: unknown[];
  error: string | undefined;
  initialized: boolean;
};

export const uiInitialState: UiState = {
  isLoading: false,
  lastUpdated: null,
  selectedList: null,
  selectedWords: [],
  error: undefined,
  initialized: false,
};

export type UiAction =
  | { type: "UI/SET_LOADING"; payload: { isLoading: boolean } }
  | { type: "UI/SET_UPDATED"; payload: { when: string } }
  | { type: "UI/SET_SELECTED_LIST"; payload: { listId: string | null } }
  | { type: "UI/SET_SELECTED_WORDS"; payload: { words: unknown[] } }
  | { type: "UI/SET_ERROR"; payload: { error?: string } }
  | { type: "UI/SET_INITIALIZED"; payload: { initialized: boolean } };

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
      return { ...state, error: action.payload.error };
    case "UI/SET_INITIALIZED":
      return { ...state, initialized: action.payload.initialized };
    default:
      return state;
  }
}
