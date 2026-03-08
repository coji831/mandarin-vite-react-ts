/**
 * @file apps/frontend/src/features/quiz/services/quizService.ts
 * @description API service for quiz and spaced repetition functionality
 *
 * Story 15.11 Phase 7: Created service layer for clean architecture
 * Story 15.11 Phase 8: Added quiz session endpoints for backend-centric architecture
 * Provides abstraction between UI hooks and backend API calls.
 * Enables backend mocking for UI/UX development via service layer.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "services";
import type {
  QuizSessionStartResponse,
  QuizAnswerRequest,
  QuizAnswerResponse,
  QuizSessionSummary,
} from "../types";

// ============================================================================
// Quiz API Service
// ============================================================================

/**
 * Quiz API service using Axios with typed responses
 * Provides clean abstraction for quiz and spaced repetition operations
 */
export const quizApi = {
  // ============================================================================
  // Quiz Session Methods (Story 15.11 Phase 8)
  // ============================================================================

  /**
   * Start a new quiz session (or resume existing)
   * POST /api/v1/quiz/session/start
   *
   * Creates a server-side quiz session with generated questions.
   * Backend validates answers and manages session state.
   *
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   * @param limit Optional max words to include (defaults to 10)
   * @returns QuizSessionStartResponse with sessionId and questions
   * @throws Error with user-friendly message on failure
   */
  async startQuizSession(date?: string, limit?: number): Promise<QuizSessionStartResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (date) params.date = date;
      if (limit) params.limit = limit;

      const response = await apiClient.post<QuizSessionStartResponse>(
        ROUTE_PATTERNS.quizSessionStart,
        null,
        { params },
      );

      // Validate response shape
      if (!response.data || !response.data.sessionId || !Array.isArray(response.data.questions)) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (error) {
      console.error("[quizApi] Failed to start quiz session:", error);
      // Re-throw Error instances to preserve specific messages
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to start quiz session. Please try again.");
    }
  },

  /**
   * Submit an answer for validation
   * POST /api/v1/quiz/session/:sessionId/answer
   *
   * Backend validates answer, updates progress, awards gamification.
   *
   * @param sessionId Quiz session ID
   * @param request Answer payload (questionId, userAnswer, timeSpentMs)
   * @returns QuizAnswerResponse with correct flag, feedback, next question
   * @throws Error with user-friendly message on failure
   */
  async submitAnswer(sessionId: string, request: QuizAnswerRequest): Promise<QuizAnswerResponse> {
    try {
      const response = await apiClient.post<QuizAnswerResponse>(
        ROUTE_PATTERNS.quizSessionAnswer(sessionId),
        request,
      );

      // Validate response
      if (response.data === undefined || typeof response.data.correct !== "boolean") {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (error) {
      console.error("[quizApi] Failed to submit answer:", error);
      // Re-throw Error instances to preserve specific messages
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to submit answer. Please try again.");
    }
  },

  /**
   * Get session summary with calculated statistics
   * GET /api/v1/quiz/session/:sessionId/summary
   * Story 15.11: Backend-calculated metrics (accuracy, XP, leech words)
   *
   * @param sessionId Quiz session ID
   * @returns QuizSessionSummary with pre-calculated metrics
   * @throws Error with user-friendly message on failure
   */
  async getSessionSummary(sessionId: string): Promise<QuizSessionSummary> {
    try {
      const response = await apiClient.get<QuizSessionSummary>(
        `/api${ROUTE_PATTERNS.quizSessionSummary(sessionId)}`,
      );

      // Validate response
      if (
        response.data === undefined ||
        typeof response.data.accuracyRate !== "number" ||
        typeof response.data.xpEarned !== "number"
      ) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (error) {
      console.error("[quizApi] Failed to fetch session summary:", error);
      // Re-throw Error instances to preserve specific messages
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to load session summary. Please try again.");
    }
  },
};
