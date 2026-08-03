/**
 * @file apps/backend/src/modules/audio/services/AudioSynthesizer.ts
 * @description The unified exists-or-synthesize audio primitive (D4).
 *
 * Flow: GCS exists-check → hit: re-sign fresh URL + `{cached:true}`;
 * miss: GoogleTTS synthesize → GCS upload → sign → record path in Redis →
 * `{cached:false}`. The two-tier cache collapses into "exists? cached :
 * synthesize" — GCS existence is the source of truth, Redis is a soft path
 * cache written on miss (write-only at runtime; `getPath` is unused).
 *
 * Per-path single-flight via AudioPathCache.dedupe ensures N concurrent calls for
 * the same path trigger exactly ONE upstream synthesize.
 *
 * Decoupling note: the Tier-0 GoogleTTSClient carries ZERO capability config —
 * `synthesizeOnce` passes `{ voice, languageCode, audioEncoding }` explicitly
 * from modules/audio/config.ts so shared/infrastructure never imports a module.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { audioConfig } from "../config.js";
import { classifyTtsError } from "./errors.js";
import { pathHash } from "./paths.js";
import type { AudioPathCache } from "./AudioPathCache.js";
import type { GcsClientLike, TtsClientLike, AudioResult } from "../types/audio.js";

const logger = createLogger("AudioSynthesizer");

export class AudioSynthesizer {
  constructor(
    private readonly pathCache: AudioPathCache,
    private readonly gcs: GcsClientLike,
    private readonly tts: TtsClientLike,
  ) {}

  /**
   * Resolve audio for `text` at the given `path`:
   * exists → `{audioUrl, cached:true}`, else synthesize+upload → `{cached:false}`.
   * @param text - Text to synthesize (only used on cache miss)
   * @param path - Target GCS path (word: `tts/{hash}.mp3`, passage: `tts/{passageHash}/{i}.mp3`)
   * @param voice - TTS voice name (defaults to the audio config default)
   */
  async synthesizeToPath(text: string, path: string, voice?: string): Promise<AudioResult> {
    return this.pathCache.dedupe(`synthesize:${path}`, () =>
      this.synthesizeOnce(text, path, voice),
    );
  }

  private async synthesizeOnce(text: string, path: string, voice?: string): Promise<AudioResult> {
    try {
      // ── exists? cached : synthesize (D4) ────────────────────────────────
      if (await this.gcs.fileExists(path)) {
        logger.cacheHit?.(path);
        const audioUrl = await this.gcs.getSignedUrl(path, audioConfig.signedUrlTtlSeconds);
        return { audioUrl, cached: true };
      }

      logger.cacheMiss?.(path);
      logger.info(
        `Generating TTS audio: "${text.substring(0, 30)}" (voice: ${voice ?? audioConfig.voiceDefault})`,
      );
      // Config values passed explicitly — shared Tier-0 client has no module config.
      const audioBuffer = await this.tts.synthesizeSpeech(text, {
        voice: voice ?? audioConfig.voiceDefault,
        languageCode: audioConfig.languageCode,
        audioEncoding: audioConfig.audioEncoding,
      });

      await this.gcs.uploadFile(path, audioBuffer, "audio/mpeg");
      logger.info(`Uploaded to GCS: ${path}`);

      const audioUrl = await this.gcs.getSignedUrl(path, audioConfig.signedUrlTtlSeconds);

      // Soft Redis path cache (best-effort) — records the path for future reads/pre-gen.
      await this.pathCache.setPath(pathHash(path), path);

      return { audioUrl, cached: false };
    } catch (error) {
      throw classifyTtsError(error);
    }
  }
}
