/**
 * Gamification API Integration Hook
 * Story 15.9: Gamification & AI Integration
 *
 * Provides hooks for streak tracking, badge management, and freeze spending.
 * Integrates with backend gamification APIs from Story 15.3.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { fetchStreak, loading } = useFetchStreak();
 *   const { fetchBadges } = useFetchBadges();
 *   const { spendFreeze } = useSpendFreeze();
 *
 *   useEffect(() => {
 *     const loadData = async () => {
 *       const streak = await fetchStreak();
 *       const badges = await fetchBadges();
 *       setState({ streak, badges });
 *     };
 *     loadData();
 *   }, []);
 * }
 * ```
 */

import { useCallback, useState } from "react";
import {
  fetchStreak as apiFetchStreak,
  fetchBadges as apiFetchBadges,
  spendFreeze as apiSpendFreeze,
} from "../services";

// ============================================================================
// Types
// ============================================================================

/**
 * Streak data with freeze currency
 * Matches backend GET /api/v1/progress/streak response
 */
export type StreakResponse = {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  lastActivityDate: string; // ISO 8601 datetime
};

/**
 * Badge data with earned status
 * Matches backend GET /api/v1/gamification/badges response
 */
export type BadgeResponse = {
  earned: BadgeItem[];
  available: BadgeItem[];
};

export type BadgeItem = {
  id: string;
  name: string;
  streakRequired: number;
  icon: string;
  earnedDate?: string; // ISO 8601 datetime (for earned badges)
  progress?: number; // Current progress (for available badges)
  percentComplete?: number; // Progress percentage (for available badges)
};

/**
 * Freeze spend response
 * Matches backend POST /api/v1/progress/streak/freeze response
 */
export type FreezeResponse = {
  message: string;
  freezeCount: number; // Remaining freezes after spending
  lastActivityDate: string; // Extended grace period end
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for fetching streak data
 * GET /api/v1/progress/streak
 *
 * @returns Hook state containing fetchStreak function, loading state, and error state
 */
export function useFetchStreak() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current streak data
   *
   * @returns StreakResponse with currentStreak, longestStreak, freezeCount, lastActivityDate
   * @throws Error if request fails or response invalid
   */
  const fetchStreak = useCallback(async (): Promise<StreakResponse> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchStreak();

      // Validate response shape
      if (!data || typeof data.currentStreak !== "number") {
        throw new Error("Invalid response format from server");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch streak data";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchStreak, loading, error };
}

/**
 * Hook for fetching badges (earned and available)
 * GET /api/v1/gamification/badges
 *
 * @returns Hook state containing fetchBadges function, loading state, and error state
 */
export function useFetchBadges() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch badges data
   *
   * @returns BadgeResponse with earned and available badges arrays
   * @throws Error if request fails or response invalid
   */
  const fetchBadges = useCallback(async (): Promise<BadgeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchBadges();

      // Validate response shape
      if (!data || !Array.isArray(data.earned) || !Array.isArray(data.available)) {
        throw new Error("Invalid response format from server");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch badges";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchBadges, loading, error };
}

/**
 * Hook for spending a streak freeze
 * POST /api/v1/progress/streak/freeze
 *
 * @returns Hook state containing spendFreeze function, loading state, and error state
 */
export function useSpendFreeze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Spend one streak freeze to extend grace period
   *
   * Business Rules:
   * - Requires freezeCount >= 1 (400 error if 0 freezes)
   * - Streak must be at risk: (now - lastActivityDate) > 48 hours
   * - Extends grace period by 24 hours
   *
   * @returns FreezeResponse with updated freezeCount and lastActivityDate
   * @throws Error if request fails (e.g., no freezes available, streak not at risk)
   */
  const spendFreeze = useCallback(async (): Promise<FreezeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiSpendFreeze();

      // Validate response shape
      if (!data || typeof data.freezeCount !== "number") {
        throw new Error("Invalid response format from server");
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to spend freeze";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { spendFreeze, loading, error };
}
