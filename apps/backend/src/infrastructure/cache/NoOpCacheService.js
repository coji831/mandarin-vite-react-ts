// apps/backend/src/services/cache/NoOpCacheService.js
// No-op cache service for when caching is disabled or Redis unavailable

import { CacheService } from "./CacheService.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("NoOpCacheService");

/**
 * No-operation cache service
 * All methods return immediately without performing any caching
 * Used as fallback when Redis is unavailable or CACHE_ENABLED=false
 */
export class NoOpCacheService extends CacheService {
  constructor() {
    super();
    logger.warn("CACHE_DISABLED - Using no-op cache (all operations are no-ops)");
  }

  /**
   * Always returns null (cache miss)
   * @param {string} key - Cache key (ignored)
   * @returns {Promise<null>}
   */
  async get(key) {
    return null;
  }

  /**
   * No-op: does nothing
   * @param {string} key - Cache key (ignored)
   * @param {string|Object} value - Value (ignored)
   * @param {number} ttl - TTL (ignored)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    // No-op
  }

  /**
   * No-op: does nothing
   * @param {string} key - Cache key (ignored)
   * @returns {Promise<void>}
   */
  async delete(key) {
    // No-op
  }

  /**
   * No-op: always returns 0
   * @param {string} pattern - Pattern (ignored)
   * @returns {Promise<number>} Always 0
   */
  async clear(pattern) {
    return 0;
  }

  /**
   * Always returns empty Map
   * @param {string[]} keys - Cache keys (ignored)
   * @returns {Promise<Map<string, string>>} Empty Map
   */
  async getMulti(keys) {
    return new Map();
  }
}
