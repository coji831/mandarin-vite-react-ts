/**
 * @file apps/backend/src/shared/services/TtsService.js
 * @description TTS business logic — two-tier cache orchestration.
 *
 * Clean architecture: service layer handles the business flow;
 * controllers handle HTTP mapping; infrastructure handles I/O.
 *
 * Two-tier caching:
 *   L1: Redis — stores the GCS FILE PATH (string, safe to JSON-serialize).
 *   L2: GCS — stores the audio MP3 (persistent).
 *
 * The returned URL is always a SHORT-LIVED SIGNED GCS URL, re-signed on every
 * read. Signed URLs are self-authenticating (auth is in the query string), so
 * a browser <audio>/Audio() element — which cannot attach Authorization
 * headers — can play them without requiring the bucket to be publicly
 * readable. We cache the file path rather than the signed URL because signed
 * URLs expire and would otherwise be served stale from Redis.
 *
 * Flow:
 *   1. Redis check (file path, ~2ms)
 *   2. Verify GCS file exists (validate path isn't stale)
 *   3. Re-sign a fresh URL and return it
 *   4. If stale, invalidate Redis, fall through
 *   5. GCS fallback check (Redis lost but file exists)
 *   6. If GCS hit, cache path in Redis, return signed URL
 *   7. If GCS miss, call Google TTS API → upload → cache path → return signed URL
 */

import { computeTTSHash } from "../utils/hashUtils.js";
import { TTS_STORAGE_PATH, TTS_SIGNED_URL_TTL_SECONDS } from "../config/tts.js";
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
  getSignedUrl(path: string, expirySeconds?: number): Promise<string>;
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
   * Two-tier cache: Redis (file path) → GCS (MP3 file) → Google TTS API.
   * Always returns a freshly signed, browser-playable URL.
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
    // Redis stores the FILE PATH, not the signed URL — signed URLs expire and
    // must be re-signed on each read (see header comment).
    const redisKey = `tts:path:${hash}`;
    const ttl = 86400; // 24 hours

    try {
      // ── Step 1: Redis L1 cache (file path) ───────────────────────────────
      const cachedPath = await this.cacheService.get(redisKey);
      const resolvedPath = cachedPath ?? cachePath;

      // ── Step 2: Verify GCS file still exists, then sign a fresh URL ──────
      if (await this.gcsClient.fileExists(resolvedPath)) {
        logger.cacheHit?.(resolvedPath);
        const audioUrl = await this.gcsClient.getSignedUrl(
          resolvedPath,
          TTS_SIGNED_URL_TTL_SECONDS,
        );
        // Backfill Redis if this was a GCS-only hit
        if (cachedPath === null) {
          await this.cacheService.set(redisKey, resolvedPath, ttl).catch(() => {});
        }
        return { audioUrl, cached: true };
      }

      // ── Stale entry — invalidate Redis, regenerate ───────────────────────
      if (cachedPath !== null) {
        logger.warn(`Redis cache stale — GCS file missing: ${resolvedPath}`);
        await this.cacheService.delete(redisKey).catch(() => {});
      }

      // ── Cache miss — synthesize + upload + sign ──────────────────────────
      logger.cacheMiss?.(cachePath);
      logger.info(`Generating TTS audio: "${text.substring(0, 30)}" (voice: ${voice})`);
      const audioBuffer = await this.ttsClient.synthesizeSpeech(text, { voice });

      await this.gcsClient.uploadFile(cachePath, audioBuffer, "audio/mpeg");
      logger.info(`Uploaded to GCS: ${cachePath}`);

      const audioUrl = await this.gcsClient.getSignedUrl(cachePath, TTS_SIGNED_URL_TTL_SECONDS);

      // Best-effort Redis cache write (path, not URL)
      await this.cacheService.set(redisKey, cachePath, ttl).catch((err: Error) => {
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
