/**
 * ICacheService Interface
 * Defines the contract for cache service implementations
 *
 * @interface ICacheService
 */

/**
 * Retrieve a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null if not found/error
 */
export async function get(key) {}

/**
 * Store a value in cache with TTL
 * @param {string} key - Cache key
 * @param {string|Object} value - Value to cache (will be serialized if object)
 * @param {number} ttl - Time-to-live in seconds
 * @returns {Promise<void>}
 */
export async function set(key, value, ttl) {}

/**
 * Delete a single key from cache
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
export async function delete_(key) {}

/**
 * Clear all keys matching a pattern
 * @param {string} pattern - Glob pattern for keys to delete (e.g., "tts:*")
 * @returns {Promise<number>} Number of keys deleted
 */
export async function clear(pattern) {}

/**
 * Check if cache service is healthy
 * @returns {Promise<boolean>} True if cache is operational
 */
export async function isHealthy() {}
