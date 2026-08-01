/**
 * @file useMeasureWords.ts
 * @description Hook for fetching measure words (量词) compatible with a noun word.
 * Story 21.8: Measure Word Foundation — frontend display
 *
 * Follows the same pattern as useWordDetail from word-hub:
 * independent self-fetch per section, no frontend cache layer.
 * Adds a `refetch` for the error-state retry action.
 * Pass null (or omit) when no word ID is available — returns idle state.
 */

import { useCallback, useEffect, useState } from "react";
import { loadMeasureWords, type MeasureWordsResponse } from "../services";

export type MeasureWordsResult = {
  data: MeasureWordsResponse | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useMeasureWords(wordId: string | null): MeasureWordsResult {
  const [state, setState] = useState<{
    data: MeasureWordsResponse | null;
    isLoading: boolean;
    isError: boolean;
  }>({
    data: null,
    isLoading: false,
    isError: false,
  });
  // Incrementing this re-runs the fetch (retry).
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!wordId) {
      setState({ data: null, isLoading: false, isError: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, isLoading: true, isError: false });

    loadMeasureWords(wordId)
      .then((result) => {
        if (cancelled) return;
        setState({ data: result, isLoading: false, isError: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ data: null, isLoading: false, isError: true });
      });

    return () => {
      cancelled = true;
    };
  }, [wordId, version]);

  return { ...state, refetch };
}
