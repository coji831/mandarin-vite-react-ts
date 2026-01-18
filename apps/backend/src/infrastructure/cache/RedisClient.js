// apps/backend/src/services/cache/RedisClient.js
// Redis client wrapper with connection management and error handling

import Redis from "ioredis";
import { redisConfig } from "../../config/redis.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("RedisClient");

/**
 * Redis client singleton with graceful error handling
 * Manages connection lifecycle and provides health check methods
 */
class RedisClient {
  constructor() {
    if (!redisConfig.host) {
      logger.warn("No Redis configuration found, client will not be initialized");
      this.client = null;
      return;
    }

    // Initialize ioredis client with configuration
    this.client = new Redis(redisConfig);
    this.isConnected = false;

    // Connection event handlers
    this.client.on("connect", () => {
      logger.info("Connected to Redis");
      this.isConnected = true;
    });

    this.client.on("ready", () => {
      logger.info("Redis client ready");
    });

    this.client.on("error", (error) => {
      logger.error("Redis error", error);
      // Don't throw - allow app to continue without cache
      this.isConnected = false;
    });

    this.client.on("close", () => {
      logger.info("Redis connection closed");
      this.isConnected = false;
    });

    this.client.on("reconnecting", (delay) => {
      logger.info(`Redis reconnecting in ${delay}ms...`);
    });

    this.client.on("end", () => {
      logger.info("Redis connection ended");
      this.isConnected = false;
    });
  }

  /**
   * Ping Redis server to check connectivity
   * @param {number} timeout - Timeout in milliseconds (default: 1000ms)
   * @returns {Promise<boolean>} True if ping successful, false otherwise
   */
  async ping(timeout = 1000) {
    if (!this.client) {
      return false;
    }

    try {
      const result = await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Ping timeout")), timeout)),
      ]);
      return result === "PONG";
    } catch (error) {
      logger.error("Ping failed", error);
      return false;
    }
  }

  /**
   * Gracefully close Redis connection
   * @returns {Promise<void>}
   */
  async quit() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      logger.info("Gracefully closed Redis connection");
    } catch (error) {
      logger.error("Error closing connection", error);
    }
  }

  /**
   * Get the underlying ioredis client instance
   * @returns {Redis|null} Redis client or null if not initialized
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if Redis is connected and ready
   * @returns {boolean}
   */
  isReady() {
    return this.client && this.isConnected;
  }

  /**
   * Get singleton instance
   * @returns {RedisClient}
   */
  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }
}

// Export singleton instance and class
export const redisClient = new RedisClient();
export { RedisClient };
