/**
 * @file apps/frontend/src/features/quiz/hooks/useAnswerSubmission.ts
 * @description Hook for orchestrating quiz answer submission flow
 *
 * Story 15.11 Part B Phase 4: Extracted answer submission logic from QuizContext
 * Centralizes answer submission orchestration: API call → state update → gamification → AI feedback.
 *
 * Responsibilities:
 * - Submit answer to backend quiz session
 * - Update quiz state with answer result
 * - Handle AI feedback from backend
 * - Error handling for submission failures
 *
 * Used by: QuizContext for handleAnswer action
 *
 * @see docs/issue-implementation/epic-15-learning-retention/story-15-11-spaced-repetition-refactoring.md
 */

import { useCallback, MutableRefObject } from "react";
import { quizApi } from "../services/quizService";
import type { QuizAction } from "../reducers/quizReducer";
import type { QuizQuestion } from "../types";

// ============================================================================
// Hook Parameters
// ============================================================================

type UseAnswerSubmissionParams = {
  sessionId?: string;
  currentQuestion?: QuizQuestion;
  questionStartTime: MutableRefObject<number>;
  dispatch: React.Dispatch<QuizAction>;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for orchestrating quiz answer submission
 *
 * Encapsulates the full submission flow:
 * 1. Submit answer to backend session
 * 2. Dispatch answer result to state
 * 3. Handle AI feedback from backend
 *
 * @param params Session ID, current question, question start time ref, dispatch
 * @returns Object with submitAnswer method
 */
export function useAnswerSubmission({
  sessionId,
  currentQuestion,
  questionStartTime,
  dispatch,
}: UseAnswerSubmissionParams) {
  /**
   * Submit user answer to backend session for validation
   *
   * Flow:
   * - Validates session ID exists
   * - Clears previous AI feedback state
   * - Submits answer to backend with timing data
   * - Dispatches answer result (correct/incorrect, next review date, etc.)
   * - Captures gamification rewards (XP, badges, mystery box, freeze)
   * - Sets AI feedback if provided by backend
   *
   * @param userAnswer User's submitted answer (pinyin or character)
   */
  const submitAnswer = useCallback(
    async (userAnswer: string) => {
      if (!sessionId) {
        console.error("No session ID - cannot submit answer");
        return;
      }

      if (!currentQuestion) {
        console.error("No current question - cannot submit answer");
        return;
      }

      const timeSpentMs = Date.now() - questionStartTime.current;

      try {
        // Submit answer to backend session for validation
        const result = await quizApi.submitAnswer(sessionId, {
          questionId: currentQuestion.id || `${currentQuestion.wordId}_${currentQuestion.mode}`,
          userAnswer,
          timeSpentMs,
        });

        // Dispatch answer result to state (optimistic UI)
        dispatch({
          type: "QUIZ/SUBMIT_ANSWER",
          answer: {
            wordId: currentQuestion.wordId,
            word: currentQuestion.word,
            pinyin: currentQuestion.pinyin,
            english: currentQuestion.english,
            questionType: currentQuestion.mode,
            userAnswer,
            correct: result.correct,
            timestamp: new Date(),
            nextReviewDate: result.nextReviewDate,
            lapseCount: result.lapseCount,
            isLeech: result.isLeech,
            correctAnswer: result.correctAnswer,
          },
        });

        // Story 15.11 Phase 9: AI feedback comes from backend automatically
        // Backend auto-generates feedback for incorrect answers with 3-second timeout
        if (result.aiFeedback) {
          dispatch({ type: "QUIZ/SET_AI_FEEDBACK", feedback: result.aiFeedback.explanation });
        }
      } catch (err) {
        console.error("Failed to submit answer:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to submit answer";
        dispatch({ type: "QUIZ/SET_ERROR", error: errorMessage });
      }
    },
    [sessionId, currentQuestion, questionStartTime, dispatch],
  );

  return {
    submitAnswer,
  };
}
