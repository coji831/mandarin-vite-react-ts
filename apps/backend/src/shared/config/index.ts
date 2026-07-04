/**
 * @file apps/backend/src/shared/config/index.ts
 * @description Centralized configuration — maps environment variables to typed config.
 *
 * Infrastructure (IaC-managed — see terraform/):
 *   Neon      → DATABASE_URL              (serverless PostgreSQL)
 *   Upstash   → REDIS_URL                 (Redis cache, TLS via rediss://)
 *   GCP       → GCS_BUCKET_NAME           (content & audio storage)
 *            → GCS_CREDENTIALS_RAW       (SA: gcs-storage-service — crucial)
 *            → GEMINI_API_CREDENTIALS_RAW (SA: gemini-service)
 *            → GOOGLE_TTS_CREDENTIALS_RAW (SA: tts-service)
 *   Railway   → PORT, NODE_ENV
 *   Vercel    → FRONTEND_URL              (CORS allowlist)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Config");

// ── Bootstrap ──────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local in development only. Production env vars are injected by Railway.
if (process.env.NODE_ENV !== "production") {
  const envFile = path.resolve(__dirname, "..", "..", "..", "..", "..", ".env.local");
  dotenv.config({ path: envFile });
  log.info("Loaded .env.local", { path: envFile });
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse a single-line JSON environment variable. Returns null if not set or invalid. */
function jsonEnv(name: string): Record<string, unknown> | null {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (cause) {
    log.warn(
      `Invalid JSON in ${name} — treating as unset. ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    return null;
  }
}

// ── Application config ─────────────────────────────────────────────────────

export const config = {
  // ── Server (Railway) ──────────────────────────────────────────────────
  port: parseInt(process.env.PORT || "3001", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  nodeEnvironment: process.env.NODE_ENV || "development",

  // ── Database (Neon serverless PostgreSQL) ─────────────────────────────
  databaseUrl: process.env.DATABASE_URL!,

  // ── Auth ──────────────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,

  // ── GCP service account credentials ───────────────────────────────────
  // Each env var is a JSON key for a dedicated SA (least privilege).
  googleTtsCredentials: jsonEnv("GOOGLE_TTS_CREDENTIALS_RAW"),
  geminiCredentials: jsonEnv("GEMINI_API_CREDENTIALS_RAW"),
  gcsCredentials: jsonEnv("GCS_CREDENTIALS_RAW"),

  // ── GCS (content storage — crucial) ────────────────────────────────────
  gcsBucket: process.env.GCS_BUCKET_NAME!,

  // ── Local data (dev fallback) ─────────────────────────────────────────
  localDataPath: path.resolve(__dirname, "../../../data"),

  // ── TTS (Google Cloud Text-to-Speech) ─────────────────────────────────
  tts: {
    voiceDefault: "cmn-CN-Wavenet-B",
    languageCode: "cmn-CN",
    maxWords: 15,
    audioEncoding: "MP3" as const,
  },

  // ── Gemini AI ─────────────────────────────────────────────────────────
  gemini: {
    model: process.env.GEMINI_MODEL || "models/gemini-3.1-flash-lite",
    endpoint: process.env.GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta",
  },
};

// ── Redis (Upstash) ────────────────────────────────────────────────────────

type RedisConnection = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: Record<string, never>;
};

function parseRedisUrl(): Partial<RedisConnection> {
  const raw = process.env.REDIS_URL;
  if (!raw) {
    log.warn("REDIS_URL not set — Redis cache unavailable");
    return {};
  }

  try {
    const url = new URL(raw);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      // Upstash requires TLS (rediss:// protocol)
      tls: url.protocol === "rediss:" ? {} : undefined,
    };
  } catch (cause) {
    log.error("Invalid REDIS_URL", cause instanceof Error ? cause.message : String(cause));
    return {};
  }
}

export const redisConfig = {
  ...parseRedisUrl(),

  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,

  retryStrategy(times: number): number {
    const delay = Math.min(times * 1000, 10_000);
    log.info(`Redis retry ${times}, waiting ${delay}ms`);
    return delay;
  },

  connectTimeout: 10_000,
  keepAlive: 30_000,
  keyPrefix: "mandarin:",
};

export const cacheConfig = {
  enabled: !!process.env.REDIS_URL,
  ttl: {
    tts: parseInt(process.env.CACHE_TTL_TTS || "86400", 10),
  },
};

// ── Startup validation ─────────────────────────────────────────────────────

type Check = [value: unknown, label: string];

/**
 * Validate required configuration at startup (fail-fast).
 * Throws on the first missing critical value.
 */
export function validateConfig(): void {
  log.info("Validating configuration…");

  // Critical — app cannot start without these
  const critical: Check[] = [
    [config.databaseUrl, "DATABASE_URL (Neon Postgres)"],
    [config.jwtSecret, "JWT_SECRET"],
    [config.jwtRefreshSecret, "JWT_REFRESH_SECRET"],
    [config.gcsBucket, "GCS_BUCKET_NAME"],
    [config.gcsCredentials?.client_email, "GCS_CREDENTIALS_RAW (SA: gcs-storage-service)"],
    [config.googleTtsCredentials?.client_email, "GOOGLE_TTS_CREDENTIALS_RAW (SA: tts-service)"],
    [config.geminiCredentials?.client_email, "GEMINI_API_CREDENTIALS_RAW (SA: gemini-service)"],
  ];

  for (const [value, label] of critical) {
    if (!value) {
      throw new Error(`[Config] ${label} is required but not set`);
    }
  }

  log.info(`GCS:    ${config.gcsBucket} ← ${config.gcsCredentials!.client_email}`);
  log.info(`TTS:    ${config.googleTtsCredentials!.client_email}`);
  log.info(`Gemini: ${config.geminiCredentials!.client_email}`);
  log.info("Configuration validated ✓");
}
