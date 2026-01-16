// apps/backend/src/services/cache/index.js
// Cache service factory with singleton pattern

import { redisClient } from "./RedisClient.js";
import { RedisCacheService } from "./RedisCacheService.js";
import { NoOpCacheService } from "./NoOpCacheService.js";
import { cacheConfig } from "../../config/redis.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("CacheFactory");

let cacheServiceInstance = null;

/**
 * Create a cache service instance based on configuration and Redis health
 * @returns {Promise<import('./CacheService.js').CacheService>} Cache service instance
 */
export async function createCacheService() {
  // Check if caching is enabled in configuration
  if (!cacheConfig.enabled) {
    logger.info("Caching disabled via CACHE_ENABLED=false");
    return new NoOpCacheService();
  }

  // Check Redis connectivity
  const client = redisClient.getClient();
  if (!client) {
    logger.warn("Redis client not initialized, using NoOpCacheService");
    return new NoOpCacheService();
  }

  try {
    // Attempt connection and ping with 5-second timeout
    await client.connect();
    const isHealthy = await redisClient.ping(5000);

    if (isHealthy) {
      logger.info("Redis connection healthy, using RedisCacheService");
      return new RedisCacheService(client);
    } else {
      logger.warn("Redis ping failed, using NoOpCacheService");
      return new NoOpCacheService();
    }
  } catch (error) {
    logger.error("Redis connection error", error);
    logger.warn("Falling back to NoOpCacheService");
    return new NoOpCacheService();
  }
}

/**
 * Get or create singleton cache service instance
 * @returns {Promise<import('./CacheService.js').CacheService>} Cached service instance
 */
export async function getCacheService() {
  if (!cacheServiceInstance) {
    cacheServiceInstance = await createCacheService();
  }
  return cacheServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetCacheService() {
  cacheServiceInstance = null;
}

// Export cache configuration for convenience
export { cacheConfig };
