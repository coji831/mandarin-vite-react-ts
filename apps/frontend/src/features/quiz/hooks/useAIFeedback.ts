/**
 * AI Feedback API Integration Hook
 * Story 15.9: Gamification & AI Integration
 *
 * Provides hook for generating AI-powered error explanations for quiz answers.
 * Implements 3-second timeout with fallback message for better UX.
 *
 * Business Rules:
 * - Generate explanations asynchronously (don't block quiz flow)
 * - 3-second timeout (user should not wait)
 * - Fallback message on timeout or error
 * - Rate limit: 10 requests/minute per user (enforced by backend)
 *
 * @example
 * ```tsx
 * function QuizContainer() {
 *   const { generateFeedback, loading } = useGenerateFeedback();
 *
 *   const handleIncorrectAnswer = async (wordId, userAnswer, correctAnswer) => {
 *     try {
 *       const feedback = await generateFeedback({
 *         wordId,
 *         userAnswer,
 *         correctAnswer,
 *         questionType: "type_pinyin"
 *       });
 *       showFeedbackPanel(feedback);
 *     } catch (err) {
 *       // Fallback message already handled by hook
 *     }
 *   };
 * }
 * ```
 */

import { useCallback, useState } from "react";
import { apiClient } from "services";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Request payload for POST /api/v1/quiz/feedback
 */
export type FeedbackRequest = {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
};

/**
 * Response from POST /api/v1/quiz/feedback
 */
export type FeedbackResponse = {
  explanation: string; // AI-generated error explanation
  errorType: "tone" | "character" | "meaning" | "generic";
};

/**
 * Timeout duration for AI feedback request (5 seconds)
 */
const FEEDBACK_TIMEOUT_MS = 5000;

/**
 * Fallback message when AI feedback times out or fails
 */
const FALLBACK_MESSAGE =
  "Keep practicing! Review the correct answer and try again. Focus on the differences between your answer and the correct one.";

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for generating AI-powered quiz feedback
 * POST /api/v1/quiz/feedback with 5-second timeout
 *
 * @returns Hook state containing generateFeedback function, loading state, and error state
 */
export function useGenerateFeedback() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate AI feedback for incorrect answer with timeout protection
   *
   * @param request Feedback request with wordId, answers, and question type
   * @returns FeedbackResponse with explanation and errorType (or fallback on timeout/error)
   */
  const generateFeedback = useCallback(
    async (request: FeedbackRequest): Promise<FeedbackResponse> => {
      setLoading(true);
      setError(null);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);

      try {
        const response = await apiClient.post<FeedbackResponse>(
          ROUTE_PATTERNS.quizFeedback,
          request,
          {
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        // Validate response shape
        if (!response.data || !response.data.explanation) {
          throw new Error("Invalid response format from server");
        }

        return response.data;
      } catch (err) {
        clearTimeout(timeoutId);

        // Check if error is due to timeout/abort
        if (err instanceof Error && err.name === "AbortError") {
          console.warn("AI feedback request timed out after 5 seconds");
          setError("Timeout");
          // Return fallback message
          return {
            explanation: FALLBACK_MESSAGE,
            errorType: "generic",
          };
        }

        // Handle other errors (network, API failure)
        const errorMessage = err instanceof Error ? err.message : "Failed to generate feedback";
        console.error("AI feedback error:", errorMessage);
        setError(errorMessage);

        // Return fallback message for any error
        return {
          explanation: FALLBACK_MESSAGE,
          errorType: "generic",
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generateFeedback, loading, error };
}
