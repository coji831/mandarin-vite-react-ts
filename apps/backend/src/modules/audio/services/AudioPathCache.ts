/**
 * @file apps/backend/src/modules/audio/services/AudioPathCache.ts
 * @description Audio path cache (Redis) + per-key single-flight (stampede guard).
 *
 * Redis stores the GCS FILE PATH (not the signed URL — signed URLs expire and
 * would otherwise be served stale). Writes are best-effort: a Redis outage must
 * never fail an audio request.
 *
 * Runtime note: at request time this cache is WRITE-ONLY — `setPath` is the
 * only interaction (on fresh create). `getPath` is unused in the request path;
 * it exists for unit tests and the future pre-gen story. GCS existence is the
 * single source of truth, so a hot cache hit == a cold cache hit.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { CacheServiceLike } from "../types/audio.js";

const logger = createLogger("AudioPathCache");

/** TTL for path entries (seconds) — 24 hours. */
export const AUDIO_PATH_TTL = 86400;

export class AudioPathCache {
  private readonly cache: CacheServiceLike;
  /** In-flight promises keyed by dedupe key — coalesces concurrent identical calls. */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(cache: CacheServiceLike) {
    this.cache = cache;
  }

  private keyFor(hash: string): string {
    return `tts:path:${hash}`;
  }

  /** Read the cached file path for a hash (unused at runtime; pre-gen/unit tests). */
  async getPath(hash: string): Promise<string | null> {
    return this.cache.get(this.keyFor(hash));
  }

  /** Record the file path for a hash. Best-effort — never throws. */
  async setPath(hash: string, path: string): Promise<void> {
    await this.cache.set(this.keyFor(hash), path, AUDIO_PATH_TTL).catch((err: Error) => {
      logger.warn(`Audio path cache write failed: ${err.message}`);
    });
  }

  /** Invalidate a cached path entry. Best-effort — never throws. */
  async deletePath(hash: string): Promise<void> {
    await this.cache.delete(this.keyFor(hash)).catch((err: Error) => {
      logger.warn(`Audio path cache delete failed: ${err.message}`);
    });
  }

  /**
   * Single-flight dedupe: concurrent calls with the same key share one in-flight
   * promise. When it settles (success or failure) the entry is removed so a
   * later call retries. N concurrent `synthesizeToPath(sameText, samePath)` →
   * exactly ONE upstream synthesize.
   */
  dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = fn().finally(() => {
      this.inflight.delete(key);
    });
    this.inflight.set(key, promise);
    return promise;
  }
}
