/**
 * @file useReviewSources.ts
 * @description Hook that checks available review sources and their item counts.
 *
 * Calls the backend API to determine how many items are available under each
 * source filter (due, recent, all) for a given content type. Exposes loading
 * state so UI can prevent interactions until data is ready.
 */
import { useEffect, useState } from "react";
import type { ReviewSource } from "../types";
import { reviewService } from "../services/reviewService";

export interface SourceCounts {
  due: number;
  recent: number;
  all: number; // -1 means "always available"
}

type UseReviewSourcesReturn = {
  /** Source availability counts (keyed by source name) */
  sourceCounts: SourceCounts;
  /** Whether availability is being checked */
  checking: boolean;
  /** The content type being checked */
  selectedType: string;
  /** Change the content type (triggers re-check) */
  setSelectedType: (type: string) => void;
  /** The currently selected source */
  selectedSource: ReviewSource;
  /** Change the selected source */
  setSelectedSource: (source: ReviewSource) => void;
};

/**
 * Check available review sources for a given content type.
 * "all" is always available (-1). Due and recent are checked via API with limit=1.
 * Automatically switches to "all" if the current source has no items.
 */
export function useReviewSources(initialType?: string): UseReviewSourcesReturn {
  const [selectedType, setSelectedType] = useState(initialType ?? "pinyin");
  const [selectedSource, setSelectedSource] = useState<ReviewSource>("due");
  const [sourceCounts, setSourceCounts] = useState<SourceCounts>({
    due: 0,
    recent: 0,
    all: -1,
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAvailability = async () => {
      setChecking(true);
      try {
        const [dueResult, recentResult] = await Promise.allSettled([
          reviewService.fetchItems("due", selectedType, 1),
          reviewService.fetchItems("recent", selectedType, 1),
        ]);

        const counts: SourceCounts = {
          due: dueResult.status === "fulfilled" ? dueResult.value.length : 0,
          recent: recentResult.status === "fulfilled" ? recentResult.value.length : 0,
          all: -1,
        };

        if (!cancelled) {
          setSourceCounts(counts);
          // Auto-switch if current selection is now unavailable
          setSelectedSource((prev) => {
            if (counts.due === 0 && prev === "due") return "all";
            if (counts.recent === 0 && prev === "recent") return "all";
            return prev;
          });
        }
      } catch {
        if (!cancelled) {
          setSourceCounts({ due: 0, recent: 0, all: -1 });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedType]);

  return {
    sourceCounts,
    checking,
    selectedType,
    setSelectedType,
    selectedSource,
    setSelectedSource,
  };
}
