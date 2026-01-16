# Redis Caching Guide

Complete guide to Redis caching implementation in the Mandarin app backend.

## Overview

The backend uses **Railway Redis** for caching TTS audio and conversation text to reduce external API costs and improve response times. Redis runs in a shared dev/prod environment with namespace isolation via key prefixes.

### Key Benefits

- **Cost Reduction**: Cached requests avoid Google TTS/Gemini API charges
- **Performance**: Cache hits respond in <200ms vs 1-3s for API calls
- **Resilience**: Graceful fallback to NoOpCacheService when Redis unavailable
- **Monitoring**: Built-in cache hit/miss metrics via `/api/health` endpoint

### Architecture

```
Client Request
     ↓
Controller (TTS/Conversation)
     ↓
CachedService (wrapper)
     ├─ Cache Hit → Return cached data (Redis)
     └─ Cache Miss → Call external API → Store in Redis → Return data
```

## Railway Redis Setup

### Production/Development (Shared Instance)

1. **Provision Redis on Railway**

   - Open Railway project dashboard
   - Click "New" → "Database" → "Add Redis"
   - Wait ~1 minute for provisioning
   - Redis URL auto-injected as `REDIS_URL` environment variable

2. **Verify Connection**

   - Go to Redis service tab in Railway
   - Click "Connect" to test connection
   - Note the URL format: `redis://default:password@redis.railway.internal:6379`

3. **Key Prefix Namespace**
   - All keys prefixed with `mandarin:` to isolate from other projects
   - Example: `mandarin:tts:abc123`, `mandarin:conv:word-456:def789`

### Local Development Configuration

#### Option 1: Use Railway Redis (Recommended)

Local development uses the same Railway Redis instance as production. This simplifies setup and ensures consistency.

1. **Get Redis URL from Railway**

   ```bash
   # In Railway project → Redis service → Variables tab
   # Copy REDIS_URL value
   ```

2. **Add to root `.env.local`**

   ```bash
   REDIS_URL="redis://default:YOUR_PASSWORD@redis.railway.internal:6379"
   CACHE_ENABLED="true"
   CACHE_TTL_TTS="86400"        # 24 hours
   CACHE_TTL_CONVERSATION="3600" # 1 hour
   ```

3. **Start Backend**

   ```bash
   npm run dev:backend
   ```

4. **Verify Connection**
   - Check logs for: `[Redis Config] Configuration loaded`
   - Check logs for: `[Server] Cache service initialized { type: 'RedisCacheService', enabled: true }`
   - Visit `http://localhost:3001/api/health` → confirm `cache.redis.connected: true`

#### Option 2: Disable Caching (Fallback)

If Railway Redis is unavailable or you want to test without cache:

```bash
# In root .env.local
CACHE_ENABLED="false"
```

Server will use `NoOpCacheService` (all requests bypass cache).

## Cache Key Format

### TTS Keys

**Format**: `tts:{SHA256(text + voice)}`

**Example**:

```
Input: text="你好", voice="cmn-CN-Wavenet-A"
Key: tts:a9d0701a3ecaf57d90eb272fc1618eaed238b864ad120c6b4324d11abe014c7c
```

**Storage**: Base64-encoded audio Buffer

**TTL**: 24 hours (86400 seconds)

### Conversation Keys

**Format**: `conv:{wordId}:{SHA256(prompt)}`

**Example**:

```
Input: wordId="word-123", prompt="Generate conversation for 你好"
Key: conv:word-123:4093303f22caab6034f8a496bb05d6efefc4b5adb8bcade9affc41db7269414b
```

**Storage**: JSON stringified conversation object

**TTL**: 1 hour (3600 seconds)

## Cache Invalidation

### Manual Invalidation (Conversation)

```javascript
import { cachedConversationService } from "./controllers/conversationController.js";

// Clear all cached conversations for a specific word
const deletedCount = await cachedConversationService.clearCache("word-123");
console.log(`Deleted ${deletedCount} cache entries`);
```

### Automatic Invalidation

- **TTL Expiration**: Redis automatically removes keys after TTL expires
- **Memory Pressure**: Railway Redis may evict keys if memory limit reached (LRU policy)

### Clear All Keys (Development Only)

```bash
# Connect to Railway Redis CLI
railway run redis-cli

# Delete all keys with prefix
> KEYS mandarin:*
> DEL mandarin:tts:abc123 mandarin:conv:word-456:def789 ...

# Or flush entire database (⚠️ WARNING: affects all data)
> FLUSHDB
```

## Monitoring

### Health Endpoint Metrics

Visit `http://localhost:3001/api/health` (or production URL) to see real-time cache metrics:

