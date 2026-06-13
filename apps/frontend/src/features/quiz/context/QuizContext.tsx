/**
 * Quiz Context - Centralized State Management
 * Epic 19: State Refactor
 * Story 15.11 Phase 8: Backend-centric quiz session architecture
 * Story 15.11 Part B: Business logic extraction to hooks and services
 *
 * Provides centralized state management for the entire quiz flow,
 * eliminating props drilling by exposing state and actions through context.
 *
 * Architecture (Part B Refactor):
 * - Pure orchestrator pattern (delegates to hooks and services)
 * - useQuizSession: Session initialization and lifecycle
 * - useAnswerSubmission: Answer submission orchestration
 * - quizTransformers: Data transformation (backend ↔ frontend formats)
 *
 * State includes:
 * - Quiz flow state (phase, questions, currentIndex, answers, sessionId)
 * - UI state (answerValue, showHint, aiFeedback)
 * - Session summary (backend-calculated metrics for results display)
 *
 * Actions include:
 * - handleAnswer: Submit answer to backend session for validation
 * - handleNext: Advance to next question
 * - handleRetry: Reset quiz and start new session
 * - setAnswerValue: Update type input value
 * - toggleHint: Show/hide hint overlay
 *
 * Phase 8 Changes:
 * - Removed business logic (validation, correct answer calculation) - now backend
 * - Replaced loadDueWords() with startQuizSession() - backend generates questions
 * - Replaced handleAnswer() logic with submitAnswer() API call
 * - Consolidated UI state into reducer (answerValue, showHint, aiFeedback, feedbackLoading)
 * - Questions come from backend pre-sanitized (no correct answers exposed)
 *
 * Part B Changes (Clean Architecture):
 * - Reduced from 350 → 246 lines (30% reduction)
 * - Extracted session logic to useQuizSession hook
 * - Extracted answer submission to useAnswerSubmission hook
 * - Extracted transformers to quizTransformers service
 * - AI feedback comes from backend with answer response (synchronous)
 *
 * Phase 3 restructure: Moved from contexts/ (plural) to context/ (singular)
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useAnswerSubmission, useQuizSession, useSessionSummary } from "../hooks";
import { initialState, QuizPhase, quizReducer } from "../reducers/quizReducer";
import { QuizAnswer, QuizQuestion, QuizSessionSummary } from "../types";

// ============================================================================
// Context Types
// ============================================================================

type QuizStateContext = {
  // Core quiz state
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string;
  sessionId?: string;

  // Derived state
  currentQuestion?: QuizQuestion;

  // UI state (from reducer)
  answerValue: string;
  showHint: boolean;

  // AI feedback state (from reducer)
  aiFeedback?: string;

  // Session summary (backend-calculated metrics)
  quizSessionSummary?: QuizSessionSummary;
  isSummaryLoading: boolean;
  expiresAt?: string;
  isFreshCompletion: boolean;
};

type QuizActionsContext = {
  // Answer handlers
  handleAnswer: (userAnswer: string) => Promise<void>;
  handleSubmitAnswer: () => void;
  handleNext: () => void;
  handleRetry: () => void;

  // UI actions
  setAnswerValue: (value: string) => void;
  toggleHint: () => void;
};

// ============================================================================
// Context Creation
// ============================================================================

const QuizStateCtx = createContext<QuizStateContext | undefined>(undefined);
const QuizActionsCtx = createContext<QuizActionsContext | undefined>(undefined);

// ============================================================================
// Custom Hooks
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useQuizState(): QuizStateContext {
  const context = useContext(QuizStateCtx);
  if (!context) {
    throw new Error("useQuizState must be used within QuizProvider");
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuizActions(): QuizActionsContext {
  const context = useContext(QuizActionsCtx);
  if (!context) {
    throw new Error("useQuizActions must be used within QuizProvider");
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

type QuizProviderProps = {
  children: ReactNode;
};

export function QuizProvider({ children }: QuizProviderProps) {
  // ============================================================================
  // Refs
  // ============================================================================

  const questionStartTime = useRef<number>(0);
  // Ref guard prevents double-invocation in React 18 StrictMode (mount → unmount → remount)
  const sessionStarted = useRef(false);

  // ============================================================================
  // State
  // ============================================================================

  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Derived value — computed here because useAnswerSubmission depends on it
  const currentQuestion =
    state.questions.length > 0 && state.currentIndex < state.questions.length
      ? state.questions[state.currentIndex]
      : undefined;

  // ============================================================================
  // Custom Hooks
  // ============================================================================

  const { submitAnswer } = useAnswerSubmission({
    sessionId: state.sessionId,
    currentQuestion,
    questionStartTime,
    dispatch,
  });

  const { startSession } = useQuizSession({
    dispatch,
    questionStartTime,
  });

  // Unified path: both fresh completion and already-completed resume fetch summary the same way
  const { quizSessionSummary, isSummaryLoading } = useSessionSummary(
    state.phase === "RESULTS" && state.sessionId ? state.sessionId : null,
    true,
  );

  // ============================================================================
  // Callbacks
  // ============================================================================

  const handleNext = useCallback(() => {
    dispatch({ type: "QUIZ/NEXT_QUESTION" });
    questionStartTime.current = Date.now();
  }, []);

  const handleRetry = useCallback(() => {
    sessionStarted.current = false;
    dispatch({ type: "QUIZ/RESET" });
    startSession();
  }, [startSession]);

  const handleAnswer = useCallback(
    async (userAnswer: string) => {
      await submitAnswer(userAnswer);
    },
    [submitAnswer],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (state.answerValue.trim().length === 0) return;
    submitAnswer(state.answerValue.trim().toLowerCase());
    dispatch({ type: "QUIZ/SET_ANSWER_VALUE", value: "" });
  }, [state.answerValue, submitAnswer]);

  const setAnswerValue = useCallback((value: string) => {
    dispatch({ type: "QUIZ/SET_ANSWER_VALUE", value });
  }, []);

  const toggleHint = useCallback(() => {
    dispatch({ type: "QUIZ/SET_SHOW_HINT", show: !state.showHint });
  }, [state.showHint]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Start quiz session on mount
  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    startSession();
  }, [startSession]);

  // Immediately transition LOADING → RESULTS once all questions are answered
  // Summary fetches independently in the RESULTS phase via useSessionSummary above
  useEffect(() => {
    if (state.phase === "LOADING" && state.sessionId && state.questions.length > 0) {
      dispatch({ type: "QUIZ/COMPLETE" });
    }
  }, [state.phase, state.sessionId, state.questions.length]);

  // ============================================================================
  // Context Values (local calculations — assembled last)
  // ============================================================================

  const stateValue: QuizStateContext = {
    ...state,
    currentQuestion,
    quizSessionSummary,
    isSummaryLoading,
  };

  const actionsValue: QuizActionsContext = {
    handleAnswer,
    handleSubmitAnswer,
    handleNext,
    handleRetry,
    setAnswerValue,
    toggleHint,
  };

  return (
    <QuizStateCtx.Provider value={stateValue}>
      <QuizActionsCtx.Provider value={actionsValue}>{children}</QuizActionsCtx.Provider>
    </QuizStateCtx.Provider>
  );
}
