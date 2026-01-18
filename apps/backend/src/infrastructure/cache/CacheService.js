// apps/backend/src/services/cache/CacheService.js
// Abstract base class defining cache service interface

/**
 * Abstract cache service interface
 * Defines standard cache operations that all implementations must provide
 *
 * Implementations:
 * - RedisCacheService: Uses Redis for distributed caching
 * - NoOpCacheService: No-op implementation for when caching is disabled
 */
export class CacheService {
  /**
   * Retrieve a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} Cached value or null if not found/error
   */
  async get(key) {
    throw new Error("Method 'get' must be implemented by subclass");
  }

  /**
   * Store a value in cache with TTL
   * @param {string} key - Cache key
   * @param {string|Object} value - Value to cache (will be serialized if object)
   * @param {number} ttl - Time-to-live in seconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    throw new Error("Method 'set' must be implemented by subclass");
  }

  /**
   * Delete a single key from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(key) {
    throw new Error("Method 'delete' must be implemented by subclass");
  }

  /**
   * Clear all keys matching a pattern
   * @param {string} pattern - Glob pattern for keys to delete (e.g., "tts:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async clear(pattern) {
    throw new Error("Method 'clear' must be implemented by subclass");
  }

  /**
   * Retrieve multiple values in a single operation
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Map<string, string>>} Map of key-value pairs
   */
  async getMulti(keys) {
    throw new Error("Method 'getMulti' must be implemented by subclass");
  }
}
