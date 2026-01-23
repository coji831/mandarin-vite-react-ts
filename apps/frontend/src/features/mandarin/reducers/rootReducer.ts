import { ListState, ProgressState, UiState } from "../types/";
import { ListAction, listsInitialState, listsReducer } from "./listReducer";
import { ProgressAction, progressInitialState, progressReducer } from "./progressReducer";
import { UiAction, uiInitialState, uiReducer } from "./uiReducer";
import { UserAction, userInitialState, userReducer, UserState } from "./userReducer";

export type RootAction = ListAction | ProgressAction | UserAction | UiAction;

// New RootState composes the lists (progress) slice with the user and ui slices.
export type RootState = {
  vocabLists: ListState;
  progress: ProgressState;
  user: UserState;
  ui: UiState;
};

export const initialState: RootState = {
  vocabLists: listsInitialState,
  progress: progressInitialState,
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: RootAction): RootState {
  return {
    vocabLists: listsReducer(state.vocabLists, action as ListAction),
    progress: progressReducer(state.progress, action as ProgressAction),
    user: userReducer(state.user, action as UserAction),
    ui: uiReducer(state.ui, action as UiAction),
  };
}

// Export sub-reducers for targeted unit tests and future composition
export {
  listsInitialState,
  listsReducer,
  progressInitialState,
  progressReducer,
  uiInitialState,
  uiReducer,
  userInitialState,
  userReducer,
};
