// apps/backend/src/services/cache/RedisCacheService.js
// Redis-backed cache service implementation

import { CacheService } from "./CacheService.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("RedisCacheService");

/**
 * Redis cache service with fail-open error handling
 * Operations that fail return null/noop instead of throwing errors
 * This ensures the app continues to function when Redis is unavailable
 */
export class RedisCacheService extends CacheService {
  /**
   * @param {import('ioredis').Redis} redisClient - ioredis client instance
   */
  constructor(redisClient) {
    super();
    this.redis = redisClient;
    logger.info("Initialized with Redis client");
  }

  /**
   * Retrieve a value from Redis cache
   * @param {string} key - Cache key (namespace prefix added automatically)
   * @returns {Promise<string|null>} Cached value or null if not found/error
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value !== null) {
        logger.cacheHit(key);
      }
      return value;
    } catch (error) {
      logger.error(`GET error for key ${key}`, error);
      return null; // Fail-open: return null on error
    }
  }

  /**
   * Store a value in Redis cache with TTL
   * @param {string} key - Cache key (namespace prefix added automatically)
   * @param {string|Object} value - Value to cache
   * @param {number} ttl - Time-to-live in seconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    try {
      // Serialize objects to JSON
      const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;

      await this.redis.setex(key, ttl, serializedValue);
      logger.info(`SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`SET error for key ${key}`, error);
      // Fail-open: log error and continue
    }
  }

  /**
   * Delete a single key from cache
   * @param {string} key - Cache key (namespace prefix added automatically)
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      await this.redis.del(key);
      logger.info(`DELETE: ${key}`);
    } catch (error) {
      logger.error(`DELETE error for key ${key}`, error);
      // Fail-open: log error and continue
    }
  }

  /**
   * Clear all keys matching a pattern using SCAN (not KEYS)
   * @param {string} pattern - Glob pattern for keys to delete (e.g., "tts:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async clear(pattern) {
    try {
      let deletedCount = 0;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100, // Batch size
      });

      // Use pipeline for efficient batch deletion
      const pipeline = this.redis.pipeline();
      let batchCount = 0;

      for await (const keys of stream) {
        for (const key of keys) {
          pipeline.del(key);
          batchCount++;
        }

        // Execute pipeline every 100 keys
        if (batchCount >= 100) {
          await pipeline.exec();
          deletedCount += batchCount;
          batchCount = 0;
        }
      }

      // Execute remaining keys
      if (batchCount > 0) {
        await pipeline.exec();
        deletedCount += batchCount;
      }

      logger.info(`CLEAR: ${pattern} (${deletedCount} keys deleted)`);
      return deletedCount;
    } catch (error) {
      logger.error(`CLEAR error for pattern ${pattern}`, error);
      return 0; // Fail-open: return 0 on error
    }
  }

  /**
   * Retrieve multiple values in a single operation using MGET
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Map<string, string>>} Map of key-value pairs (only keys with values)
   */
  async getMulti(keys) {
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
      return new Map(); // Fail-open: return empty map on error
    }
  }
}
