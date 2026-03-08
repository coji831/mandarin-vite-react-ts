/**
 * @file apps/frontend/src/features/quiz/hooks/useQuizSession.ts
 * @description Hook for managing quiz session lifecycle
 *
 * Story 15.11 Part B Phase 5: Extracted session management logic from QuizContext
 * Centralizes quiz session initialization: API call → validation → transformation → state initialization.
 *
 * Responsibilities:
 * - Start new quiz session (or resume existing)
 * - Validate session response (check for due words)
 * - Transform backend questions to frontend format
 * - Initialize quiz state with session data
 * - Error handling for session initialization
 *
 * Used by: QuizContext for session lifecycle management
 *
 * @see docs/issue-implementation/epic-15-learning-retention/story-15-11-spaced-repetition-refactoring.md
 */

import { useCallback, MutableRefObject } from "react";
import { quizApi } from "../services/quizService";
import { transformSessionToQuestions } from "../services/quizTransformers";
import type { QuizAction } from "../reducers/quizReducer";

// ============================================================================
// Hook Parameters
// ============================================================================

interface UseQuizSessionParams {
  dispatch: React.Dispatch<QuizAction>;
  questionStartTime: MutableRefObject<number>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing quiz session lifecycle
 *
 * Encapsulates session initialization flow:
 * 1. Call backend to start/resume session
 * 2. Validate response (check for due words)
 * 3. Transform questions to frontend format
 * 4. Initialize quiz state with session data
 * 5. Reset question timer
 *
 * @param params Dispatch function and question start time ref
 * @returns Object with startSession method
 */
export function useQuizSession({ dispatch, questionStartTime }: UseQuizSessionParams) {
  /**
   * Start a new quiz session or resume existing session
   *
   * Flow:
   * - Calls backend API to start quiz session
   * - Checks if already completed today (alreadyCompleted flag)
   * - If completed: Shows previous results with countdown to midnight
   * - If not: Transforms questions and initializes quiz
   * - Resets question timer for first question
   *
   * Error handling:
   * - No due words: Sets friendly error message (not a failure)
   * - API failure: Dispatches error to state
   */
  const startSession = useCallback(async () => {
    try {
      const response = await quizApi.startQuizSession();

      // Check if user already completed quiz today (daily quiz limit)
      if (response.alreadyCompleted) {
        dispatch({
          type: "SHOW_DAILY_COMPLETE_RESULTS",
          sessionId: response.sessionId,
          summary: response.summary!,
          expiresAt: response.expiresAt,
        });
        return;
      }

      // Flow 1.2: Check if no due words (all caught up)
      if (response.noDueWords) {
        dispatch({
          type: "SHOW_NO_DUE_WORDS",
          message: response.message || "You're all caught up! Come back later for more practice.",
        });
        return;
      }

      if (response.questions.length === 0) {
        dispatch({
          type: "SET_ERROR",
          error: "No words due for review today. Great job staying on track!",
        });
        return;
      }

      // Transform backend questions to frontend format
      const questions = transformSessionToQuestions(response.questions);

      // Check if resuming existing session
      if (response.isResume && response.currentIndex !== undefined && response.answers) {
        // Resume quiz from last position with previous answers
        dispatch({
          type: "RESUME_QUIZ",
          questions,
          sessionId: response.sessionId,
          currentIndex: response.currentIndex,
          answers: response.answers.map((answer) => ({
            ...answer,
            timestamp: new Date(answer.timestamp), // Convert ISO string to Date
          })),
        });
      } else {
        // Initialize new quiz from beginning
        dispatch({
          type: "INITIALIZE_QUIZ",
          questions,
          sessionId: response.sessionId,
        });
      }

      // Reset question timer for first/current question
      questionStartTime.current = Date.now();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start quiz session";
      dispatch({ type: "SET_ERROR", error: errorMessage });
    }
  }, [dispatch, questionStartTime]);

  return {
    startSession,
  };
}
