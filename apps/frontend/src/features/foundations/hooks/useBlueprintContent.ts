/**
 * @file hooks/useBlueprintContent.ts
 * @description Data for the Blueprint steps: the pinyin/tones pool (optionalAuth
 * — a guest gets real data, BM-1 §3) and the radical list (public). Both are
 * cached upstream by their services, so stepping back and forth costs nothing.
 */
import { useCallback, useEffect, useState } from "react";
import { foundationsService } from "../services/foundationsService";
import { radicalsService, type RadicalData } from "features/radicals";
import type { PinyinTonesPool } from "../types";

export type BlueprintContent = {
  pool: PinyinTonesPool | null;
  radicals: RadicalData[];
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
};

export function useBlueprintContent(): BlueprintContent {
  const [pool, setPool] = useState<PinyinTonesPool | null>(null);
  const [radicals, setRadicals] = useState<RadicalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);

    // The radical list is optional for the pinyin steps, so a failed radical
    // fetch must not take the whole Blueprint down with it.
    Promise.all([
      foundationsService.getPinyinTonesPool(),
      radicalsService.loadAllRadicals().catch(() => [] as RadicalData[]),
    ])
      .then(([poolData, radicalData]) => {
        if (!active) return;
        setPool(poolData);
        setRadicals(radicalData);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { pool, radicals, isLoading, hasError, retry };
}
