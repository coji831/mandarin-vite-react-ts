/**
 * @file apps/backend/src/modules/audio/services/AudioService.ts
 * @description Audio facade implementing AudioServiceLike by composing the
 * modules/audio capability: AudioSynthesizer (exists-or-synthesize) +
 * AudioPathCache (Redis path cache + single-flight) + AudioUrlSigner (signed
 * URLs). Consumed by modules via the `AudioServiceLike` port.
 *
 * Constructor DI preserved: `new AudioService(cacheService, gcsClient, ttsClient)`.
 */

import { audioConfig } from "../config.js";
import { computeTTSHash, defaultWordPath } from "./paths.js";
import { AudioPathCache } from "./AudioPathCache.js";
import { AudioSynthesizer } from "./AudioSynthesizer.js";
import { AudioUrlSigner } from "./AudioUrlSigner.js";
import { validationError } from "../../../shared/utils/errorFactory.js";
import { isHanziText } from "@mandarin/shared-utils";
import type {
  CacheServiceLike,
  GcsClientLike,
  TtsClientLike,
  AudioResult,
  AudioServiceLike,
} from "../types/audio.js";

export class AudioService implements AudioServiceLike {
  private readonly synthesizer: AudioSynthesizer;
  private readonly pathCache: AudioPathCache;
  private readonly urlSigner: AudioUrlSigner;
  private readonly ttsClient: TtsClientLike;

  constructor(cacheService: CacheServiceLike, gcsClient: GcsClientLike, ttsClient: TtsClientLike) {
    this.pathCache = new AudioPathCache(cacheService);
    this.synthesizer = new AudioSynthesizer(this.pathCache, gcsClient, ttsClient);
    this.urlSigner = new AudioUrlSigner(gcsClient);
    this.ttsClient = ttsClient;
  }

  /**
   * Get a TTS audio URL for the given text and voice.
   * Validates input (non-empty, ≤ maxWords) then delegates to the unified
   * synthesizeToPath primitive on the default word path `tts/{hash}.mp3`.
   * Always returns a freshly signed, browser-playable URL.
   *
   * @param text - Text to synthesize
   * @param voice - Voice name (e.g. "cmn-CN-Wavenet-B")
   * @returns Object with audioUrl and cached flag
   */
  async getTtsUrl(text: string, voice: string = audioConfig.voiceDefault): Promise<AudioResult> {
    if (!text || text.trim() === "") {
      throw validationError("Text is required.");
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > audioConfig.maxWords) {
      throw validationError(`Please enter between 1 and ${audioConfig.maxWords} words.`);
    }

    // TTS accepts Hanzi only — pinyin (e.g. "bā", "ba1") must never reach the
    // TTS client. The FE silent-skips non-Hanzi; this is defense in depth at
    // the boundary, rejected as a 400 in the repo's consistent error format.
    if (!isHanziText(text)) {
      throw validationError(
        "Failed to generate TTS audio — text must contain Chinese characters (Hanzi)",
      );
    }

    const hash = computeTTSHash(text, voice);
    return this.synthesizer.synthesizeToPath(text, defaultWordPath(hash), voice);
  }

  /**
   * Unified exists-or-synthesize primitive (D4) — used by passage on-demand to
   * write to `tts/{passageHash}/{i}.mp3`, identical to future pre-gen paths.
   */
  async synthesizeToPath(text: string, path: string, voice?: string): Promise<AudioResult> {
    return this.synthesizer.synthesizeToPath(text, path, voice);
  }

  /** Re-sign a fresh short-lived URL for an existing GCS path. */
  async getSignedUrl(path: string, expirySeconds?: number): Promise<string> {
    return this.urlSigner.getSignedUrl(path, expirySeconds);
  }

  /** Health check — delegates to the underlying TTS client. */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.ttsClient.healthCheck();
    } catch {
      return false;
    }
  }
}
