/**
 * RedisLockManager
 * Lightweight Redis-based single-flight lock manager for examples caching
 * Uses ioredis atomic commands (SET NX PX) for acquire and an eval script for release
 */
import type { Redis } from "ioredis";
import { createLogger } from "../../utils/logger.js";

const DEFAULT_LOCK_PREFIX = "examples:lock:";

type Logger = ReturnType<typeof createLogger>;

export class RedisLockManager {
  private readonly redisClient: Redis | null;
  private readonly defaultTtlMs: number;
  private readonly logger: Logger;

  constructor(redisClient: Redis | null, ttlMs: number = 5000) {
    this.redisClient = redisClient;
    this.defaultTtlMs = ttlMs;
    this.logger = createLogger("RedisLockManager");
  }

  buildLockKey(key: string): string {
    return `${DEFAULT_LOCK_PREFIX}${key}`;
  }

  /**
   * Try to acquire a lock for a given key and owner id
   * @param key - logical cache key
   * @param owner - unique owner id (UUID / request id)
   * @param ttlMs - TTL in ms to set for the lock
   * @returns true if lock acquired, false otherwise
   */
  async acquire(key: string, owner: string, ttlMs: number = this.defaultTtlMs): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn("Redis client not available - acquire will return false");
      return false;
    }

    const lockKey = this.buildLockKey(key);
    try {
      // SET key value NX PX <ttl>
      const res = await this.redisClient.set(lockKey, owner, "PX", ttlMs, "NX");
      return res === "OK";
    } catch (err: unknown) {
      // On Redis connection issues, log warning and return false to allow fallback
      this.logger.warn("Redis acquire failed, allowing fallback", (err as Error)?.message ?? err);
      return false;
    }
  }

  /**
   * Release the lock only if owner matches (safe release)
   * @param key - logical cache key
   * @param owner - unique owner id that must match the stored owner
   * @returns true if released, false otherwise
   */
  async release(key: string, owner: string): Promise<boolean> {
    if (!this.redisClient) {
      this.logger.warn("Redis client not available - release will return false");
      return false;
    }

    const lockKey = this.buildLockKey(key);

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
    } catch (err: unknown) {
      this.logger.warn("Redis release failed", (err as Error)?.message ?? err);
      return false;
    }
  }
}

export default RedisLockManager;
