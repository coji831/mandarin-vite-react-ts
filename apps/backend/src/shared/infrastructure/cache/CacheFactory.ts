/**
 * CacheFactory — named instance registry for cache services
 *
 * Enables multi-namespace caching where different modules can have
 * their own Redis connections or cache namespaces. Creates a single
 * CacheService instance that either uses Redis (when healthy) or
 * runs in no-op mode (when Redis is unavailable or caching disabled).
 *
 * Usage:
 *   const cache = await CacheFactory.create("default");
 *   const analyticsCache = await CacheFactory.create("analytics", { enabled: false });
 *
 * @module shared/infrastructure/cache/CacheFactory
 */

import { redisClient } from "../redis/RedisClient.js";
import { CacheService } from "./CacheService.js";
import { cacheConfig } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("CacheFactory");

export class CacheFactory {
  static instances: Map<string, CacheService> = new Map();

  /**
   * Create or retrieve a named cache service instance.
   *
   * @param name - Unique instance name (e.g. "default", "analytics")
   * @param options - Optional overrides
   * @param options.enabled - Override cache enabled flag
   * @returns Cache service instance
   */
  static async create(name: string, options: { enabled?: boolean } = {}): Promise<CacheService> {
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    const enabled = options.enabled !== undefined ? options.enabled : cacheConfig.enabled;
    let redisClientInstance: import("ioredis").Redis | null = null;

    if (enabled) {
      const client = redisClient.getClient();
      if (client) {
        try {
          const isHealthy = await redisClient.ping(5000);
          if (isHealthy) {
            logger.info(`[${name}] Redis connection healthy`);
            redisClientInstance = client;
          } else {
            logger.warn(`[${name}] Redis ping failed, running in no-op mode`);
          }
        } catch (error) {
          logger.error(`[${name}] Redis connection error`, error);
          logger.warn(`[${name}] Falling back to no-op mode`);
        }
      } else {
        logger.warn(`[${name}] Redis client not initialized, running in no-op mode`);
      }
    } else {
      logger.info(`[${name}] Caching disabled, running in no-op mode`);
    }

    const instance = new CacheService(redisClientInstance);
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * Reset cached instance(s). Useful for testing.
   * @param name - Specific instance to reset; omit to clear all
   */
  static reset(name?: string): void {
    if (name) {
      this.instances.delete(name);
    } else {
      this.instances.clear();
    }
  }
}
