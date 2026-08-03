/**
 * @file shared/hooks/usePinyinCharacterMap.ts
 * @description Shared pinyin → Hanzi glyph map hook (cross-feature).
 *
 * Public API: `{ charMap, isLoading, error }` over the SHARED cached service
 * promise (`shared/services/pinyin`). Because the service memoizes the promise,
 * every consumer (foundations PinyinTab/TonesTab, quiz AudioPlayer, …) shares
 * one in-flight fetch and one resolved map.
 *
 * Non-fatal by design: a failed charMap fetch yields `charMap: null` + `error`
 * (audio consumers then skip pinyin silently); the resolved map is only needed
 * to convert pinyin → Hanzi for TTS.
 */

import { useEffect, useState } from "react";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import { fetchPinyinCharacterMap } from "shared/services";

export interface UsePinyinCharacterMapReturn {
  /** Pinyin → Hanzi glyph map, or null while loading / after a failure. */
  charMap: PinyinCharacterMap | null;
  isLoading: boolean;
  error: string | null;
}

export function usePinyinCharacterMap(): UsePinyinCharacterMapReturn {
  const [charMap, setCharMap] = useState<PinyinCharacterMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchPinyinCharacterMap()
      .then((map) => {
        if (!active) return;
        setCharMap(map);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load pinyin character map");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { charMap, isLoading, error };
}
