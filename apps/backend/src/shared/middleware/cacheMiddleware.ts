/**
 * @file apps/backend/src/shared/middleware/cacheMiddleware.ts
 * @description Cache middleware — decorator pattern for transparent caching.
 *
 * Services remain pure business logic; caching is applied at the composition root.
 *
 * Usage (in container.js):
 *   import { withCache } from "./shared/middleware/cacheMiddleware.js";
 *
 *   // Simple Redis-backed caching
 *   const cachedGenerateFeedback = withCache(
 *     (params) => someService.someMethod(params),
 *     {
 *       ttl: 86400,
 *       keyFn: ({ wordId }) => `service:${wordId}`,
 *       serviceName: "SomeService",
 *       cacheService: myCacheService,
 *     }
 *   );
 */

import { createLogger } from "../utils/logger.js";

const logger = createLogger("CacheMiddleware");

interface CacheOptions {
  ttl: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyFn: (...args: any[]) => string;
  serviceName?: string;
  cacheService: import("../infrastructure/cache/CacheService.js").CacheService;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  total: number;
  hitRate: string;
}

/**
 * Simple Redis-backed cache decorator.
 * Wraps a service method with cache-aside pattern (check → return || call → set).
 *
 * @param serviceMethod - The pure business logic function to wrap
 * @param options
 * @param options.ttl - Cache TTL in seconds
 * @param options.keyFn - Cache key generator, receives the same args as serviceMethod
 * @param options.serviceName - Name for metrics registration
 * @returns Wrapped function with .getMetrics() attached
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function withCache(
  serviceMethod: (...args: any[]) => Promise<unknown>,
  { ttl, keyFn, serviceName = "unknown", cacheService }: CacheOptions,
): ((...args: any[]) => Promise<unknown>) & { getMetrics: () => CacheMetrics } {
  const metrics = { hits: 0, misses: 0, total: 0 };

  const wrapped = async (...args: any[]) => {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const cache = cacheService;
    const key = typeof keyFn === "function" ? keyFn(...args) : args[0];

    try {
      const cached = await cache.get(key);
      if (cached !== null) {
        metrics.hits++;
        metrics.total++;
        logger.cacheHit?.(key);
        // Attempt to parse JSON; return raw string if not valid JSON
        try {
          return JSON.parse(cached);
        } catch {
          return cached;
        }
      }
    } catch (err) {
      const e = err as Error;
      logger.warn(`[${serviceName}] Cache read failed, continuing without cache: ${e.message}`);
      // Continue to service method on cache failure (fail-open)
    }

    metrics.misses++;
    metrics.total++;
    logger.cacheMiss?.(key);

    const result = await serviceMethod(...args);

    // Best-effort cache write
    try {
      const serialized = typeof result === "object" ? JSON.stringify(result) : String(result);
      await cache.set(key, serialized, ttl);
    } catch (err) {
      const e = err as Error;
      logger.warn(`[${serviceName}] Cache write failed, result returned anyway: ${e.message}`);
    }

    return result;
  };

  /**
   * Get cache metrics for monitoring
   * @returns {{ hits: number, misses: number, total: number, hitRate: string }}
   */
  wrapped.getMetrics = () => {
    const total = metrics.hits + metrics.misses;
    const hitRate = total > 0 ? ((metrics.hits / total) * 100).toFixed(2) : "0.00";
    return {
      hits: metrics.hits,
      misses: metrics.misses,
      total,
      hitRate,
    };
  };

  return wrapped;
}
