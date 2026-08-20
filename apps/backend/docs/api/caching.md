---
purpose: Redis-based caching strategy — reduce external API calls and improve response times
status: active
last-verified: 2026-08-03
type: guide
---

# Caching Strategy

**Last Updated:** August 3, 2026

The backend implements Redis-based caching to reduce external API calls and improve response times.

## TTS Caching

- **Cache Key Format**: `tts:path:{hash}` where `hash` is the leading path segment (SHA256 of `text + voice` for words, or the passage hash for passages) — Redis stores the GCS **file path**, not the audio itself
- **Redis TTL**: 24 hours (86400 seconds) for the path entry; the returned signed URL has a 1-hour TTL (`TTS_SIGNED_URL_TTL_SECONDS = 3600`)
- **Storage**: Redis caches the GCS file path (string); the audio MP3 lives in GCS. Signed URLs are NOT cached — they expire, so a fresh URL is re-signed on every read
- **Behavior**: The unified `synthesizeToPath` primitive treats **GCS existence as the single source of truth**: a GCS hit re-signs a fresh 1h URL (`cached: true`); a miss synthesizes via Google TTS, uploads to GCS, signs, and records the path in Redis (`cached: false`)
- **Write-only at runtime**: Redis is a **pre-gen path index** — the only request-path interaction is the best-effort `setPath` on fresh-create. `getPath` is never called at runtime (unit tests / future pre-gen only), and there is no Redis backfill on a cold hit. Therefore **hot cache hit == cold cache hit** (both run `fileExists → getSignedUrl`). A Redis write failure never fails a request.

## AI Feedback Caching

- **Cache Key**: `quiz:feedback:{wordId}:{userAnswer}` (case-insensitive)
- **TTL**: 24 hours

## Cache Fallback

When Redis is unavailable:

- System automatically falls back to `NoOpCacheService`
- All requests bypass cache and call external APIs directly
- No errors thrown; graceful degradation
- Health endpoint shows `redis.connected: false`

> **Full documentation:** See [Caching Patterns Guide](../../../../docs/guides/operations/caching-patterns.md) for setup, troubleshooting, namespace isolation, and production tuning.

_Conversation caching section removed — the conversation feature is no longer part of the backend._
