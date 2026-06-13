// apps/backend/src/shared/infrastructure/cache/CacheService.js
// Single concrete cache service — Redis when client is provided, no-op when null

import { createLogger } from "../../utils/logger.js";

const logger = createLogger("CacheService");

/**
 * Single concrete cache service.
 * Constructor accepts an optional redisClient (ioredis instance).
 * When redisClient is null/undefined, all operations are no-ops.
 * When redisClient is set, all operations delegate to Redis with fail-open error handling.
 */
export class CacheService {
  /**
   * @param {import('ioredis').Redis|null} redisClient - ioredis client or null for no-op mode
   */
  constructor(redisClient) {
    this.redis = redisClient;
    if (!this.redis) {
      logger.warn("No Redis client provided — running in no-op mode");
    } else {
      logger.info("Initialized with Redis client");
    }
  }

  /**
   * Retrieve a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} Cached value or null if not found/error
   */
  async get(key) {
    if (!this.redis) return null;
    try {
      const value = await this.redis.get(key);
      if (value !== null) {
        logger.cacheHit(key);
      }
      return value;
    } catch (error) {
      logger.error(`GET error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Store a value in cache with TTL
   * @param {string} key - Cache key
   * @param {string|Object} value - Value to cache (will be serialized if object)
   * @param {number} ttl - Time-to-live in seconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    if (!this.redis) return;
    try {
      const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;
      await this.redis.setex(key, ttl, serializedValue);
      logger.info(`SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`SET error for key ${key}`, error);
    }
  }

  /**
   * Delete a single key from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(key) {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
      logger.info(`DELETE: ${key}`);
    } catch (error) {
      logger.error(`DELETE error for key ${key}`, error);
    }
  }

  /**
   * Clear all keys matching a pattern using SCAN (not KEYS)
   * @param {string} pattern - Glob pattern for keys to delete (e.g., "tts:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async clear(pattern) {
    if (!this.redis) return 0;
    try {
      let deletedCount = 0;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      const pipeline = this.redis.pipeline();
      let batchCount = 0;

      for await (const keys of stream) {
        for (const key of keys) {
          pipeline.del(key);
          batchCount++;
        }
        if (batchCount >= 100) {
          await pipeline.exec();
          deletedCount += batchCount;
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await pipeline.exec();
        deletedCount += batchCount;
      }

      logger.info(`CLEAR: ${pattern} (${deletedCount} keys deleted)`);
      return deletedCount;
    } catch (error) {
      logger.error(`CLEAR error for pattern ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Retrieve multiple values in a single operation using MGET
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Map<string, string>>} Map of key-value pairs (only keys with values)
   */
  async getMulti(keys) {
    if (!this.redis) return new Map();
    try {
      if (!keys || keys.length === 0) {
        return new Map();
      }

      const values = await this.redis.mget(...keys);
      const resultMap = new Map();

      keys.forEach((key, index) => {
        if (values[index] !== null) {
          resultMap.set(key, values[index]);
        }
      });

      logger.info(`MGET: ${keys.length} keys, ${resultMap.size} hits`);
      return resultMap;
    } catch (error) {
      logger.error("MGET error", error);
      return new Map();
    }
  }
}
