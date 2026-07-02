// apps/backend/src/services/cache/RedisClient.ts
// Redis client wrapper with connection management and error handling

import Redis from "ioredis";
import { redisConfig } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("RedisClient");

/**
 * Redis client singleton with graceful error handling
 * Manages connection lifecycle and provides health check methods
 */
class RedisClient {
  private client: Redis | null;
  private isConnected: boolean;

  constructor() {
    if (!redisConfig.host) {
      logger.warn("No Redis configuration found, client will not be initialized");
      this.client = null;
      this.isConnected = false;
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

    this.client.on("error", (error: Error) => {
      logger.error("Redis error", error);
      // Don't throw - allow app to continue without cache
      this.isConnected = false;
    });

    this.client.on("close", () => {
      logger.info("Redis connection closed");
      this.isConnected = false;
    });

    this.client.on("reconnecting", (delay: number) => {
      logger.info(`Redis reconnecting in ${delay}ms...`);
    });

    this.client.on("end", () => {
      logger.info("Redis connection ended");
      this.isConnected = false;
    });
  }

  /**
   * Ping Redis server to check connectivity
   * @param timeout - Timeout in milliseconds (default: 1000ms)
   * @returns True if ping successful, false otherwise
   */
  async ping(timeout: number = 1000): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await Promise.race([
        this.client.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Ping timeout")), timeout),
        ),
      ]);
      return result === "PONG";
    } catch (error) {
      logger.error("Ping failed", error);
      return false;
    }
  }

  /**
   * Gracefully close Redis connection
   */
  async quit(): Promise<void> {
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
   * @returns Redis client or null if not initialized
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if Redis is connected and ready
   * @returns True if connected
   */
  isReady(): boolean {
    return this.client !== null && this.isConnected;
  }
}

// Export singleton instance
export const redisClient = new RedisClient();
