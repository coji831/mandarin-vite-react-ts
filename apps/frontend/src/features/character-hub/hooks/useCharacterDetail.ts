/**
 * @file useCharacterDetail.ts
 * @description Hook for fetching character detail data independently.
 *
 * Each hub section calls this hook independently, so sections load
 * progressively (identity card appears first, readings later, etc.).
 * Uses a simple module-level cache to prevent duplicate API calls
 * when multiple sections request the same character simultaneously.
 */

import { useState, useEffect } from "react";
import { loadCharacterData } from "../services";
import type { CharacterDetailResponse } from "../services";

/** Module-level cache keyed by glyph — survives re-renders across sections */
/** Entries older than CACHE_TTL_MS are considered stale and re-fetched */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: CharacterDetailResponse;
  timestamp: number;
}

const detailCache = new Map<string, CacheEntry>();

export type CharacterDetailResult = {
  data: CharacterDetailResponse | null;
  loading: boolean;
};

export function useCharacterDetail(glyph: string): CharacterDetailResult {
  const [state, setState] = useState<CharacterDetailResult>(() => {
    const cached = detailCache.get(glyph);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { data: cached.data, loading: false };
    }
    return { data: null, loading: !!glyph };
  });

  useEffect(() => {
    if (!glyph) {
      setState({ data: null, loading: false });
      return;
    }

    // Check cache with TTL
    const cached = detailCache.get(glyph);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setState({ data: cached.data, loading: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, loading: true });

    loadCharacterData(glyph).then((result) => {
      if (cancelled) return;
      if (result) {
        detailCache.set(glyph, { data: result, timestamp: Date.now() });
      }
      setState({ data: result, loading: false });
    });

    return () => {
      cancelled = true;
    };
  }, [glyph]);

  return state;
}
