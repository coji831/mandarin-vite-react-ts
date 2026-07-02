/**
 * @file apps/backend/src/shared/middleware/cacheMiddleware.js
 * @description Cache middleware — decorator pattern for transparent caching.
 *
 * Replaces all Cached*Service wrapper classes with a single composable decorator.
 * Services remain pure business logic; caching is applied at the composition root.
 *
 * Usage (in container.js):
 *   import { withCache } from "./shared/middleware/cacheMiddleware.js";
 *
 *   // Simple Redis-backed caching
 *   export const cachedGenerateFeedback = withCache(
 *     (params) => aiFeedbackService.generateFeedback(params),
 *     {
 *       ttl: 86400,
 *       keyFn: ({ wordId, userAnswer }) => `quiz:feedback:${wordId}:${userAnswer.toLowerCase()}`,
 *       serviceName: "AIFeedback",
 *     }
 *   );
 *
 * See: docs/guides/references/modular-monolith-plan.md Phase 5
 * See: docs/guides/references/module-architecture-guide.md Section 4.1
 */

import { CacheFactory } from "../../shared/infrastructure/cache/CacheFactory.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("CacheMiddleware");

interface CacheOptions {
  ttl: number;
  keyFn: (...args: any[]) => string;
  serviceName?: string;
}

interface CacheMetrics {
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
export function withCache(
  serviceMethod: (...args: any[]) => Promise<any>,
  { ttl, keyFn, serviceName = "unknown" }: CacheOptions,
): ((...args: any[]) => Promise<any>) & { getMetrics: () => CacheMetrics } {
  const metrics = { hits: 0, misses: 0, total: 0 };

  const wrapped = async (...args: any[]) => {
    const cache = await CacheFactory.create("default");
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
      const e = err as any;
      logger.warn(`[${serviceName}] Cache read failed, continuing without cache: ${e.message}`);
      // Continue to service method on cache failure (fail-open)
    }

    metrics.misses++;
    metrics.total++;
    logger.cacheMiss?.(key);

    const result = await serviceMethod(...args);

    // Best-effort cache write
    try {
      const serialized = typeof result === "object" ? JSON.stringify(result) : result;
      await cache.set(key, serialized, ttl);
    } catch (err) {
      const e = err as any;
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
