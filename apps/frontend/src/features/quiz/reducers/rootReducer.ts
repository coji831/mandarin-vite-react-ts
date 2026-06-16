import { ProgressState, ProgressAction } from "./progressReducer";
import { UiAction, uiInitialState, uiReducer } from "../../../shared/store/uiStore.prelude";
import { UiState } from "../../../shared/store/uiStore.prelude";
import {
  UserAction,
  userInitialState,
  userReducer,
  UserState,
} from "../../../shared/store/userStore.prelude";

export type RootAction = ProgressAction | UserAction | UiAction;

// RootState includes progress for backward compat with existing consumers.
// Story 17.5: Progress is managed by Zustand progressStore but type kept here for compat.
export type RootState = {
  progress: ProgressState;
  user: UserState;
  ui: UiState;
};

export const initialState: RootState = {
  progress: { wordsById: {}, wordIds: [] },
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: RootAction): RootState {
  return {
    progress: state.progress, // Pass through — managed by Zustand
    user: userReducer(state.user, action as UserAction),
    ui: uiReducer(state.ui, action as UiAction),
  };
}

// Export sub-reducers for backward compat
export { uiInitialState, uiReducer, userInitialState, userReducer };
