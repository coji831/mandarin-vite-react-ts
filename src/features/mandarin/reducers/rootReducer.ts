import { ProgressState } from "../types";
import { ListsAction, listsInitialState, listsReducer } from "./listsReducer";
import { UiAction, uiInitialState, uiReducer, UiState } from "./uiReducer";
import { UserAction, userInitialState, userReducer, UserState } from "./userReducer";

export type ProgressAction = ListsAction | UserAction | UiAction;

// New RootState composes the lists (progress) slice with the user and ui slices.
export interface RootState {
  lists: ProgressState;
  user: UserState;
  ui: UiState;
}

export const initialState: RootState = {
  lists: listsInitialState,
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: ProgressAction): RootState {
  return {
    lists: listsReducer(state.lists, action as ListsAction),
    user: userReducer(state.user, action as UserAction),
    ui: uiReducer(state.ui, action as UiAction),
  };
}

// Keep a backwards-compatible alias that matches previous `progressReducer` export
export const progressReducer = ((s: RootState | undefined, a: ProgressAction) =>
  rootReducer(s || initialState, a)) as typeof rootReducer;

// Export sub-reducers for targeted unit tests and future composition
export {
  listsInitialState,
  listsReducer,
  uiInitialState,
  uiReducer,
  userInitialState,
  userReducer,
};
