/**
 * @file apps/backend/src/shared/services/TtsService.js
 * @description TTS business logic — two-tier cache orchestration.
 *
 * Clean architecture: service layer handles the business flow;
 * controllers handle HTTP mapping; infrastructure handles I/O.
 *
 * Two-tier caching:
 *   L1: Redis — stores the GCS URL (string, safe to JSON-serialize).
 *   L2: GCS — stores the audio MP3 (persistent).
 *
 * Flow:
 *   1. Redis check (URL string, ~2ms)
 *   2. Verify GCS file exists (validate URL isn't stale)
 *   3. Return URL if valid
 *   4. If stale, invalidate Redis, fall through
 *   5. GCS fallback check (Redis lost but file exists)
 *   6. If GCS hit, cache URL in Redis, return URL
 *   7. If GCS miss, call Google TTS API → upload → cache URL → return URL
 */

import { computeTTSHash } from "../utils/hashUtils.js";
import { TTS_STORAGE_PATH } from "../config/tts.js";
import { ttsError, validationError } from "../utils/errorFactory.js";
import { createLogger } from "../utils/logger.js";
import { config } from "../config/index.js";

const logger = createLogger("TtsService");

export interface TtsResult {
  audioUrl: string;
  cached: boolean;
}

interface CacheServiceLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface GcsClientLike {
  fileExists(path: string): Promise<boolean>;
  uploadFile(
    path: string,
    data: Buffer | Uint8Array | string | undefined,
    contentType: string,
  ): Promise<void>;
  getPublicUrl(path: string): string;
}

interface TtsClientLike {
  synthesizeSpeech(
    text: string,
    options: Record<string, unknown>,
  ): Promise<Uint8Array | string | undefined>;
  healthCheck(): Promise<boolean>;
}

export class TtsService {
  private cacheService: CacheServiceLike;
  private gcsClient: GcsClientLike;
  private ttsClient: TtsClientLike;

  constructor(cacheService: CacheServiceLike, gcsClient: GcsClientLike, ttsClient: TtsClientLike) {
    this.cacheService = cacheService;
    this.gcsClient = gcsClient;
    this.ttsClient = ttsClient;
  }

  /**
   * Get TTS audio URL for the given text and voice.
   * Two-tier cache: Redis (URL string) → GCS (MP3 file) → Google TTS API.
   *
   * @param text - Text to synthesize
   * @param voice - Voice name (e.g. "cmn-CN-Wavenet-B")
   * @returns Object with audioUrl and cached flag
   */
  async getTtsUrl(text: string, voice: string = config.tts.voiceDefault): Promise<TtsResult> {
    if (!text || text.trim() === "") {
      throw validationError("Text is required.");
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > config.tts.maxWords) {
      throw validationError(`Please enter between 1 and ${config.tts.maxWords} words.`);
    }

    const hash = computeTTSHash(text, voice);
    const cachePath = TTS_STORAGE_PATH.replace("{hash}", hash);
    const redisKey = `tts:url:${hash}`;
    const ttl = 86400; // 24 hours

    try {
      // ── Step 1: Check Redis L1 cache ──────────────────────────────────
      const cachedUrl = await this.cacheService.get(redisKey);
      if (cachedUrl !== null) {
        logger.info(`Redis cache hit: ${redisKey}`);

        // ── Step 2: Verify GCS file still exists (stale detection) ────────
        const exists = await this.gcsClient.fileExists(cachePath);
        if (exists) {
          logger.cacheHit?.(cachePath);
          return { audioUrl: cachedUrl, cached: true };
        }

        // ── Step 4: Stale entry — invalidate Redis, regenerate ──────────
        logger.warn(`Redis cache stale — GCS file missing: ${cachePath}`);
        await this.cacheService.delete(redisKey).catch(() => {});
      }

      // ── Step 5: GCS L2 fallback check ─────────────────────────────────
      const gcsExists = await this.gcsClient.fileExists(cachePath);
      if (gcsExists) {
        logger.cacheHit?.(cachePath);
        const url = this.gcsClient.getPublicUrl(cachePath);
        // Populate Redis for next time
        await this.cacheService.set(redisKey, url, ttl).catch(() => {});
        return { audioUrl: url, cached: true };
      }

      // ── Step 7: Cache miss — generate new audio ───────────────────────
      logger.cacheMiss?.(cachePath);
      logger.info(`Generating TTS audio: "${text.substring(0, 30)}" (voice: ${voice})`);
      const audioBuffer = await this.ttsClient.synthesizeSpeech(text, { voice });

      await this.gcsClient.uploadFile(cachePath, audioBuffer, "audio/mpeg");
      logger.info(`Uploaded to GCS: ${cachePath}`);

      const audioUrl = this.gcsClient.getPublicUrl(cachePath);

      // Best-effort Redis cache write
      await this.cacheService.set(redisKey, audioUrl, ttl).catch((err: Error) => {
        logger.warn(`Redis cache write failed: ${err.message}`);
      });

      return { audioUrl, cached: false };
    } catch (error) {
      const err = error as { code?: number; details?: string; message?: string };
      if (err.code === 7 || err.details?.includes("API key not valid")) {
        throw ttsError("Authentication error with TTS/GCS API. Check local backend logs.", {
          originalError: err.message,
        });
      } else if (err.code === 3 && err.details?.includes("Billing account not enabled")) {
        throw ttsError("Google Cloud Billing not enabled. Check local backend logs.", {
          originalError: err.message,
        });
      } else if (err.code === 403 && err.details?.includes("Forbidden")) {
        throw ttsError(
          "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
          { originalError: err.message },
        );
      }
      throw ttsError(err.message || "TTS generation failed", {
        originalError: err.message,
      });
    }
  }

  /**
   * Health check — delegates to the underlying TTS client.
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.ttsClient.healthCheck();
    } catch {
      return false;
    }
  }
}
