/**
 * @file useWordDetail.ts
 * @description Hook for fetching word detail data independently.
 * Story 21.7: Phase 3 — Wire LexicalHubRouter to self-fetch data via hubStore
 *
 * Follows the same pattern as useCharacterDetail from character-hub.
 * Backend Redis caching is sufficient; no frontend cache layer.
 */

import { useEffect, useState } from "react";
import { WordDetailResponse, loadWordData } from "../services";

export type WordDetailResult = {
  data: WordDetailResponse | null;
  isLoading: boolean;
  isError: boolean;
};

export function useWordDetail(glyph: string | null): WordDetailResult {
  const [state, setState] = useState<WordDetailResult>({
    data: null,
    isLoading: false,
    isError: false,
  });

  useEffect(() => {
    if (!glyph) {
      setState({ data: null, isLoading: false, isError: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, isLoading: true, isError: false });

    loadWordData(glyph)
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
  }, [glyph]);

  return state;
}
