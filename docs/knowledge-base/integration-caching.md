# Caching Strategies

**Category:** Third-Party Integrations  
**Last Updated:** December 9, 2025

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

**Related Guides:**

- [Google Cloud Services](./integration-google-cloud.md) — What to cache (TTS, AI)
- [Backend Architecture](./backend-architecture.md) — Where to add caching layer
