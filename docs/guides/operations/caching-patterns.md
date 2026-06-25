# Caching Patterns & Strategies

**Last Updated:** June 3, 2026
**Purpose:** Application-specific Redis caching patterns, key strategies, monitoring, and performance tuning for the Mandarin learning app
**Audience:** Backend developers implementing or debugging cache behavior for TTS, AI feedback, quiz sessions, and due words

> **Note:** This guide covers application-specific caching patterns. For Redis setup, configuration, and connection options, see the [Redis Setup Guide](../setup/redis.md).

---

## Cache Key Format

All keys are prefixed with `mandarin:` to isolate from other projects sharing the same Redis instance.

### TTS Keys

**Format**: `tts:{SHA256(text + voice)}`

**Example**:

```
Input: text="你好", voice="cmn-CN-Wavenet-A"
Key: tts:a9d0701a3ecaf57d90eb272fc1618eaed238b864ad120c6b4324d11abe014c7c
```

**Storage**: Base64-encoded audio Buffer

**TTL**: 24 hours (86400 seconds)

### AI Feedback Keys

**Format**: `ai_feedback:{wordId}:{questionType}:{normalizedAnswer}`

**TTL**: 24 hours (86400 seconds)

**Notes**: Normalize answers (lowercase, trim) to maximize cache hits.

### Due Words Keys

**Format**: `due_words:{userId}`

**TTL**: 5 minutes (300 seconds)

**Notes**: Invalidate after progress updates or quiz completion.

### Quiz Session Keys

**Format**: `quiz_session:{userId}`

**TTL**: 24 hours (86400 seconds)

**Notes**: Stores in-progress session state (questions, answers, index).

---

## Cache Invalidation

### Automatic Invalidation

- **TTL Expiration**: Redis automatically removes keys after TTL expires
- **Memory Pressure**: Railway Redis may evict keys if memory limit reached (LRU policy)

### Clear All Keys (Development Only)

```bash
# Connect to Railway Redis CLI
railway run redis-cli

# Delete all keys with prefix
> KEYS mandarin:*
> DEL mandarin:tts:abc123 mandarin:ai_feedback:def456 ...

# Or flush entire database (WARNING: affects all data)
> FLUSHDB
```

---

## Monitoring

### Health Endpoint Metrics

Visit `http://localhost:3001/api/v1/health` (or production URL) to see real-time cache metrics:

```json
{
  "cache": {
    "redis": { "connected": true },
    "metrics": {
      "services": {
        "TTS": { "hits": 300, "misses": 100, "total": 400, "hitRate": "75.00" }
      },
      "overall": { "hits": 300, "misses": 100, "total": 400, "hitRate": "75.00" }
    }
  }
}
```

**Metrics Reset**: Metrics reset on server restart (in-memory tracking).

### Railway Dashboard Monitoring

1. Open Railway project → Redis service
2. View built-in metrics:
   - **Memory Usage**: Should stay <100MB for typical usage
   - **Commands/Second**: Spikes during high traffic
   - **Connected Clients**: Backend connection count (usually 1)

3. Set up alerts (optional):
   - Settings → Alerts → Add Alert
   - Trigger: Memory usage >80%
   - Notification: Email or webhook

### Application Logs

Cache operations are logged via `createLogger()`:

```
[CachedTTSService] Cache Miss: tts:a9d0701a...
[CachedTTSService] Generated and cached TTS: tts:a9d0701a...
[CachedTTSService] Cache Hit: tts:a9d0701a...
[RedisCacheService] SET: tts:a9d0701a... (TTL: 86400s)
[RedisCacheService] Cache Hit: tts:a9d0701a...
```

---

## Performance Expectations

### Cache Hit Scenarios

| Metric              | Target | Typical  |
| ------------------- | ------ | -------- |
| Response Time (p95) | <200ms | 50-150ms |
| Redis Latency       | <10ms  | 2-5ms    |
| Cache Hit Rate      | >50%   | 60-80%   |

### Cache Miss Scenarios

| Metric                    | Target   | Typical  |
| ------------------------- | -------- | -------- |
| TTS Response Time         | <2s      | 1-1.5s   |
| AI Feedback Response Time | <3s      | 1.5-2.5s |
| External API Latency      | Variable | 500ms-2s |

### Load Testing

Use Artillery to benchmark under load:

```bash
artillery run apps/backend/scripts/loadTest.yml
```

Expected results (60s test, 10 req/s):

- Total requests: ~600
- Cache hit rate: >50% after warm-up
- p95 latency for hits: <200ms
- No errors or timeouts
  See [LOAD_TEST_README.md](../../../apps/backend/scripts/LOAD_TEST_README.md) for details.

---

## Best Practices

### 1. Monitor Metrics

Regularly check `/api/v1/health` to ensure cache is working:

- Hit rate >50% indicates healthy caching
- Connected: false indicates Redis issue

### 2. Load Testing

Run load tests before deploying changes to verify cache performance under traffic.

### 3. Quiz-Specific Practices

- Invalidate `due_words` cache inside the **same transaction** that updates progress to avoid stale data
- Normalize user answers (lowercase, trim) before building AI feedback keys to maximize cache hits
- Verify quiz session TTL and that session keys use `EX`/`SETEX` to prevent premature loss
- Cache never invalidates after quiz completion: ensure `due_words` cache is invalidated in the progress-update transaction

### 4. Cache Hit Rate Debugging

If cache hit rate is 0% or very low, check for:

- Cache keys not consistent (random components in key generation)
- TTL too short (keys expire before reuse)
- Different text/voice variations per request

**Diagnostics**:

1. Check logs for "Cache Hit" vs "Cache Miss" ratio
2. Verify cache key generation is deterministic:
   ```javascript
   const key1 = service.generateCacheKey("你好", "voice-a");
   const key2 = service.generateCacheKey("你好", "voice-a");
   console.log(key1 === key2); // Should be true
   ```
3. Check Railway Redis memory usage (if 0MB, keys aren't being stored)

### 5. Memory Management

- Verify TTL is applied: `redis-cli TTL mandarin:tts:abc123` (should return seconds remaining)
- Check key count: `redis-cli KEYS mandarin:* | wc -l`
- Review cache key format for unnecessary uniqueness (e.g., timestamps in keys)
- Consider shorter TTLs or memory limits in Railway

---

## Troubleshooting: Quiz & Cache Issues

### Cache never invalidates after quiz completion

**Cause**: The `due_words` cache is not cleared inside the transaction that updates user progress.

**Solution**: Ensure cache invalidation happens atomically with the progress update.

### AI feedback duplicates due to answer normalization mismatch

**Cause**: Different casing or whitespace in user answers produces different cache keys for semantically identical answers.

**Solution**: Always normalize (lowercase + trim) user answers before building cache keys.

### Quiz session lost prematurely

**Cause**: TTL not set or session keys stored without `EX`/`SETEX`.

**Solution**: Verify TTL and that session keys are set with expiration flags.

---

## Related Documentation

- [Environment Setup](../getting-started/environment-setup.md) — Environment variables reference
- [API Specification](../../../apps/backend/docs/api-spec.md) — Endpoint documentation with cache behavior
- [Load Testing Guide](../../../apps/backend/scripts/LOAD_TEST_README.md) — Artillery load test instructions
- [Integration Caching](../../knowledge-base/infrastructure/integration-caching.md) — Transferable caching concepts and deeper rationale
