/**
 * @file features/progress/hooks/useProgressSummary.ts
 * @description Reads the REAL progress numbers this app already has, for the
 * Progress page's single populated card (rework-proposal §6: "say something
 * true, or say nothing").
 *
 * Two sources, both already shipped:
 *  - `useFoundationsProgress()` → completed Phase-1 foundation sections (n/4)
 *  - `progressionRadicalProgress` → radicals the learner has memorized
 *
 * There is no streak or badge endpoint yet, so this hook deliberately returns
 * no streak — a number the page could not fetch would be a promise, not a
 * metric (which is exactly what this rework deletes).
 *
 * Guests get foundation-progress = [] and radical-progress = [] (both routes
 * are optionalAuth and project an empty set for an anonymous visitor), so
 * `hasData` is false and the page shows its empty state instead of zeros.
 */
import { useEffect, useState } from "react";
import { useFoundationsProgress } from "features/foundations";
import { radicalProgressService } from "features/radicals";

export type ProgressSummary = {
  /** Completed Phase-1 foundation sections. */
  completedSections: number;
  totalSections: number;
  /** Radicals marked memorized. */
  masteredRadicals: number;
  /** True once at least one real number is non-zero. */
  hasData: boolean;
  isLoading: boolean;
};

export function useProgressSummary(): ProgressSummary {
  const { completedCount, totalSections, isLoading: foundationsLoading } = useFoundationsProgress();
  const [masteredRadicals, setMasteredRadicals] = useState(0);
  const [radicalsLoading, setRadicalsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    radicalProgressService
      .getRadicalProgress()
      .then((items) => {
        if (active) setMasteredRadicals(items.filter((item) => item.memorized).length);
      })
      .catch(() => {
        // Non-blocking: a failed fetch leaves the count at 0 rather than
        // breaking the page (progress is a read-only summary).
      })
      .finally(() => {
        if (active) setRadicalsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    completedSections: completedCount,
    totalSections,
    masteredRadicals,
    hasData: completedCount > 0 || masteredRadicals > 0,
    isLoading: foundationsLoading || radicalsLoading,
  };
}
