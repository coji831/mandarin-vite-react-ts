/**
 * Quiz feature barrel export
 * Phase 2 restructure: Added progress contexts, hooks, reducers, services, types, utils from mandarin
 * Story 17.6: Removed context and reducer exports (provider cleanup)
 */

// Components
export { ExamLayout, ResultsLayout, ErrorScreen, LoadingScreen } from "./components";

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

// Stores
export { useQuizSessionStore } from "./stores";
export type { QuizSessionState, QuizPhase } from "./stores";

// Types
export type { UserState, UiState } from "./types";
