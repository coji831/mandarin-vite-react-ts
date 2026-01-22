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
 * @returns {Object} Parsed Redis configuration with type info
 */
function parseRedisUrl() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn("REDIS_URL not set, Redis will not be available");
    return { urlType: "not configured" };
  }

  // Skip Redis if using Railway internal hostname in local development
  if (redisUrl.includes("redis.railway.internal") && process.env.NODE_ENV !== "production") {
    logger.warn(
      "Skipping Redis connection: Railway internal hostname detected in local development. Use localhost or disable REDIS_URL for local dev.",
    );
    return { urlType: "internal (skipped)" };
  }

  try {
    const url = new URL(redisUrl);
    const hostname = url.hostname;

    // Determine URL type
    let urlType;
    if (hostname.includes("railway.internal")) {
      urlType = "Railway internal";
    } else if (hostname.includes(".rlwy.net") || hostname.includes(".railway.app")) {
      urlType = "Railway public";
    } else if (hostname === "localhost" || hostname === "127.0.0.1") {
      urlType = "localhost";
    } else {
      urlType = "external";
    }

    return {
      host: hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      urlType,
    };
  } catch (error) {
    logger.error("Invalid REDIS_URL format", error);
    return { urlType: "invalid" };
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

// Log configuration status
logger.info("Configuration loaded:", {
  cacheEnabled: cacheConfig.enabled,
  urlType: redisConfig.urlType || "not configured",
  host: redisConfig.host || "not configured",
  port: redisConfig.port || "not configured",
  keyPrefix: redisConfig.keyPrefix,
  ttl: cacheConfig.ttl,
});
