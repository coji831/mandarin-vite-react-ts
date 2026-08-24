---
purpose: Environment variables — required (fail-fast) and optional
status: active
last-verified: 2026-08-22
type: guide
---

# Environment Variables

## Required (fail-fast — `validateConfig()` throws at startup)

| Variable                     | Description                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`               | Neon Postgres connection string                                     |
| `JWT_SECRET`                 | JWT access-token signing secret                                     |
| `JWT_REFRESH_SECRET`         | JWT refresh-token signing secret                                    |
| `GCS_BUCKET_NAME`            | Google Cloud Storage bucket name                                    |
| `GCS_CREDENTIALS_RAW`        | Service account JSON for GCS (SA: gcs-storage-service), stringified |
| `GOOGLE_TTS_CREDENTIALS_RAW` | Service account JSON for TTS (SA: tts-service), stringified         |
| `GEMINI_API_CREDENTIALS_RAW` | Service account JSON for Gemini (SA: gemini-service), stringified   |

## Optional (safe defaults)

| Variable          | Default                                            | Description                                                  |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `PORT`            | `3001`                                             | Server port                                                  |
| `NODE_ENV`        | `development`                                      | `development` / `production`                                 |
| `FRONTEND_URL`    | `http://localhost:5173`                            | CORS allowed origin                                          |
| `REDIS_URL`       | _disabled_                                         | Redis/Upstash URL (`rediss://` TLS) — enables cache when set |
| `GEMINI_MODEL`    | `models/gemini-3.1-flash-lite`                     | Gemini model name                                            |
| `GEMINI_ENDPOINT` | `https://generativelanguage.googleapis.com/v1beta` | Gemini API endpoint                                          |
| `CACHE_TTL_TTS`   | `86400`                                            | TTS cache TTL (seconds)                                      |

> **Full reference:** See [Environment Setup Guide](../../../../docs/guides/getting-started/environment-setup.md) for all variables, defaults, and optional configuration.
