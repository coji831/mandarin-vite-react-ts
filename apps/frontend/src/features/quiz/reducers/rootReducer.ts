import { ProgressAction, progressInitialState, progressReducer } from "./progressReducer";
import { ProgressState } from "../types";
import { UiAction, uiInitialState, uiReducer } from "../../../shared/store/uiStore.prelude";
import { UiState } from "../../../shared/store/uiStore.prelude";
import {
  UserAction,
  userInitialState,
  userReducer,
  UserState,
} from "../../../shared/store/userStore.prelude";

export type RootAction = ProgressAction | UserAction | UiAction;

// RootState composes the progress, user, and ui slices.
// Story 17.1: Removed vocabLists (moved to vocabulary feature).
export type RootState = {
  progress: ProgressState;
  user: UserState;
  ui: UiState;
};

export const initialState: RootState = {
  progress: progressInitialState,
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: RootAction): RootState {
  return {
    progress: progressReducer(state.progress, action as ProgressAction),
    user: userReducer(state.user, action as UserAction),
    ui: uiReducer(state.ui, action as UiAction),
  };
}

// Export sub-reducers for targeted unit tests and future composition
export {
  progressInitialState,
  progressReducer,
  uiInitialState,
  uiReducer,
  userInitialState,
  userReducer,
};
