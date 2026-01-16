// apps/backend/src/config/redis.js
// Redis client configuration for Railway Redis instance

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("Redis Config");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from project root .env.local
const envPath = path.resolve(__dirname, "..", "..", "..", "..", ".env.local");
dotenv.config({ path: envPath });

/**
 * Parse Redis URL from environment
 * Railway format: redis://:password@host:port or redis://default:password@host:port
 * @returns {Object} Parsed Redis configuration
 */
function parseRedisUrl() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn("REDIS_URL not set, Redis will not be available");
    return null;
  }

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
    };
  } catch (error) {
    logger.error("Invalid REDIS_URL format", error);
    return null;
  }
}

/**
 * Redis connection configuration with Railway-optimized settings
 */
export const redisConfig = {
  // Parse connection details from REDIS_URL
  ...parseRedisUrl(),

  // Connection options
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately, wait for explicit connect()

  // Retry strategy: exponential backoff (1s, 2s, 4s, max 10s)
  retryStrategy(times) {
    const delay = Math.min(times * 1000, 10000);
    logger.info(`Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },

  // Connection timeout
  connectTimeout: 10000, // 10 seconds

  // Keep-alive
  keepAlive: 30000, // 30 seconds

  // Key prefix for namespace isolation (dev/prod share same instance)
  keyPrefix: "mandarin:",
};

// Cache settings
export const cacheConfig = {
  enabled: process.env.CACHE_ENABLED === "true",
  ttl: {
    tts: parseInt(process.env.CACHE_TTL_TTS || "86400", 10), // 24 hours default
    conversation: parseInt(process.env.CACHE_TTL_CONVERSATION || "3600", 10), // 1 hour default
  },
};

logger.info("Configuration loaded:", {
  host: redisConfig.host || "not configured",
  port: redisConfig.port || "not configured",
  keyPrefix: redisConfig.keyPrefix,
  cacheEnabled: cacheConfig.enabled,
  ttl: cacheConfig.ttl,
});
