# Implementation 13-5: Redis Caching Layer

## Technical Scope

Integrate Redis for caching external API responses (Google TTS, conversation generation). Implement graceful fallback when Redis unavailable. Add cache metrics logging and load testing verification.

## Implementation Details

```typescript
// apps/backend/src/infrastructure/cache/RedisClient.ts
import Redis from "ioredis";

class RedisClient {
  private client: Redis | null = null;
  private isAvailable: boolean = false;

  constructor() {
    try {
      this.client = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error("Redis connection failed after 3 retries");
            this.isAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000); // Exponential backoff
        },
      });

      this.client.on("connect", () => {
        console.log("Redis connected");
        this.isAvailable = true;
      });

      this.client.on("error", (error) => {
        console.error("Redis error:", error);
        this.isAvailable = false;
      });
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      this.isAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable || !this.client) return false;

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable || !this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Redis del error:", error);
      return false;
    }
  }

  getAvailability(): boolean {
    return this.isAvailable;
  }
}

export const redisClient = new RedisClient();
```

```typescript
// apps/backend/src/core/services/CachedTTSService.ts
import { TTSService } from "./TTSService";
import { redisClient } from "../../infrastructure/cache/RedisClient";
import crypto from "crypto";

export class CachedTTSService {
  private ttsService: TTSService;
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.ttsService = new TTSService();
  }

  async synthesize(text: string, voice: string = "cmn-CN-Wavenet-A"): Promise<string> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(text, voice);

    // Try cache first
    const cachedUrl = await redisClient.get<string>(cacheKey);
    if (cachedUrl) {
      this.cacheHits++;
      this.logCacheMetrics();
      return cachedUrl;
    }

    // Cache miss - call external API
    this.cacheMisses++;
    const audioUrl = await this.ttsService.synthesize(text, voice);

    // Store in cache
    await redisClient.set(cacheKey, audioUrl, this.CACHE_TTL);
    this.logCacheMetrics();

    return audioUrl;
  }

  private generateCacheKey(text: string, voice: string): string {
    const hash = crypto.createHash("sha256").update(`${text}:${voice}`).digest("hex");
    return `tts:${hash}`;
  }

  private logCacheMetrics() {
    const total = this.cacheHits + this.cacheMisses;
    if (total % 100 === 0) {
      // Log every 100 requests
      const hitRate = ((this.cacheHits / total) * 100).toFixed(2);
      console.log(
        `TTS Cache - Hits: ${this.cacheHits}, Misses: ${this.cacheMisses}, Hit Rate: ${hitRate}%`
      );
    }
  }

  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      redisAvailable: redisClient.getAvailability(),
    };
  }
}
```

```typescript
// apps/backend/src/core/services/CachedConversationService.ts
import { ConversationService } from "./ConversationService";
import { redisClient } from "../../infrastructure/cache/RedisClient";
import crypto from "crypto";

export class CachedConversationService {
  private conversationService: ConversationService;
  private readonly CACHE_TTL = 60 * 60; // 1 hour

  constructor() {
    this.conversationService = new ConversationService();
  }

  async generate(prompt: string, context: any): Promise<any> {
    const cacheKey = this.generateCacheKey(prompt, context);

    // Try cache
    const cached = await redisClient.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate new conversation
    const conversation = await this.conversationService.generate(prompt, context);

    // Cache result
    await redisClient.set(cacheKey, conversation, this.CACHE_TTL);

    return conversation;
  }

  private generateCacheKey(prompt: string, context: any): string {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ prompt, context }))
      .digest("hex");
    return `conversation:${hash}`;
  }

  async invalidateCache(pattern: string) {
    // Only invalidate if Redis available (graceful degradation)
    if (redisClient.getAvailability()) {
      await redisClient.del(pattern);
    }
  }
}
```

## Architecture Integration

```
API Request (TTS/Conversation)
    ↓
CachedTTSService / CachedConversationService
    ↓ check cache
RedisClient → Redis (Upstash)
    ↓ if miss
TTSService / ConversationService
    ↓ call external
Google Cloud TTS / Gemini API
    ↓ response
Cache in Redis (24h / 1h TTL)
```

Graceful fallback: If Redis unavailable, services function normally but without caching (every request hits external APIs).

## Technical Challenges & Solutions

```
Problem: Cache key generation (ensure uniqueness, avoid collisions)
Solution: Use SHA-256 hash of request parameters:
- TTS: hash of (text + voice)
- Conversation: hash of (prompt + context JSON)
- Prefix keys by resource type (tts:, conversation:)
- Collision probability negligible with SHA-256
```

```
Problem: Redis unavailable during request (network issues, service down)
Solution: Graceful fallback pattern:
- All cache operations wrapped in try-catch
- Return null on cache errors (treat as cache miss)
- Log errors but don't block requests
- Services function normally, just slower without cache
```

## Testing Implementation

**Unit Tests:**

- RedisClient connection handling and error recovery
- Cache key generation (uniqueness, consistency)
- Graceful fallback when Redis unavailable

**Integration Tests:**

- Full cache cycle: miss → fetch → cache → hit
- Cache hit rate >50% under simulated load
- System functions correctly with Redis disabled
- Cache invalidation removes correct keys

**Load Tests:**

- 100 concurrent users requesting TTS
- Measure cache hit rate (target >50%)
- Measure response times (cache hit <50ms, miss <2s)
- Verify external API costs reduced by >50%
