# Caching Strategy

The backend implements Redis-based caching to reduce external API calls and improve response times.

## TTS Caching

- **Cache Key Format**: `tts:{SHA256(text + voice)}`
- **TTL**: 24 hours (86400 seconds)
- **Storage**: Audio data stored as base64-encoded strings
- **Behavior**: First request fetches from Google TTS and caches result; subsequent requests return cached audio instantly

## Conversation Caching

- **Cache Key Format**: `conv:{wordId}:{SHA256(prompt)}`
- **TTL**: 1 hour (3600 seconds)
- **Storage**: Conversation JSON serialized as string
- **Invalidation**: Can be manually cleared by wordId pattern via `clearCache()` method
- **Behavior**: First request generates via Gemini and caches result; subsequent requests return cached conversation

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
