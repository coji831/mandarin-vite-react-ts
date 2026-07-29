/**
 * @file hooks/usePassageAudio.ts
 * @description Standalone hook for fetching audio URLs for a passage.
 * Story 21.5: Audio Sync — Phase 3a
 *
 * Separate from usePassageDetail — single-responsibility for audio loading.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPassageAudio } from "../services/passageService";
import type { SentenceAudioMap } from "../types";

export function usePassageAudio(passageId: string | null) {
  const [audioUrls, setAudioUrls] = useState<SentenceAudioMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!passageId) {
      setAudioUrls(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPassageAudio(passageId);
      setAudioUrls(data.audioUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audio");
      setAudioUrls(null);
    } finally {
      setIsLoading(false);
    }
  }, [passageId]);

  useEffect(() => {
    load();
  }, [load]);

  return { audioUrls, isLoading, error, retry: load };
}
