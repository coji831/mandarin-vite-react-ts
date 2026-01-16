# Caching Strategies

**Category:** Third-Party Integrations  
**Last Updated:** January 16, 2026

---

## Redis Cache-Aside Pattern

**When Adopted:** Epic 13 (Production Backend Architecture)  
**Why:** Reduce expensive API calls (TTS, AI), improve response times  
**Use Case:** Cache TTS audio, AI conversations, user progress

### Minimal Example

```typescript
// 1. Install
npm install redis

import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

await redis.connect();

// 2. Cache-Aside Pattern (Read-Through)
async function getWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    console.log('Cache hit:', key);
    return JSON.parse(cached);
  }

  // Cache miss: fetch and store
  console.log('Cache miss:', key);
  const data = await fetchFn();
  await redis.setEx(key, ttl, JSON.stringify(data));

  return data;
}

// 3. Usage example: Cache TTS audio URLs
async function getTTSAudio(text: string): Promise<string> {
  const cacheKey = `tts:${text}`;

  return getWithCache(
    cacheKey,
    async () => {
      // Expensive operation: generate TTS
      const audio = await generateMandarin(text);
      const url = await uploadToGCS(audio);
      return url;
    },
    86400 // Cache for 24 hours
  );
}

// 4. Cache invalidation
async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

// Example: Clear all TTS cache
await invalidateCache('tts:*');
```

### Advanced Patterns

```typescript
// Write-Through Cache (Update cache on write)
async function updateProgress(userId: string, data: Progress): Promise<void> {
  // Update database
  await prisma.progress.update({
    where: { id: data.id },
    data,
  });

  // Update cache
  const cacheKey = `progress:${userId}`;
  await redis.setEx(cacheKey, 3600, JSON.stringify(data));
}

// Cache with fallback (graceful degradation)
async function getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.warn("Redis error, falling back:", error);
  }

  // Always fetch if cache fails
  return fetchFn();
}

// Batch cache operations
async function batchGet(keys: string[]): Promise<Record<string, any>> {
  const values = await redis.mGet(keys);
  const result: Record<string, any> = {};

  keys.forEach((key, i) => {
    if (values[i]) {
      result[key] = JSON.parse(values[i]);
    }
  });

  return result;
}
```

### Key Lessons

- Use TTL to prevent stale data (hours for stable, minutes for dynamic)
- Key naming convention: `{domain}:{identifier}` (e.g., `tts:hello`, `user:123`)
- Always handle Redis failures gracefully (fallback to DB)
- Use Redis for hot data only (not cold storage)
- Monitor cache hit rate (aim for 80%+)
- SHA256 hash cache keys for deterministic lookups (complex parameters)
- Store binary data as base64 strings in Redis (tradeoff: 33% size overhead vs fast retrieval)

### Cache TTL Guidelines

| Data Type        | TTL    | Reason                                |
| ---------------- | ------ | ------------------------------------- |
| TTS audio URLs   | 24h    | Expensive to generate, rarely changes |
| AI conversations | 1h     | User-specific, may regenerate         |
| User progress    | 15min  | Frequently updated                    |
| Static config    | 1 week | Rarely changes                        |

### When to Use

Expensive operations (API calls, complex queries), high-traffic endpoints

---

## Fail-Open vs Fail-Closed Strategies

**Adopted:** Story 13.5 (Redis Caching Layer)

### Fail-Open (Recommended for Caching)

**Definition**: System continues operating when cache fails, falling back to origin data source

**Implementation**:

```typescript
async get(key: string): Promise<string | null> {
  try {
    const value = await this.client.get(key);
    if (value) logger.cacheHit(key);
    return value;
  } catch (error) {
    logger.error(`GET error for key ${key}`, error);
    return null; // ← Fail open: treat as cache miss
  }
}
```

**When to Use**:

- Cache is performance optimization, not data source
- Service must remain available even if cache fails
- Acceptable to have slower responses during cache outage

**Example**: TTS audio caching - if Redis down, still generate audio via API

### Fail-Closed (Use Sparingly)

**Definition**: System refuses requests when cache unavailable

**When to Use**:

