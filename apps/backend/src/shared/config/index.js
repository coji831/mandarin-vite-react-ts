/**
 * @file apps/backend/src/shared/config/index.js
 * @description Centralized configuration for backend services
 * Clean architecture: Configuration layer
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from project root .env.local
const envPath = path.resolve(__dirname, "..", "..", "..", "..", "..", ".env.local");
dotenv.config({ path: envPath });
console.log(`[Config] Loaded environment variables from ${envPath}`);

/**
 * Parse JSON from environment variable safely
 * @param {string} envVar - Environment variable name
 * @param {boolean} required - Whether this variable is required
 * @returns {Object|null} Parsed JSON object or null
 */
function parseJsonEnv(envVar, required = false) {
  const value = process.env[envVar];
  if (!value) {
    if (required) {
      throw new Error(`[Config] ${envVar} environment variable is required but not set`);
    }
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`[Config] ${envVar} contains invalid JSON: ${error.message}`);
  }
}

/**
 * Validate that a required environment variable is set
 * @param {string} name - Environment variable name
 * @returns {string} The validated value
 */
function validatedEnv(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`[Config] ${name} is required but not set`);
  }
  return val;
}

// Load and parse configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || "3001", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  envPath,
  nodeEnvironment: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  //JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  // Google Cloud Credentials
  googleTtsCredentials: parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  geminiCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"),
  // Use Gemini credentials for GCS
  gcsCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"),

  // GCS
  gcsBucket: process.env.GCS_BUCKET_NAME,

  // Reference Data
  localDataPath: path.resolve(__dirname, "../../../data"),

  // TTS Configuration
  tts: {
    voiceDefault: "cmn-CN-Wavenet-B",
    languageCode: "cmn-CN",
    maxWords: 15,
    audioEncoding: "MP3",
  },

  // Gemini Configuration
  gemini: {
    model: process.env.GEMINI_MODEL || "models/gemini-3.1-flash-lite",
    endpoint: process.env.GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta",
  },

  // Feature Flags
  features: {
    enableMetrics: process.env.ENABLE_METRICS === "true",
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === "true",
  },
};

/**
 * Parse Redis URL from environment
 * Railway format: redis://:password@host:port or redis://default:password@host:port
 * @returns {Object} Parsed Redis configuration with type info
 */
function parseRedisUrl() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("[Config] REDIS_URL not set, Redis will not be available");
    return { urlType: "not configured" };
  }

  // Skip Redis if using Railway internal hostname in local development
  if (redisUrl.includes("redis.railway.internal") && process.env.NODE_ENV !== "production") {
    console.warn(
      "[Config] Skipping Redis connection: Railway internal hostname detected in local development. Use localhost or disable REDIS_URL for local dev.",
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
    console.error("[Config] Invalid REDIS_URL format:", error.message);
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
    const logger = createLogger("Redis Config");
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

// Cache settings — enabled automatically when REDIS_URL is set
export const cacheConfig = {
  enabled: !!process.env.REDIS_URL,
  ttl: {
    tts: parseInt(process.env.CACHE_TTL_TTS || "86400", 10), // 24 hours default
  },
};

/**
 * Vocabulary configuration for data fetching from Google Cloud Storage.
 */
export const vocabularyConfig = {
  // Name of the lists JSON file in the GCS bucket
  listsFile: "vocabularyLists.json",

  // Cache TTL (seconds) used by VocabularyRepository in-memory cache
  cacheTTL: 3600,

  // GCS enabled flag (should always be true in production)
  gcsEnabled: process.env.GCS_ENABLED === "true",
};

/**
 * Validate that all required configuration values are present.
 * Call this explicitly from the application entry point.
 * Throws if any critical config is missing (fail-fast at startup, not import time).
 */
export function validateConfig() {
  console.log("[Config] Validating infrastructure configuration...");

  if (!config.databaseUrl) {
    throw new Error(
      "[Config] DATABASE_URL is required. Set it in .env.local or platform environment.",
    );
  }

  if (!config.jwtSecret) {
    throw new Error(
      "[Config] JWT_SECRET is required. Set it in .env.local. " +
        "WARNING: Never use a default value in production — this would allow unauthenticated access.",
    );
  }

  if (!config.jwtRefreshSecret) {
    throw new Error("[Config] JWT_REFRESH_SECRET is required. Set it in .env.local.");
  }

  if (!config.gcsBucket) {
    throw new Error("[Config] GCS_BUCKET_NAME is required. Check .env.local file.");
  }

  if (!config.googleTtsCredentials || !config.googleTtsCredentials.client_email) {
    throw new Error("[Config] GOOGLE_TTS_CREDENTIALS_RAW is invalid or missing.");
  }

  if (!config.geminiCredentials || !config.geminiCredentials.client_email) {
    throw new Error("[Config] GEMINI_API_CREDENTIALS_RAW is invalid or missing.");
  }

  if (!config.gcsCredentials || !config.gcsCredentials.client_email) {
    throw new Error(
      "[Config] GCS credentials missing. GEMINI_API_CREDENTIALS_RAW is used for both Gemini AI and GCS auth.",
    );
  }

  console.log(`[Config] Using GCS credentials from: ${config.gcsCredentials.client_email}`);
  console.log("[Config] Infrastructure configuration validated successfully");
}
