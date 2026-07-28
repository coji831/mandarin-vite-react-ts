/**
 * @file hooks/usePassageDetail.ts
 * @description Hook for fetching a single passage detail.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Covers loading, error, retry, and empty states.
 * Transforms the API response (enriched backend shape) into PassageDetail
 * expected by the reading UI components.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPassageDetail } from "../services/passageService";
import type {
  PassageDetail,
  PassageDetailApiResponse,
  WordApiResponse,
  SentenceApiResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

/**
 * Maps a backend enriched word to the UI-facing SentenceWord type.
 * `isKnown` is always present from the backend — no fallback needed.
 */
function mapWord(w: WordApiResponse): {
  glyph: string;
  isKnown: boolean;
  hskLevel?: number;
  pinyin?: string;
} {
  return {
    glyph: w.glyph,
    isKnown: w.isKnown,
    hskLevel: w.hskLevel ?? undefined,
    pinyin: w.pinyin ?? undefined,
  };
}

/**
 * Maps the raw API response body to the PassageDetail type expected by UI.
 */
function transformPassageResponse(data: PassageDetailApiResponse | null): PassageDetail | null {
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    hskLevel: data.hskLevel,
    sentences: data.sentences.map((s: SentenceApiResponse) => ({
      index: s.index,
      text: s.text,
      pinyin: s.pinyin ?? "",
      words: s.words.map(mapWord),
    })),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePassageDetail(id: string | null) {
  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(() => id !== null);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchPassageDetail(id);
      setPassage(transformPassageResponse(data));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  return { passage, isLoading, hasError, retry: load };
}
