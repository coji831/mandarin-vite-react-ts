/**
 * @file shared/audio/contracts/word.ts
 * @description Default per-word audio behavior contract (feature-free).
 *
 * Phase 2 (candidates-as-data): `WordAudioResolver` is retired — a word's
 * fallback policy is now expressed as DATA (an ordered candidate list per
 * item) built from `shared/services/audio`. The manager is a pure transport:
 * it plays whatever candidates it is given and never sees the service layer.
 *
 * Error discrimination is preserved via `WordAudioError`:
 *   - success + URL      → `[{kind:"url"}]`   (source `"cached"` if the backend
 *                         served a pre-synthesized file, else `"ondemand"`)
 *   - network / 5xx      → `[{kind:"tts"}]`   (browser-TTS fallback)
 *   - auth / 429 / other → `[]`               (silent skip — never a TTS loop)
 *
 * A URL that plays-but-errors is evicted via `onUrlFailed` (which returns
 * `"fallback"`), so a later play can re-resolve and possibly fall back.
 */

import { LANGUAGE_CODES } from "@mandarin/shared-constants";
import { isHanziText } from "@mandarin/shared-utils";
import { API_CONFIG } from "config";
import { AudioService, WordAudioError } from "../../services/audio";
import { AudioUrlCache } from "../AudioUrlCache";
import type { AudioBehavior, PlayableItem, PlayableSource } from "../types";

export interface WordContractOptions {
  /** BCP-47 language code for TTS candidates (default zh-CN). */
  lang?: string;
  /** Stable cache key/id (defaults to the text itself). */
  id?: string;
  /** Optional voice hint carried on candidates (informational for now). */
  voice?: string;
  /** Injectable for tests; defaults to a real AudioService. */
  service?: Pick<AudioService, "fetchWordAudio">;
  /** Injectable for tests; defaults to the module-level session cache. */
  cache?: AudioUrlCache;
  /**
   * TTS-input contract: resolve non-Hanzi input (pinyin in any format) to a
   * Hanzi glyph BEFORE the /v1/tts POST. When omitted (or returning null),
   * non-Hanzi input is silently skipped — never POSTed, never browser-TTS'd.
   */
  resolveHanzi?: (text: string) => string | null;
  /** Bypass Hanzi detection: treat `text` as Chinese TTS input as-is. */
  textIsChinese?: boolean;
}

/** Shared session cache for word audio, keyed `word#<id>`. */
export const wordAudioCache = new AudioUrlCache();

/** Resolve a possibly-relative backend URL against the API base. */
export function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_CONFIG.baseURL}${url}`;
  }
  return url;
}

/** Attach an optional voice hint to a candidate when provided. */
function withVoice(source: PlayableSource, voice?: string): PlayableSource {
  return voice ? { ...source, voice } : source;
}

/**
 * TTS-input guard: never let pinyin reach /v1/tts (or browser TTS).
 * - `textIsChinese` → use text as-is (caller guarantees it is Chinese).
 * - already-Hanzi → use text as-is (fast path, no resolution).
 * - otherwise resolve via the injected resolver; null ⇒ silent skip (`null`).
 */
function resolveTtsText(text: string, options: WordContractOptions): string | null {
  if (options.textIsChinese) return text;
  if (isHanziText(text)) return text;
  const target = options.resolveHanzi?.(text) ?? "";
  return target || null;
}

/**
 * Build the candidate list for one word, cached/deduped keyed `word#<id>`.
 * Returns `PlayableSource[]` per the contract above.
 */
export async function buildWordItem(
  text: string,
  options: WordContractOptions = {},
): Promise<PlayableSource[]> {
  const lang = options.lang ?? LANGUAGE_CODES.CHINESE;
  const id = options.id ?? text;
  const service = options.service ?? new AudioService();
  const cache = options.cache ?? wordAudioCache;
  const key = `word#${id}`;

  // TTS-input contract (Phase 1b): resolve non-Hanzi input before the POST.
  // Unresolvable pinyin → silent skip (empty candidates, same semantics as the
  // auth/rate-limit skip — never a TTS loop on pinyin). The guard runs BEFORE
  // the dedupe so a skip is not cached and a later play can retry once the map
  // becomes available.
  const chinese = resolveTtsText(text, options);
  if (!chinese) return [];

  return cache.dedupe(key, async () => {
    try {
      const audio = await service.fetchWordAudio({ chinese });
      if (audio.audioUrl) {
        return [
          withVoice(
            {
              kind: "url",
              url: toAbsoluteUrl(audio.audioUrl),
              // Backend `cached` flag → source "cached" (pre-synthesized file) or
              // "ondemand" (absent/`false` defaults to on-demand).
              source: audio.cached ? "cached" : "ondemand",
            },
            options.voice,
          ),
        ];
      }
      // Success without a URL → browser-TTS fallback (speaks the resolved glyph).
      return [withVoice({ kind: "tts", text: chinese, lang }, options.voice)];
    } catch (err) {
      if (err instanceof WordAudioError) {
        if (err.kind === "auth" || err.kind === "rate-limit") {
          // Silent skip — never spin a TTS loop on auth/rate-limit failures.
          return [];
        }
        // Network / 5xx → browser-TTS fallback (speaks the resolved glyph).
        return [withVoice({ kind: "tts", text: chinese, lang }, options.voice)];
      }
      return [];
    }
  });
}

/** Build a single-item `PlayableItem` for `text`. */
export async function buildWordPlayableItem(
  text: string,
  options: WordContractOptions = {},
): Promise<PlayableItem> {
  const id = options.id ?? text;
  return {
    id,
    candidates: await buildWordItem(text, options),
    title: text,
  };
}

/**
 * Default word behavior: strategy `"single"`, lazy sources (resolved on play),
 * and `onUrlFailed` evicts the word cache then falls back (to the next
 * candidate, or skip if none).
 */
export function defaultWordBehavior(
  text: string,
  options: WordContractOptions = {},
): AudioBehavior {
  return {
    strategy: "single",
    sources: async () => [await buildWordPlayableItem(text, options)],
    onUrlFailed: (item) => {
      (options.cache ?? wordAudioCache).evict(`word#${item.id}`);
      return "fallback";
    },
  };
}
