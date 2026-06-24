/**
 * @file hooks/useFoundationsProgress.ts
 * @description Data hook for fetching and tracking foundations progress
 * Story 18.1: Foundations Page Structure
 */

import { useEffect, useState } from "react";
import { FOUNDATION_SECTIONS } from "@mandarin/shared-constants";
import { foundationsService } from "../services/foundationsService";
import type { FoundationProgress } from "@mandarin/shared-types";

/**
 * Hook that fetches foundation progress and provides derived state.
 *
 * @returns {object} progress state, loading flag, completedCount, totalSections
 */
export function useFoundationsProgress() {
  const [progress, setProgress] = useState<FoundationProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    foundationsService
      .getFoundationProgress()
      .then(setProgress)
      .catch((err) => {
        // [Foundations] Foundation progress fetch failed
        console.warn("[Foundations] Failed to load foundation progress:", err);
        // Keep default empty array — UI shows 0/4 which is accurate for first visit
      })
      .finally(() => setIsLoading(false));
  }, []);

  const completedCount = progress.filter((p) => p.completed).length;

  return {
    progress,
    isLoading,
    completedCount,
    totalSections: FOUNDATION_SECTIONS.length,
  };
}
