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
 * - useGamificationCapture: Reward processing (XP, badges, mystery box)
 * - quizTransformers: Data transformation (backend ↔ frontend formats)
 *
 * State includes:
 * - Quiz flow state (phase, questions, currentIndex, answers, sessionId)
 * - UI state (answerValue, showHint, aiFeedback, feedbackLoading)
 * - Gamification data (totalXP, mysteryBox, newBadges, freezeAwarded)
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
 * - Extracted gamification to useGamificationCapture hook
 * - Extracted transformers to quizTransformers service
 * - Removed AI feedback orchestration (now backend auto-generates)
 * - AI feedback comes from backend with 3-second timeout built-in
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
import { QuizQuestion, QuizAnswer, MysteryBox, Badge, QuizSessionSummary } from "../types";
import { useGamificationCapture } from "../hooks/useGamificationCapture";
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
  feedbackLoading: boolean;

  // Gamification data
  totalXP: number;
  mysteryBox?: MysteryBox;
  newBadges: Badge[];
  freezeAwarded: boolean;

  // Session summary (backend-calculated metrics)
  sessionSummary: QuizSessionSummary | null;
  expiresAt: string | null;
  noDueWordsMessage?: string;
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

  // Gamification capture hook (Story 15.11 Part B Phase 3)
  // Hook invoked for side effects (captures gamification data in reducer)
  useGamificationCapture(dispatch);

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
  const { summary: sessionSummary } = useSessionSummary(
    state.phase === "COMPLETE" && state.sessionId ? state.sessionId : null,
    true, // autoFetch when sessionId available
  );

  // ============================================================================
  // Actions
  // ============================================================================

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
    questionStartTime.current = Date.now();
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" });
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
    handleAnswer(state.answerValue.trim().toLowerCase());
    dispatch({ type: "SET_ANSWER_VALUE", value: "" });
  }, [state.answerValue, handleAnswer]);

  const setAnswerValue = useCallback((value: string) => {
    dispatch({ type: "SET_ANSWER_VALUE", value });
  }, []);

  const toggleHint = useCallback(() => {
    dispatch({ type: "SET_SHOW_HINT", show: !state.showHint });
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
    feedbackLoading: state.feedbackLoading,
    totalXP: state.totalXP,
    mysteryBox: state.mysteryBox,
    newBadges: state.newBadges,
    freezeAwarded: state.freezeAwarded,
    sessionSummary: sessionSummary ?? state.sessionSummary,
    expiresAt: state.expiresAt,
    noDueWordsMessage: state.noDueWordsMessage,
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
