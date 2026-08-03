/**
 * @file shared/services/pinyin/pinyinCharacterMapService.ts
 * @description Shared pinyin → Hanzi glyph map service (cross-feature).
 *
 * Single implementation of the backend PinyinCharacterMapping fetch, shared by
 * foundations (PinyinTab/TonesTab/DetailPanel), quiz (AudioPlayer), and review.
 * Keeps feature code (review/quiz) from depending on features/foundations — the
 * shared hook (`shared/hooks/usePinyinCharacterMap`) and the audio contract
 * resolver both consume THIS service.
 *
 * The response is cached as a MODULE-LEVEL PROMISE so N consumers share one
 * in-flight fetch (mirrors the `wordAudioCache` dedupe idea). A failed fetch
 * clears the cached promise so a later call can retry.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import { apiClient } from "shared/api";

/** Module-level cached promise — shared across all consumers (one in-flight fetch). */
let cachedPromise: Promise<PinyinCharacterMap> | null = null;

/**
 * Fetch the pinyin → Hanzi glyph map. Returns the SAME in-flight promise for
 * concurrent callers; the result is memoized for the module lifetime. On
 * failure the cache is cleared so a subsequent call retries.
 */
export function fetchPinyinCharacterMap(): Promise<PinyinCharacterMap> {
  if (!cachedPromise) {
    cachedPromise = apiClient
      .get<PinyinCharacterMap>(ROUTE_PATTERNS.foundationsPinyinCharacterMap)
      .then((response) => response.data)
      .catch((err) => {
        cachedPromise = null; // allow retry after failure
        throw err;
      });
  }
  return cachedPromise;
}

/**
 * TEST-ONLY: clear the module-level cached promise so tests can re-drive the
 * fetch (e.g. different MSW responses). Not used in production code paths.
 */
export function __resetPinyinCharacterMapCache(): void {
  cachedPromise = null;
}
