/**
 * @file features/readers/audio/PassageAudioBehavior.ts
 * @description Passage audio behavior contract for graded readers (Phase D1 → 2).
 *
 * Phase 2 (candidates-as-data): the readers-owned `PassageAudioResolver` is
 * retired — this module BUILDS an `AudioBehavior` contract (sequence strategy;
 * `sources` = one pre-resolved `PlayableItem` per sentence) that the shared
 * manager plays as a pure transport.
 *
 * Shared fetch path (guests + users are identical):
 *   `POST /v1/readers/passages/:id/audio` is `optionalAuth` — guests POST and
 *   receive real signed URLs exactly like users. There is NO guest
 *   short-circuit; everyone uses the single lazy async producer:
 *     - entry `source:"gcs"|"ondemand"` with a URL → candidates `[url, tts]`
 *       (URL plays; a URL that plays-but-errors falls back to browser-TTS via
 *       the candidate loop)
 *     - entry `source:"failed"` / missing / empty URL → candidates `[]`
 *       (silent skip — never a TTS loop)
 *   A fetch failure → every sentence gets `[]` (silent skip, never a spinner).
 *   GCS cold-cache is the cost protector (on-demand synthesis, no guest
 *   exemption — same access for everyone).
 */

import { LANGUAGE_CODES } from "@mandarin/shared-constants";
import { toAbsoluteUrl } from "shared/audio";
import type { AudioBehavior, PlayableItem } from "shared/audio";
import { fetchPassageAudio } from "../services/passageService";
import type { SentenceAudioMap } from "../types";

export interface PassageAudioBehaviorOptions {
  passageId: string;
  /** Sentences to build one PlayableItem per sentence (in order). */
  sentences: Array<{ index: number; text: string }>;
  /** Injectable for tests; defaults to the real passageService.fetchPassageAudio. */
  fetchAudio?: typeof fetchPassageAudio;
}

/** Build a silent-skip sentence item (missing/failed entry, empty candidates). */
function emptyItem(index: number, text: string): PlayableItem {
  return {
    id: String(index),
    candidates: [],
    title: text,
  };
}

/**
 * Build the passage audio behavior for the shared manager.
 *
 * Guests and users share ONE path: `sources` is a lazy async producer (one
 * POST per passage, in-flight deduped) mapping each sentence to `[url, tts]`
 * candidates or `[]`. `POST /v1/readers/passages/:id/audio` is `optionalAuth`
 * — guests get real signed URLs, identical to users.
 */
export function buildPassageAudioBehavior(options: PassageAudioBehaviorOptions): AudioBehavior {
  const { passageId, sentences } = options;
  const fetchAudio = options.fetchAudio ?? fetchPassageAudio;

  let mapPromise: Promise<SentenceAudioMap> | null = null;
  const getAudioMap = (): Promise<SentenceAudioMap> => {
    if (!mapPromise) {
      mapPromise = fetchAudio(passageId)
        .then((data) => data.audioUrls ?? {})
        .catch((err: unknown) => {
          // Clear so a later play can re-attempt the fetch.
          mapPromise = null;
          throw err;
        });
    }
    return mapPromise;
  };

  return {
    strategy: "sequence",
    sources: async () => {
      let map: SentenceAudioMap;
      try {
        map = await getAudioMap();
      } catch {
        // Backend POST failed (network / 5xx) → silent skip every sentence
        // (parity: never a spinner). A later play re-attempts the fetch.
        return sentences.map((s) => emptyItem(s.index, s.text));
      }
      return sentences.map((s) => {
        const entry = map[s.index];
        if (entry && (entry.source === "gcs" || entry.source === "ondemand") && entry.url) {
          return {
            id: String(s.index),
            // URL first; browser-TTS fallback if the URL plays-but-errors.
            candidates: [
              { kind: "url", url: toAbsoluteUrl(entry.url), source: entry.source },
              { kind: "tts", text: s.text, lang: LANGUAGE_CODES.CHINESE },
            ],
            title: s.text,
          };
        }
        // `source:"failed"` / missing / empty URL → silent skip (never a TTS loop).
        return emptyItem(s.index, s.text);
      });
    },
    onUrlFailed: () => "fallback",
  };
}
