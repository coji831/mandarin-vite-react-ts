/**
 * useQuizEngine.ts
 *
 * Story 17.6: Replaces QuizContext — provides quiz session initialization,
 * action handlers, and a module-level retry function for child components.
 *
 * QuizPage uses this hook to:
 * - Start quiz session on mount
 * - Provide handleRetry to child components via module-level ref
 *
 * ExamLayout and ResultsLayout use Zustand stores directly for state
 * and manage their own hooks (useAnswerSubmission, useSessionSummary).
 */

import { useCallback, useEffect, useRef } from "react";
import { useQuizSession } from "./useQuizSession";
import { useQuizSessionStore } from "../stores/quizSessionStore";

// Module-level retry function — set by QuizPage, used by ResultsLayout and ErrorScreen
export const quizRetry = {
  handleRetry: () => {},
};

/**
 * Hook that initializes a quiz session on mount and provides retry capability.
 * Used by QuizPage to replace QuizProvider initialization logic.
 */
export function useQuizEngine() {
  const questionStartTime = useRef(Date.now());
  const sessionStarted = useRef(false);
  const pendingRetry = useRef(false);
  const { startSession } = useQuizSession({ questionStartTime });

  const doStartSession = useCallback(() => {
    sessionStarted.current = true;
    pendingRetry.current = false;
    startSession();
  }, [startSession]);

  const handleRetry = useCallback(() => {
    sessionStarted.current = false;
    pendingRetry.current = true;
    useQuizSessionStore.getState().resetSession();
  }, []);

  // Update module-level retry so ResultsLayout and ErrorScreen can access it
  quizRetry.handleRetry = handleRetry;

  // Start quiz session on mount (initial load)
  useEffect(() => {
    if (sessionStarted.current) return;
    doStartSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doStartSession]);

  // Retry trigger: when phase enters LOADING and a retry was requested
  const phase = useQuizSessionStore((s) => s.phase);
  const sessionId = useQuizSessionStore((s) => s.sessionId);
  const questionsLength = useQuizSessionStore((s) => s.questions.length);

  useEffect(() => {
    if (phase === "LOADING" && pendingRetry.current) {
      doStartSession();
      return;
    }

    // Transition LOADING → RESULTS once all questions are answered
    // (triggered by nextQuestion when currentIndex >= questions.length)
    if (phase === "LOADING" && sessionId && questionsLength > 0 && !pendingRetry.current) {
      useQuizSessionStore.getState().completeSession();
    }
  }, [phase, sessionId, questionsLength, doStartSession]);
}
