/**
 * @file apps/backend/src/modules/audio/services/paths.ts
 * @description Audio storage path conventions + hashing. `computeTTSHash` moved
 * here from shared/utils/hashUtils (D6); the generic `computeHash` stays in
 * hashUtils.
 */

import { computeHash } from "../../../shared/utils/hashUtils.js";
import { TTS_STORAGE_PATH } from "../config.js";

/**
 * Generate a consistent cache key for TTS audio.
 * @param text - Text to synthesize
 * @param voice - TTS voice name
 * @returns SHA256 hex digest
 */
export function computeTTSHash(text: string, voice: string): string {
  return computeHash(`${text}-${voice}`);
}

/** Default word-audio path: `tts/{hash}.mp3`. */
export function defaultWordPath(hash: string): string {
  return TTS_STORAGE_PATH.replace("{hash}", hash);
}

/** Passage sentence path: `tts/{passageHash}/{index}.mp3` (D4 — unified with pre-gen). */
export function passagePath(passageHash: string, index: number): string {
  return `tts/${passageHash}/${index}.mp3`;
}

/** Passage-level hash: SHA256 of the concatenated sentence texts. */
export function passageHashFor(sentenceTexts: string[]): string {
  return computeHash(sentenceTexts.join(""));
}

/**
 * Extract the cache-hash segment from an audio storage path.
 * Word:   `tts/{hash}.mp3`            → `{hash}`
 * Passage: `tts/{passageHash}/{i}.mp3` → `{passageHash}`
 * Used to key the Redis path cache (tts:path:{hash}) from an arbitrary path.
 */
export function pathHash(path: string): string {
  const withoutPrefix = path.replace(/^tts\//, "").replace(/\.mp3$/, "");
  return withoutPrefix.split("/")[0] ?? "";
}
