import { listsReducer, listsInitialState, ListsAction } from "./listsReducer";
import { userReducer, userInitialState, UserAction } from "./userReducer";
import { uiReducer, uiInitialState, UiAction } from "./uiReducer";
import type { ProgressState } from "../types/ProgressNormalized";

export type ProgressAction = ListsAction | UserAction | UiAction;

// New RootState composes the lists (progress) slice with the user and ui slices.
export interface RootState {
  lists: ProgressState;
  user: typeof userInitialState;
  ui: typeof uiInitialState;
}

export const initialState: RootState = {
  lists: listsInitialState,
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: ProgressAction): RootState {
  return {
    lists: listsReducer(state.lists as any, action as any),
    user: userReducer(state.user as any, action as any),
    ui: uiReducer(state.ui as any, action as any),
  };
}

// Keep a backwards-compatible alias that matches previous `progressReducer` export
export const progressReducer = ((s: any, a: any) => rootReducer(s, a)) as typeof rootReducer;

// Export sub-reducers for targeted unit tests and future composition
export { listsReducer, listsInitialState };
export { userReducer, userInitialState };
export { uiReducer, uiInitialState };
