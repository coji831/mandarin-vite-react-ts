/**
 * @file apps/backend/src/config/index.js
 * @description Centralized configuration for backend services
 * Clean architecture: Configuration layer
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from project root .env.local
const envPath = path.resolve(__dirname, "..", "..", "..", "..", ".env.local");
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

// Load and parse configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || "3001", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  envPath,
  nodeEnvironment: process.env.NODE_ENV || "development",

  //JWT
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret",

  // Mode
  conversationMode: process.env.CONVERSATION_MODE || "scaffold",

  // Google Cloud Credentials
  googleTtsCredentials: parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  geminiCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"),
  // Use TTS credentials for GCS (they should have storage permissions) or explicit GCS credentials if set
  gcsCredentials: parseJsonEnv("GCS_CREDENTIALS_RAW") || parseJsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),

  // GCS
  gcsBucket: process.env.GCS_BUCKET_NAME,

  // TTS Configuration
  tts: {
    voiceDefault: "cmn-CN-Wavenet-B",
    languageCode: "cmn-CN",
    maxWords: 15,
    audioEncoding: "MP3",
  },

  // Gemini Configuration
  gemini: {
    model: process.env.GEMINI_MODEL || "models/gemini-2.0-flash-lite",
    endpoint: process.env.GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "1000", 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
  },

  // Cache Paths (with {hash} placeholder)
  cachePaths: {
    tts: "tts/{hash}.mp3",
    conversationText: "convo/{wordId}/{hash}.json",
    conversationAudio: "convo/{wordId}/{hash}.mp3",
  },

  // Feature Flags
  features: {
    enableCache: process.env.ENABLE_CACHE !== "false",
    enableMetrics: process.env.ENABLE_METRICS === "true",
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === "true",
  },
};

// Validation: fail fast on missing critical config in real mode
if (config.conversationMode === "real") {
  console.log("[Config] Validating real mode configuration...");

  if (!config.gcsBucket) {
    throw new Error(
      "[Config] GCS_BUCKET_NAME is required when CONVERSATION_MODE=real. Check .env.local file.",
    );
  }

  if (!config.googleTtsCredentials || !config.googleTtsCredentials.client_email) {
    throw new Error(
      "[Config] GOOGLE_TTS_CREDENTIALS_RAW is invalid or missing. Required for real mode.",
    );
  }

  if (!config.geminiCredentials || !config.geminiCredentials.client_email) {
    throw new Error(
      "[Config] GEMINI_API_CREDENTIALS_RAW is invalid or missing. Required for real mode.",
    );
  }

  if (!config.gcsCredentials || !config.gcsCredentials.client_email) {
    throw new Error(
      "[Config] GCS credentials missing. Set GCS_CREDENTIALS_RAW or ensure GOOGLE_TTS_CREDENTIALS_RAW has Storage Object Creator role.",
    );
  }

  console.log(`[Config] Using GCS credentials from: ${config.gcsCredentials.client_email}`);
  console.log("[Config] Real mode configuration validated successfully");
} else {
  console.log("[Config] Scaffold mode - skipping Google Cloud credential validation");
}

export default config;
