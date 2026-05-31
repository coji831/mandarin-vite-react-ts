import { createLogger } from "../../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const logger = createLogger("CachedExampleService");

/**
 * CachedExampleService
 * Wraps an underlying exampleService with GCS-backed caching and Redis single-flight locks
 */
export class CachedExampleService {
  /**
   * @param {Object} exampleService - underlying service with generateExamples(word, hskLevel, language)
   * @param {import('../../infrastructure/cache/RedisLockManager.js').RedisLockManager} redisLockManager
   * @param {Object} gcsService - service with get(objectPath) and set(objectPath, obj)
   * @param {import('../../infrastructure/security/HmacManager.js').HmacManager} hmacManager
   */
  constructor(exampleService, redisLockManager, gcsService, hmacManager) {
    this.exampleService = exampleService;
    this.redisLockManager = redisLockManager;
    this.gcsService = gcsService;
    this.hmacManager = hmacManager;
    logger.info("Initialized CachedExampleService wrapper");
  }

  _objectPathFromKey(hmacKey) {
    // Use a shallow folder layout to keep bucket tidy
    return `examples/${hmacKey}.json`;
  }

  /**
   * Generate examples with cache lookup, single-flight lock and GCS persistence
   * @param {string} word
   * @param {string|number} hskLevel
   * @param {string} language
   * @returns {Promise<Object>} examples result
   */
  async generateExamples(word, hskLevel, language) {
    const startedAt = Date.now();
    const hmacKey = this.hmacManager.deriveKey(word, hskLevel, language);
    const objectPath = this._objectPathFromKey(hmacKey);

    const auditBase = {
      timestamp: new Date().toISOString(),
      service: "CachedExampleService",
      cache_key: hmacKey,
    };

    // Try read from GCS first
    try {
      const cached = await this.gcsService.get(objectPath);
      if (cached !== null) {
        const latency = Date.now() - startedAt;
        const audit = {
          ...auditBase,
          cache_hit: true,
          generation_latency_ms: latency,
          status: "ok",
        };
        logger.cacheHit(objectPath);
        logger.info("cache_audit", audit);
        return cached;
      }
      logger.cacheMiss(objectPath);
    } catch (err) {
      // GCS read errors are non-fatal - log and continue to generation
      logger.warn("GCS read failed, continuing to generation", err?.message ?? err);
    }

    // Try acquire lock to coordinate generation
    const owner = uuidv4();
    let lockAcquired = false;
    try {
      lockAcquired = await this.redisLockManager.acquire(hmacKey, owner);
    } catch (err) {
      logger.warn("Lock acquire threw error, will fallback to generation", err?.message ?? err);
      lockAcquired = false;
    }

    // If lock not acquired, fallback to uncached generation (Strategy A)
    if (!lockAcquired) {
      const startGen = Date.now();
      try {
        const result = await this.exampleService.generateExamples(word, hskLevel, language);
        const latency = Date.now() - startGen;
        const audit = {
          ...auditBase,
          cache_hit: false,
          generation_latency_ms: latency,
          status: "ok",
          note: "lock_miss_fallback",
        };
        logger.info("generation_audit", audit);
        return result;
      } catch (err) {
        logger.error("exampleService generation failed", err);
        throw err;
      }
    }

    // We hold the lock - double-check cache to avoid thundering herd
    try {
      const recheck = await this.gcsService.get(objectPath);
      if (recheck !== null) {
        const latency = Date.now() - startedAt;
        const audit = {
          ...auditBase,
          cache_hit: true,
          generation_latency_ms: latency,
          status: "ok",
          note: "post_lock_hit",
        };
        logger.cacheHit(objectPath);
        logger.info("cache_audit", audit);
        return recheck;
      }
    } catch (err) {
      logger.warn("GCS re-check failed after lock acquisition", err?.message ?? err);
    }

    // Generate, persist, release
    const genStart = Date.now();
    try {
      const generated = await this.exampleService.generateExamples(word, hskLevel, language);

      // Basic validation: must be an object
      if (!generated || typeof generated !== "object") {
        const err = new Error("Generated examples invalid: expected object");
        logger.error("Validation failed for generated examples", err);
        throw err;
      }

      // Persist to GCS (best-effort)
      try {
        await this.gcsService.set(objectPath, generated);
      } catch (err) {
        logger.warn("GCS persist failed (best-effort)", err?.message ?? err);
      }

      const genLatency = Date.now() - genStart;
      const audit = {
        ...auditBase,
        cache_hit: false,
        generation_latency_ms: genLatency,
        status: "ok",
      };
      logger.info("generation_audit", audit);
      return generated;
    } catch (err) {
      logger.error("example generation failed", err);
      throw err;
    } finally {
      try {
        await this.redisLockManager.release(hmacKey, owner);
      } catch (err) {
        logger.warn("Failed to release lock", err?.message ?? err);
      }
    }
  }
}

export default CachedExampleService;
