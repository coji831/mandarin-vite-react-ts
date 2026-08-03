/**
 * @file shared/audio/AudioUrlCache.ts
 * @description Session-scoped cache for resolved audio candidates + in-flight dedupe.
 *
 * Phase 2 (candidates-as-data): the cache now stores ordered candidate lists
 * (`PlayableSource[]`) instead of `ResolvedSource` — e.g. `word#<id>` → the
 * item's candidate array. Two rapid plays of the same item share one in-flight
 * resolution (no double-fetch). Empty candidate lists (silent skip) are never
 * cached so a later play can still succeed.
 */

import type { PlayableSource } from "./types";

export class AudioUrlCache {
  private cache = new Map<string, PlayableSource[]>();
  private inFlight = new Map<string, Promise<PlayableSource[]>>();

  get(key: string): PlayableSource[] | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, source: PlayableSource[]): void {
    // Never cache empty (silent-skip) candidate lists — allow a retry to
    // succeed later.
    if (source.length === 0) return;
    this.cache.set(key, source);
  }

  evict(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Resolve `key` through `loader`, deduping concurrent loads. Returns the
   * cached candidates when present, otherwise joins an in-flight promise or
   * runs the loader. Empty results are not cached and are returned as-is.
   */
  async dedupe(key: string, loader: () => Promise<PlayableSource[]>): Promise<PlayableSource[]> {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = loader()
      .then((source) => {
        this.inFlight.delete(key);
        this.set(key, source);
        return source;
      })
      .catch((err: unknown) => {
        this.inFlight.delete(key);
        throw err;
      });
    this.inFlight.set(key, promise);
    return promise;
  }
}
