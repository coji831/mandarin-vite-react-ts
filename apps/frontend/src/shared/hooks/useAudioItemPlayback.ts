/**
 * @file shared/hooks/useAudioItemPlayback.ts
 * @description Per-item audio convenience hook (replaced `useAudioPlayback`).
 *
 * Audio Playback consolidation (Phase A, additive) → Phase 2 (candidates-as-data):
 * `play(text)` builds the feature-free DEFAULT WORD CONTRACT
 * (`defaultWordBehavior` from `shared/audio/contracts`), configures the SHARED
 * manager with it, resolves the single item, loads it, and plays it in `"single"`
 * mode — so every per-word/per-turn consumer shares one engine and one
 * arbitration. `play(text)` public signature is UNCHANGED (9 consumers).
 *
 * Auth-agnostic (Phase 0 TTS detachment): `/v1/tts` is `optionalAuth` — guests
 * and users POST it alike. HTTP stays in the service layer (`shared/services/audio`)
 * — no `apiClient` here.
 */

import { useCallback, useMemo } from "react";
import { LANGUAGE_CODES } from "@mandarin/shared-constants";
import { isHanziText, resolveHanzi } from "@mandarin/shared-utils";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import { getAudioManager, resolveBehaviorSources, defaultWordBehavior } from "../audio";
import type { AudioBehavior, AudioManager, AudioStatus } from "../audio";
import { fetchPinyinCharacterMap } from "shared/services";
import { useAudioManager } from "./useAudioManager";

export interface UseAudioItemPlaybackOptions {
  /** Override the shared manager (tests). Defaults to the app-wide singleton. */
  manager?: AudioManager;
  /** Override the default word behavior (tests). Defaults to `defaultWordBehavior`. */
  behavior?: AudioBehavior;
}

/** Options for a single `play(text, ...)` call. */
export interface PlayOptions {
  lang?: string;
  id?: string;
  /** Treat `text` as Chinese TTS input as-is (bypasses pinyin→Hanzi resolution). */
  textIsChinese?: boolean;
}

export interface UseAudioItemPlaybackReturn {
  /** Play a single item through the shared manager (no auto-advance). */
  play: (text: string, options?: PlayOptions) => void;
  pause: () => void;
  stop: () => void;
  status: AudioStatus;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAudioItemPlayback(
  options: UseAudioItemPlaybackOptions = {},
): UseAudioItemPlaybackReturn {
  const manager = useMemo(() => options.manager ?? getAudioManager(), [options.manager]);

  const { status, error } = useAudioManager({
    manager,
    stopOnUnmount: true,
  });

  const play = useCallback(
    (text: string, playOptions?: PlayOptions) => {
      if (!text) return;

      // Phase 1b (TTS-input contract): resolve non-Hanzi input to a Hanzi glyph
      // before it reaches /v1/tts (or browser TTS). The charMap is fetched LAZILY
      // from the shared cached promise only when a non-Hanzi text needs it — Hanzi
      // short-circuits (zero network for CJK). Unresolvable pinyin silently skips
      // inside the word contract (empty candidates, never a TTS loop).
      let charMap: PinyinCharacterMap | null = null;
      const behavior =
        options.behavior ??
        defaultWordBehavior(text, {
          lang: playOptions?.lang ?? LANGUAGE_CODES.CHINESE,
          id: playOptions?.id ?? text,
          textIsChinese: playOptions?.textIsChinese,
          resolveHanzi: (t) => resolveHanzi(t, charMap),
        });
      manager.init({ behavior });

      void (async () => {
        if (playOptions?.textIsChinese !== true && !isHanziText(text)) {
          try {
            charMap = await fetchPinyinCharacterMap();
          } catch {
            charMap = null; // non-critical — the contract silently skips unresolvable pinyin
          }
        }
        const items = await resolveBehaviorSources(behavior.sources);
        void manager.load(items);
        manager.play(0, "single");
      })();
    },
    [manager, options.behavior],
  );

  const pause = useCallback(() => manager.pause(), [manager]);
  const stop = useCallback(() => manager.stop(), [manager]);

  return {
    play,
    pause,
    stop,
    status,
    isPlaying: status === "playing",
    isLoading: status === "loading",
    error,
  };
}
