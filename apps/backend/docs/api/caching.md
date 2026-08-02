# Caching Strategy

**Last Updated:** August 2, 2026

The backend implements Redis-based caching to reduce external API calls and improve response times.

## TTS Caching

- **Cache Key Format**: `tts:path:{SHA256(text + voice)}` — Redis stores the GCS **file path**, not the audio itself
- **Redis TTL**: 24 hours (86400 seconds) for the path entry; the returned signed URL has a 1-hour TTL (`TTS_SIGNED_URL_TTL_SECONDS = 3600`)
- **Storage**: Redis caches the GCS file path (string); the audio MP3 lives in GCS. Signed URLs are NOT cached — they expire, so a fresh URL is re-signed on every read
- **Behavior**: First request synthesizes via Google TTS and uploads to GCS; subsequent requests read the cached path, verify the GCS file exists, and return a freshly signed 1h URL. Stale path entries are invalidated and regenerated

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
