# Caching Strategy

**Last Updated:** July 1, 2026

The backend implements Redis-based caching to reduce external API calls and improve response times.

## TTS Caching

- **Cache Key Format**: `tts:{SHA256(text + voice)}`
- **TTL**: 24 hours (86400 seconds)
- **Storage**: Audio data stored as base64-encoded strings
- **Behavior**: First request fetches from Google TTS and caches result; subsequent requests return cached audio instantly

## AI Feedback Caching

- **Cache Key**: `quiz:feedback:{wordId}:{userAnswer}` (case-insensitive)
- **TTL**: 24 hours

## Cache Fallback

When Redis is unavailable:

- System automatically falls back to `NoOpCacheService`
- All requests bypass cache and call external APIs directly
- No errors thrown; graceful degradation
- Health endpoint shows `redis.connected: false`

> **Full documentation:** See [Caching Patterns Guide](../../../docs/guides/operations/caching-patterns.md) for setup, troubleshooting, namespace isolation, and production tuning.

_Conversation caching section removed — the conversation feature is no longer part of the backend._
