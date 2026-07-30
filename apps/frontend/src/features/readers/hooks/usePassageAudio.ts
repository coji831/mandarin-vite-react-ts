/**
 * @file hooks/usePassageAudio.ts
 * @description Standalone hook for fetching audio URLs for a passage.
 * Story 21.5: Audio Sync — Phase 3a
 * Phase 1 (Epic 21): Also writes audioUrls to audioStore for downstream consumers.
 *
 * Separate from usePassageDetail — single-responsibility for audio loading.
 * Returns audioUrls for backward compat with useSentenceAudio; Phase 2 consumers
 * read from audioStore directly.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPassageAudio } from "../services/passageService";
import { useAudioStore } from "../stores";
import type { SentenceAudioMap } from "../types";

export function usePassageAudio(passageId: string | null) {
  const [audioUrls, setAudioUrls] = useState<SentenceAudioMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadAudioUrls = useAudioStore((s) => s.loadAudioUrls);
  const clearAudioUrls = useAudioStore((s) => s.clearAudioUrls);

  const load = useCallback(async () => {
    if (!passageId) {
      setAudioUrls(null);
      clearAudioUrls();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPassageAudio(passageId);
      setAudioUrls(data.audioUrls);
      // Also populate audioStore for downstream consumers (Phase 2)
      loadAudioUrls(data.audioUrls);
    } catch (err) {
      console.error("usePassageAudio: Failed to fetch audio URLs:", err);
      setError(err instanceof Error ? err.message : "Failed to load audio");
      setAudioUrls(null);
      clearAudioUrls();
    } finally {
      setIsLoading(false);
    }
  }, [passageId, loadAudioUrls, clearAudioUrls]);

  useEffect(() => {
    load();
  }, [load]);

  return { audioUrls, isLoading, error, retry: load };
}
