/**
 * cache.ts
 *
 * Lightweight in-memory TTL cache used by early performance/infra work for the Mandarin feature.
 * This file is intentionally small and optional — include only when a cache is justified.
 * Testing and heavier infra are out-of-scope for Story 9.1 per project guidance.
 */

type CacheEntry<T> = { value: T; expiresAt: number };
const store = new Map<string, CacheEntry<any>>();

export function setCache<T>(key: string, value: T, ttlMs = 60_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getCache<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (e.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function clearCache(key: string) {
  store.delete(key);
}
