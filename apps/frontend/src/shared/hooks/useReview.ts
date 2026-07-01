/**
 * @file shared/hooks/useReview.ts
 * @description Hook for SRS review queue management
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Cross-cutting: provides async API calls for saving items to the SRS review queue.
 * No UI state — callers manage loading/success/error display.
 *
 * Future: add markLearned(char), getQueue(), getNextReview()
 */
import { useCallback } from "react";

export function useReview() {
  const saveToReview = useCallback(async (_char: string): Promise<boolean> => {
    // Real backend integration in future story — uses existing progress API pattern
    // e.g., await progressApi.updateWordProgress(char, { studyCount: 1 })
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }, []);

  return { saveToReview };
}
