/**
 * @file useSessionSummary.ts
 * @description React hook for fetching quiz session summary with backend-calculated metrics
 * Story 15.11: Move business logic to backend - fetch pre-calculated session statistics
 *
 * Replaces client-side calculations with backend-provided:
 * - Accuracy rate (percentage)
 * - XP totals
 * - Leech word detection
 * - Incorrect word aggregation
 *
 * @see docs/issue-implementation/epic-15-learning-retention/story-15-11-business-logic-flows.md
 */

import { useState, useEffect, useCallback } from "react";
import { quizApi } from "../services/quizService";
import type { QuizSessionSummary } from "../types";

export type UseSessionSummaryReturn = {
  quizSessionSummary: QuizSessionSummary | null;
  isSummaryLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch quiz session summary from backend
 *
 * @param sessionId - Quiz session ID to fetch summary for
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Summary data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { quizSessionSummary, isSummaryLoading, error } = useSessionSummary(sessionId);
 *
 * if (isSummaryLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <p>Accuracy: {quizSessionSummary.accuracyRate}%</p>
 *     <p>Total XP: {quizSessionSummary.totalXP}</p>
 *     <p>Leech Words: {quizSessionSummary.leechCount}</p>
 *   </div>
 * );
 * ```
 */
export function useSessionSummary(
  sessionId: string | null,
  autoFetch: boolean = true,
): UseSessionSummaryReturn {
  const [quizSessionSummary, setSummary] = useState<QuizSessionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!sessionId) {
      setError(new Error("Session ID is required"));
      return;
    }

    setIsSummaryLoading(true);
    setError(null);

    try {
      const data = await quizApi.getSessionSummary(sessionId);
      setSummary(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch session summary");
      setError(error);
      console.error("[useSessionSummary] Error fetching summary:", error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (autoFetch && sessionId) {
      fetchSummary();
    }
  }, [autoFetch, sessionId, fetchSummary]);

  return {
    quizSessionSummary,
    isSummaryLoading,
    error,
    refetch: fetchSummary,
  };
}
