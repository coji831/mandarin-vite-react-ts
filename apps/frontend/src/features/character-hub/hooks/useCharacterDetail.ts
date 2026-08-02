/**
 * @file useCharacterDetail.ts
 * @description Hook for fetching character detail data independently.
 *
 * Each hub section calls this hook independently, so sections load
 * progressively (identity card appears first, readings later, etc.).
 * Backend Redis caching is sufficient; no frontend cache layer.
 */

import { useState, useEffect } from "react";
import { loadCharacterData } from "../services";
import type { CharacterDetailResponse } from "../services";

export type CharacterDetailResult = {
  data: CharacterDetailResponse | null;
  loading: boolean;
  hasError: boolean;
};

export function useCharacterDetail(glyph: string): CharacterDetailResult {
  const [state, setState] = useState<CharacterDetailResult>({
    data: null,
    loading: false,
    hasError: false,
  });

  useEffect(() => {
    if (!glyph) {
      setState({ data: null, loading: false, hasError: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, loading: true, hasError: false });

    loadCharacterData(glyph)
      .then((result) => {
        if (cancelled) return;
        setState({ data: result, loading: false, hasError: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ data: null, loading: false, hasError: true });
      });

    return () => {
      cancelled = true;
    };
  }, [glyph]);

  return state;
}
