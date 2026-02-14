/**
 * Quiz API Integration Hook
 * Story 15.8: Core Quiz Backend Integration
 *
 * Provides hooks for fetching due words and saving test results.
 * Integrates with backend progress tracking and gamification APIs.
 *
 * @example
 * ```tsx
 * function QuizContainer() {
 *   const { fetchDueWords, loading, error } = useFetchDueWords();
 *   const { saveTestResult } = useSaveTestResult();
 *
 *   useEffect(() => {
 *     const loadWords = async () => {
 *       try {
 *         const data = await fetchDueWords();
 *         dispatch({ type: 'START_QUIZ', payload: { words: data.words } });
 *       } catch (err) {
 *         // Handle error
 *       }
 *     };
 *     loadWords();
 *   }, []);
 * }
 * ```
 */

import { useCallback, useState } from "react";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "services";

// ============================================================================
// Types
// ============================================================================

/**
 * Due word with enriched vocabulary data
 * Matches backend GET /api/v1/progress/due response
 */
export type DueWord = {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
  nextReview: string; // ISO 8601 datetime
  studyCount: number;
  lapseCount: number;
  currentDelay: number | null;
  categories?: string[];
};

/**
 * Response from GET /api/v1/progress/due
 */
export type DueWordsResponse = {
  date: string; // YYYY-MM-DD
  count: number;
  words: DueWord[];
};

/**
 * Request payload for POST /api/v1/progress/test-result
 */
export type TestResultRequest = {
  wordId: string;
  correct: boolean;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
  timeSpentMs?: number;
};

/**
 * Badge awarded for streak milestone (Story 15.3)
 */
export type Badge = {
  id: string;
  name: string;
  streakRequired: number;
  icon: string;
};

/**
 * Mystery box reward (Story 15.3 - 5% drop chance on streak milestones)
 */
export type MysteryBox = {
  type: "xp" | "freeze" | "badge";
  amount?: number;
  name: string;
  icon: string;
} | null;

/**
 * Response from POST /api/v1/progress/test-result
 * Includes spaced repetition updates and gamification rewards
 */
export type TestResultResponse = {
  nextReviewDate: string; // ISO 8601 datetime
  lapseCount: number;
  isLeech: boolean; // True if lapseCount >= 5
  xpEarned: number; // +10 base, +5 bonus if streak ≥ 7 days
  newBadges?: Badge[]; // Newly unlocked badges (7/30/100/365-day streaks)
  freezeAwarded?: boolean; // True if earned 1 freeze (10 consecutive perfect quizzes)
  mysteryBox?: MysteryBox; // Random reward (5% chance on 7-day multiples)
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for fetching due words from backend
 * GET /api/v1/progress/due
 *
 * @returns Hook state containing fetchDueWords function, loading state, and error state
 */
export function useFetchDueWords() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch words due for review
   *
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   * @returns DueWordsResponse with date, count, and words array
   * @throws Error if request fails or response invalid
   */
  const fetchDueWords = useCallback(async (date?: string): Promise<DueWordsResponse> => {
    setLoading(true);
    setError(null);

    try {
      const params = date ? { date } : {};
      const response = await apiClient.get<DueWordsResponse>(ROUTE_PATTERNS.progressDue, {
        params,
      });

      // Validate response shape
      if (!response.data || !Array.isArray(response.data.words)) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch due words";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchDueWords, loading, error };
}

/**
 * Hook for saving quiz test results to backend
 * POST /api/v1/progress/test-result
 *
 * Updates spaced repetition schedule and triggers gamification rewards.
 * Non-blocking pattern: caller should handle errors gracefully (toast notification).
 *
 * @returns Hook state containing saveTestResult function, saving state, and error state
 */
export function useSaveTestResult() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save quiz answer and update progress
   *
   * @param request Test result payload (wordId, correct, questionType, timeSpentMs)
   * @returns TestResultResponse with nextReviewDate, lapseCount, XP, badges, etc.
   * @throws Error if request fails
   */
  const saveTestResult = useCallback(
    async (request: TestResultRequest): Promise<TestResultResponse> => {
      setSaving(true);
      setError(null);

      try {
        const response = await apiClient.post<TestResultResponse>(
          ROUTE_PATTERNS.progressTestResult,
          request,
        );

        // Validate response
        if (!response.data || typeof response.data.nextReviewDate !== "string") {
          throw new Error("Invalid response format from server");
        }

        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save test result";
        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { saveTestResult, saving, error };
}
