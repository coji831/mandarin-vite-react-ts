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
 */

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { initialState, quizReducer, QuizPhase } from "../reducers/quizReducer";
import { QuizQuestion, QuizAnswer, QuizSessionSummary } from "../types";
import { useAnswerSubmission } from "../hooks/useAnswerSubmission";
import { useQuizSession } from "../hooks/useQuizSession";
import { useSessionSummary } from "../hooks/useSessionSummary";

// ============================================================================
// Context Types
// ============================================================================

interface QuizStateContext {
  // Core quiz state
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string;
  sessionId: string | null;

  // Derived state
  currentQuestion: QuizQuestion | null;

  // UI state (from reducer)
  answerValue: string;
  showHint: boolean;

  // AI feedback state (from reducer)
  aiFeedback: string | null;

  // Session summary (backend-calculated metrics)
  sessionSummary: QuizSessionSummary | null;
  summaryLoading: boolean;
  expiresAt: string | null;
  isFreshCompletion: boolean;
}

interface QuizActionsContext {
  // Answer handlers
  handleAnswer: (userAnswer: string) => Promise<void>;
  handleSubmitAnswer: () => void;
  handleNext: () => void;
  handleRetry: () => void;

  // UI actions
  setAnswerValue: (value: string) => void;
  toggleHint: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const QuizStateCtx = createContext<QuizStateContext | undefined>(undefined);
const QuizActionsCtx = createContext<QuizActionsContext | undefined>(undefined);

// ============================================================================
// Custom Hooks
// ============================================================================

export function useQuizState(): QuizStateContext {
  const context = useContext(QuizStateCtx);
  if (!context) {
    throw new Error("useQuizState must be used within QuizProvider");
  }
  return context;
}

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

interface QuizProviderProps {
  children: ReactNode;
}

export function QuizProvider({ children }: QuizProviderProps) {
  // Core state (reducer) - now includes UI state
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Refs
  const questionStartTime = useRef<number>(0);

  // Derived state (computed once for hooks)
  const currentQuestion =
    state.questions.length > 0 && state.currentIndex < state.questions.length
      ? state.questions[state.currentIndex]
      : null;

  // Answer submission hook (Story 15.11 Part B Phase 4)
  const { submitAnswer } = useAnswerSubmission({
    sessionId: state.sessionId,
    currentQuestion,
    questionStartTime,
    dispatch,
  });

  // Quiz session hook (Story 15.11 Part B Phase 5)
  const { startSession } = useQuizSession({
    dispatch,
    questionStartTime,
  });

  // ============================================================================
  // Effects
  // ============================================================================

  // Start quiz session on mount (Story 15.11 Part B Phase 5: delegated to useQuizSession hook)
  // Ref guard prevents double-invocation in React 18 StrictMode (mount → unmount → remount)
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    startSession();
  }, [startSession]);

  // Story 15.11: Fetch session summary from backend when quiz completes
  // Backend provides pre-calculated metrics (accuracy, XP, leech detection)
  // Fetch summary when all questions are answered (phase returns to LOADING after last Next)
  const { quizSessionSummary, isSummaryLoading } = useSessionSummary(
    state.phase === "LOADING" && state.sessionId && state.questions.length > 0
      ? state.sessionId
      : null,
    true,
  );

  // Transition to RESULTS once summary is ready
  useEffect(() => {
    if (state.phase === "LOADING" && !isSummaryLoading && quizSessionSummary) {
      dispatch({ type: "QUIZ/COMPLETE" });
    }
  }, [state.phase, isSummaryLoading, quizSessionSummary]);

  // ============================================================================
  // Actions
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

  // Story 15.11 Part B Phase 4: Delegate to useAnswerSubmission hook
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
  // Context Values
  // ============================================================================

  const stateValue: QuizStateContext = {
    phase: state.phase,
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: state.answers,
    error: state.error,
    sessionId: state.sessionId,
    currentQuestion,
    answerValue: state.answerValue,
    showHint: state.showHint,
    aiFeedback: state.aiFeedback,
    sessionSummary: quizSessionSummary ?? state.sessionSummary,
    summaryLoading: isSummaryLoading,
    expiresAt: state.expiresAt,
    isFreshCompletion: state.isFreshCompletion,
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
