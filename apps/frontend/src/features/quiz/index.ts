/**
 * Quiz feature barrel export
 * Phase 2 restructure: Added progress contexts, hooks, reducers, services, types, utils from mandarin
 */

// Components
export { ExamLayout, ResultsLayout, ErrorScreen, LoadingScreen } from "./components";
export { QuizProvider, useQuizState, useQuizActions } from "./context";

// Contexts
export { ProgressProvider, ProgressStateContext, ProgressDispatchContext } from "./context";
export { UserIdentityProvider } from "./context";

// Hooks
export {
  useProgressState,
  useProgressActions,
  useProgressDispatch,
  useUserIdentity,
  useQuizSession,
  useAnswerSubmission,
  useSessionSummary,
} from "./hooks";
export type { UseSessionSummaryReturn } from "./hooks";

// Reducers
export { rootReducer, initialState, progressReducer, progressInitialState } from "./reducers";
export type { RootState, RootAction, ProgressAction } from "./reducers";

// Types
export type { UserState, UiState } from "./types";
