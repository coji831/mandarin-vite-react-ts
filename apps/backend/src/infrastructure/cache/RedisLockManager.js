/**
 * RedisLockManager
 * Lightweight Redis-based single-flight lock manager for examples caching
 * Uses ioredis atomic commands (SET NX PX) for acquire and an eval script for release
 */
import { createLogger } from "../../utils/logger.js";

const DEFAULT_LOCK_PREFIX = "examples:lock:";

export class RedisLockManager {
  /**
   * @param {import('ioredis').Redis} redisClient - ioredis client instance
   * @param {number} ttlMs - default TTL for locks in milliseconds
   */
  constructor(redisClient, ttlMs = 5000) {
    this.redisClient = redisClient;
    this.defaultTtlMs = ttlMs;
    this.logger = createLogger("RedisLockManager");
  }

  _lockKey(key) {
    return `${DEFAULT_LOCK_PREFIX}${key}`;
  }

  /**
   * Try to acquire a lock for a given key and owner id
   * @param {string} key - logical cache key
   * @param {string} owner - unique owner id (UUID / request id)
   * @param {number} ttlMs - TTL in ms to set for the lock
   * @returns {Promise<boolean>} true if lock acquired, false otherwise
   */
  async acquire(key, owner, ttlMs = this.defaultTtlMs) {
    if (!this.redisClient) {
      this.logger.warn("Redis client not available - acquire will return false");
      return false;
    }

    const lockKey = this._lockKey(key);
    try {
      // SET key value NX PX <ttl>
      const res = await this.redisClient.set(lockKey, owner, "PX", ttlMs, "NX");
      return res === "OK";
    } catch (err) {
      // On Redis connection issues, log warning and return false to allow fallback
      this.logger.warn("Redis acquire failed, allowing fallback", err?.message ?? err);
      return false;
    }
  }

  /**
   * Release the lock only if owner matches (safe release)
   * @param {string} key - logical cache key
   * @param {string} owner - unique owner id that must match the stored owner
   * @returns {Promise<boolean>} true if released, false otherwise
   */
  async release(key, owner) {
    if (!this.redisClient) {
      this.logger.warn("Redis client not available - release will return false");
      return false;
    }

    const lockKey = this._lockKey(key);

    // Lua script to check owner and delete atomically
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      // ioredis.eval(script, numKeys, key1, arg1)
      const result = await this.redisClient.eval(script, 1, lockKey, owner);
      return result === 1;
    } catch (err) {
      this.logger.warn("Redis release failed", err?.message ?? err);
      return false;
    }
  }
}

export default RedisLockManager;