```json
{
  "cache": {
    "redis": { "connected": true },
    "metrics": {
      "services": {
        "TTS": { "hits": 300, "misses": 100, "total": 400, "hitRate": "75.00" },
        "Conversation": { "hits": 50, "misses": 10, "total": 60, "hitRate": "83.33" }
      },
      "overall": { "hits": 350, "misses": 110, "total": 460, "hitRate": "76.09" }
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

## Troubleshooting

### Error: "Redis connection error: Redis is already connecting/connected"

**Cause**: Multiple calls to `getCacheService()` attempt to reconnect to Redis.

**Solution**: Ensure `getCacheService()` returns singleton instance. This was fixed in Phase 4 by making `getCacheService()` synchronous.

### Error: "Redis connection refused"

**Cause**: Railway Redis URL incorrect or Redis service down.

**Solutions**:

1. Verify `REDIS_URL` in `.env.local` matches Railway dashboard
2. Check Railway Redis service status (should show "Active")
3. Test connection: `railway run redis-cli ping` (should return PONG)
4. Fallback: Set `CACHE_ENABLED=false` to bypass cache

### Cache hit rate is 0% or very low

**Causes**:

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

### Server slow to start

**Cause**: Redis connection timeout or network latency.

**Solutions**:

- Increase ping timeout in `RedisClient.ping(timeout)` (default 5000ms)
- Use `lazyConnect: true` in ioredis config (connection deferred until first use)
- Check Railway network status

### Memory usage growing unbounded

**Cause**: TTL not set correctly or too many unique keys.

**Solutions**:

1. Verify TTL is applied: `redis-cli TTL mandarin:tts:abc123` (should return seconds remaining)
2. Check key count: `redis-cli KEYS mandarin:* | wc -l`
3. Review cache key format for unnecessary uniqueness (e.g., timestamps in keys)
4. Consider shorter TTLs or memory limits in Railway

### "Cannot find module '.prisma/client/default'"

**Cause**: Prisma client not generated after schema changes.

**Solution**:

```bash
cd apps/backend
npx prisma generate
```

## Performance Expectations

### Cache Hit Scenarios

| Metric              | Target | Typical  |
| ------------------- | ------ | -------- |
| Response Time (p95) | <200ms | 50-150ms |
| Redis Latency       | <10ms  | 2-5ms    |
| Cache Hit Rate      | >50%   | 60-80%   |

### Cache Miss Scenarios

| Metric                     | Target   | Typical  |
| -------------------------- | -------- | -------- |
| TTS Response Time          | <2s      | 1-1.5s   |
| Conversation Response Time | <3s      | 2-2.5s   |
| External API Latency       | Variable | 500ms-2s |

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

See [LOAD_TEST_README.md](../../apps/backend/scripts/LOAD_TEST_README.md) for details.

## Environment Variables Reference

| Variable                 | Required | Default | Description                                             |
| ------------------------ | -------- | ------- | ------------------------------------------------------- |
| `REDIS_URL`              | No       | -       | Railway Redis connection URL (auto-injected in Railway) |
| `CACHE_ENABLED`          | No       | `true`  | Set to `false` to disable caching                       |
| `CACHE_TTL_TTS`          | No       | `86400` | TTS cache TTL in seconds (24 hours)                     |
| `CACHE_TTL_CONVERSATION` | No       | `3600`  | Conversation cache TTL in seconds (1 hour)              |

**Note**: Backend loads environment variables from root `.env.local` via `dotenv` in `src/config/index.js`.

## Best Practices

### 1. Namespace Isolation

Always use `mandarin:` key prefix to avoid collisions with other Railway projects sharing Redis.

### 2. Deterministic Cache Keys

Ensure cache key generation is deterministic (same input → same key). Avoid timestamps, random values, or session IDs in keys.

### 3. Appropriate TTLs

- **TTS**: 24 hours (audio unlikely to change)
- **Conversations**: 1 hour (allows content updates)
- Adjust based on content change frequency

### 4. Graceful Degradation

Never throw errors on cache failures. Catch errors and fall back to external API:

```javascript
try {
  const cached = await cacheService.get(key);
  if (cached) return cached;
} catch (error) {
  logger.error("Cache error", error);
  // Continue to API call
}
```

### 5. Monitor Metrics

Regularly check `/api/health` to ensure cache is working:

- Hit rate >50% indicates healthy caching
- Connected: false indicates Redis issue

### 6. Load Testing

Run load tests before deploying changes to verify cache performance under traffic.

## Related Documentation

- [API Specification](../../apps/backend/docs/api-spec.md) - Endpoint documentation with cache behavior
- [Load Testing Guide](../../apps/backend/scripts/LOAD_TEST_README.md) - Artillery load test instructions
- [Backend README](../../apps/backend/README.md) - General backend setup and configuration
- [Railway Setup Guide](./railway-setup-guide.md) - Railway deployment and Redis provisioning (if exists)

## FAQ

**Q: Can I use local Redis instead of Railway Redis for development?**

A: Yes, but not recommended. Install Redis locally, update `REDIS_URL` to `redis://localhost:6379`, and restart server. However, using Railway Redis ensures dev/prod parity.

**Q: What happens if I delete the Railway Redis instance?**

A: Backend will fail to connect, fall back to `NoOpCacheService`, and continue functioning without cache. All requests will call external APIs.

**Q: How do I debug cache key mismatches?**

A: Enable debug logging:

```javascript
// Add to service
console.log("Generated key:", cacheKey);
```

Then compare keys for identical inputs to ensure consistency.

**Q: Can I manually inspect cached data?**

A: Yes, via Railway CLI:

```bash
railway run redis-cli
> GET mandarin:tts:abc123
> GET mandarin:conv:word-456:def789
```

**Q: Should I cache audio generation (per-turn audio)?**

A: Currently no. Only conversation text is cached. Per-turn audio uses GCS caching (separate system). Caching audio in Redis would increase memory usage significantly.
