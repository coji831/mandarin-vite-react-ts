/**
 * @file apps/backend/src/shared/middleware/cacheMiddleware.js
 * @description Cache middleware — decorator pattern for transparent caching.
 *
 * Replaces all Cached*Service wrapper classes with a single composable decorator.
 * Services remain pure business logic; caching is applied at the composition root.
 *
 * Usage (in container.js):
 *   import { withCache, withGcsCache } from "./shared/middleware/cacheMiddleware.js";
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
 *   // GCS-backed caching with single-flight lock
 *   export const cachedGenerateExamples = withGcsCache(
 *     (word, hskLevel, language) => rawExampleService.generateExamples(word, hskLevel, language),
 *     {
 *       hmacManager,
 *       gcsService: examplesGcsService,
 *       lockManager: redisLockManager,
 *       serviceName: "Examples",
 *     }
 *   );
 *
 * See: docs/guides/references/modular-monolith-plan.md Phase 5
 * See: docs/guides/references/module-architecture-guide.md Section 4.1
 */

import { CacheFactory } from "../../shared/infrastructure/cache/CacheFactory.js";
import { createLogger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const logger = createLogger("CacheMiddleware");

/**
 * Simple Redis-backed cache decorator.
 * Wraps a service method with cache-aside pattern (check → return || call → set).
 *
 * @param {Function} serviceMethod - The pure business logic function to wrap
 * @param {Object} options
 * @param {number} options.ttl - Cache TTL in seconds
 * @param {Function} options.keyFn - Cache key generator, receives the same args as serviceMethod
 * @param {string} [options.serviceName="unknown"] - Name for metrics registration
 * @returns {Function} Wrapped function with .getMetrics() attached
 */
export function withCache(serviceMethod, { ttl, keyFn, serviceName = "unknown" }) {
  const metrics = { hits: 0, misses: 0, total: 0 };

  const wrapped = async (...args) => {
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
      logger.warn(`[${serviceName}] Cache read failed, continuing without cache: ${err.message}`);
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
      logger.warn(`[${serviceName}] Cache write failed, result returned anyway: ${err.message}`);
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

/**
 * GCS-backed cache decorator with Redis single-flight lock.
 * Used for expensive operations where GCS serves as the cache backend
 * and Redis prevents thundering herd during cache misses.
 *
 * @param {Function} serviceMethod - The pure business logic function to wrap
 * @param {Object} options
 * @param {Object} options.hmacManager - HmacManager instance for key derivation
 * @param {Object} options.gcsService - GCS service with get(objectPath) and set(objectPath, obj)
 * @param {Object} options.lockManager - RedisLockManager instance
 * @param {Object} [options.logger] - Optional logger instance
 * @param {string} [options.serviceName="Examples"] - Name for metrics registration
 * @returns {Function} Wrapped function
 */
export function withGcsCache(
  serviceMethod,
  { hmacManager, gcsService, lockManager, serviceName = "Examples" },
) {
  const metrics = { hits: 0, misses: 0, total: 0 };

  /**
   * Build GCS object path from HMAC-derived key
   * @param {string} hmacKey
   * @returns {string} GCS object path
   */
  function objectPathFromKey(hmacKey) {
    return `examples/${hmacKey}.json`;
  }

  const wrapped = async (...args) => {
    const startedAt = Date.now();
    const hmacKey = hmacManager.deriveKey(...args);
    const objectPath = objectPathFromKey(hmacKey);

    const auditBase = {
      timestamp: new Date().toISOString(),
      service: serviceName,
      cache_key: hmacKey,
    };

    // Step 1: Try GCS cache read
    try {
      const cached = await gcsService.get(objectPath);
      if (cached !== null) {
        metrics.hits++;
        metrics.total++;
        const latency = Date.now() - startedAt;
        logger.cacheHit?.(objectPath);
        logger.info("cache_audit", {
          ...auditBase,
          cache_hit: true,
          generation_latency_ms: latency,
          status: "ok",
        });
        return cached;
      }
      logger.cacheMiss?.(objectPath);
    } catch (err) {
      logger.warn(
        `[${serviceName}] GCS read failed, continuing to generation: ${err?.message ?? err}`,
      );
    }

    metrics.misses++;
    metrics.total++;

    // Step 2: Try acquire single-flight lock
    const owner = uuidv4();
    let lockAcquired = false;
    try {
      lockAcquired = await lockManager.acquire(hmacKey, owner);
    } catch (err) {
      logger.warn(
        `[${serviceName}] Lock acquire threw error, will fallback to generation: ${err?.message ?? err}`,
      );
      lockAcquired = false;
    }

    // Step 3: If lock not acquired, fallback to uncached generation
    if (!lockAcquired) {
      const startGen = Date.now();
      try {
        const result = await serviceMethod(...args);
        const latency = Date.now() - startGen;
        logger.info("generation_audit", {
          ...auditBase,
          cache_hit: false,
          generation_latency_ms: latency,
          status: "ok",
          note: "lock_miss_fallback",
        });
        return result;
      } catch (err) {
        logger.error(`[${serviceName}] Generation failed on lock miss fallback`, err);
        throw err;
      }
    }

    // Step 4: We hold the lock — double-check GCS to avoid thundering herd
    try {
      const recheck = await gcsService.get(objectPath);
      if (recheck !== null) {
        const latency = Date.now() - startedAt;
        logger.cacheHit?.(objectPath);
        logger.info("cache_audit", {
          ...auditBase,
          cache_hit: true,
          generation_latency_ms: latency,
          status: "ok",
          note: "post_lock_hit",
        });
        // Release lock after double-check hit
        try {
          await lockManager.release(hmacKey, owner);
        } catch {
          // Best-effort release
        }
        return recheck;
      }
    } catch (err) {
      logger.warn(
        `[${serviceName}] GCS re-check failed after lock acquisition: ${err?.message ?? err}`,
      );
    }

    // Step 5: Generate, persist to GCS, release lock
    const genStart = Date.now();
    try {
      const generated = await serviceMethod(...args);

      // Basic validation
      if (!generated || typeof generated !== "object") {
        const err = new Error(`${serviceName}: Generated result invalid — expected object`);
        logger.error(`[${serviceName}] Validation failed`, err);
        throw err;
      }

      // Persist to GCS (best-effort)
      try {
        await gcsService.set(objectPath, generated);
      } catch (err) {
        logger.warn(`[${serviceName}] GCS persist failed (best-effort): ${err?.message ?? err}`);
      }

      const genLatency = Date.now() - genStart;
      logger.info("generation_audit", {
        ...auditBase,
        cache_hit: false,
        generation_latency_ms: genLatency,
        status: "ok",
      });

      return generated;
    } catch (err) {
      logger.error(`[${serviceName}] Generation failed`, err);
      throw err;
    } finally {
      try {
        await lockManager.release(hmacKey, owner);
      } catch (err) {
        logger.warn(`[${serviceName}] Failed to release lock: ${err?.message ?? err}`);
      }
    }
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