- Cache contains critical auth/security data
- Serving stale data is worse than service unavailability
- Cache is source of truth (not just optimization)

**Example**: Rate limiting cache - if Redis down, block all requests (avoid brute force)

### Factory Pattern for Graceful Degradation

```typescript
// Cache service factory with NoOp fallback
export function getCacheService(): CacheService {
  if (serviceInstance) return serviceInstance;

  const config = getCacheConfig();
  if (config.enabled) {
    const client = redisClient;
    serviceInstance = new RedisCacheService(client, config);
  } else {
    serviceInstance = new NoOpCacheService(); // ← Fallback
  }
  return serviceInstance;
}

// NoOp implementation (safe fallback)
export class NoOpCacheService extends CacheService {
  async get(key: string): Promise<string | null> {
    return null; // Always cache miss
  }
  async set(key: string, value: string, ttl?: number): Promise<void> {
    // No-op: do nothing
  }
}
```

**Benefits**:

- Single environment variable (`CACHE_ENABLED=false`) disables caching
- No code changes needed to disable Redis
- Tests can run without Redis dependency

---

## Base64 Binary Storage in Redis

**Adopted:** Story 13.5 (TTS Audio Caching)

### Problem

Redis stores strings; binary data (audio, images) needs encoding

### Solution: Base64 Encoding

```typescript
// Storing binary audio in Redis
async synthesizeSpeech(text: string): Promise<Buffer> {
  const cacheKey = `tts:${hash(text)}`;

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return Buffer.from(cached, "base64"); // ← Decode base64
  }

  // Generate audio
  const audioBuffer = await ttsService.generate(text);

  // Store as base64
  const base64Audio = audioBuffer.toString("base64"); // ← Encode
  await cache.set(cacheKey, base64Audio, 86400);

  return audioBuffer;
}
```

### Tradeoffs

| Aspect              | Base64 in Redis        | File Storage (GCS/S3)  |
| ------------------- | ---------------------- | ---------------------- |
| **Retrieval Speed** | <5ms                   | 50-200ms               |
| **Size Overhead**   | +33% (base64 encoding) | None                   |
| **Cost**            | Redis memory           | Object storage         |
| **TTL Management**  | Automatic expiration   | Manual cleanup         |
| **Best For**        | Hot data (<24h TTL)    | Cold/long-term storage |

### When to Use

- Frequently accessed binary data (<1MB each)
- Short-lived cache (hours, not days)
- Latency-sensitive operations (<10ms target)
- Already using Redis for other data

### When NOT to Use

- Large files (>5MB) - use object storage
- Long-term storage (weeks/months) - Redis too expensive
- Rarely accessed data (cold storage)

---

## SHA256 Cache Key Generation

**Adopted:** Story 13.5 (Deterministic Cache Keys)

### Problem

Complex parameters make cache keys unpredictable:

```typescript
// Bad: Non-deterministic key
const key = `tts:${text}|${voice}|${speed}|${tone}`; // Order matters!
```

### Solution: Hash Parameters

```typescript
import crypto from "crypto";

function generateCacheKey(text: string, voiceConfig: VoiceConfig): string {
  // Normalize parameter order
  const data = `${text}|${voiceConfig.languageCode}|${voiceConfig.name}|${voiceConfig.ssmlGender}`;

  // Hash for deterministic, short key
  const hash = crypto.createHash("sha256").update(data).digest("hex");

  return `tts:${hash}`;
}
```

**Benefits**:

- Deterministic: same params → same key
- Fixed length: 64 chars regardless of input size
- Collision-resistant: SHA256 ensures uniqueness
- Readable prefix: `tts:` for namespace isolation

### When to Use

- 3+ parameters in cache key
- Variable-length parameters (long text strings)
- Need consistent keys across service restarts
- Multiple services sharing cache namespace

---

**Related Guides:**

- [Google Cloud Services](./integration-google-cloud.md) — What to cache (TTS, AI)
- [Backend Architecture](./backend-architecture.md) — Where to add caching layer
- [Redis Caching Guide](../guides/redis-caching-guide.md) — Project-specific Railway Redis setup
