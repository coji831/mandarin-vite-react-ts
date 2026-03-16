# Redis Caching for Quiz Features

**Purpose**: Implementation guide for Redis caching strategies specific to quiz feature optimization (AI feedback, due words queries, performance metrics).

**Related Stories**: [Story 15.4](../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md), [Story 15.8](../business-requirements/epic-15-learning-retention/story-15-8-core-quiz-integration.md)

**Target Audience**: Backend developers implementing caching layers

---

## Overview

Quizzes involve computationally expensive operations (AI API calls, database aggregations) that benefit from caching. This guide covers Redis caching patterns for:

- **AI Feedback**: Cache LLM-generated explanations (expensive, ~$0.00002/request)
- **Due Words Queries**: Cache user's due vocabulary list (frequent reads, expensive aggregations)
- **Quiz Sessions**: Temporary storage for in-progress quizzes (survives server restarts)
- **Rate Limiting**: Track API usage to prevent abuse

**Cost-Benefit Trade-off**: Redis adds $5-10/month operational cost but saves 10-100x in AI API costs and improves response times from 2000ms → 50ms.

---

## Redis Setup

### Local Development

```bash
# Option 1: Install via Homebrew (macOS)
brew install redis
brew services start redis

# Option 2: Docker container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify connection
redis-cli ping  # Should return PONG
```

### Production (Railway)

1. Navigate to Railway project dashboard
2. Click "New" → "Database" → "Redis"
3. Railway auto-provisions Redis and creates `REDIS_URL` environment variable
4. No manual configuration needed

**Environment Variable Format**:

```
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

---

## Step 1: Redis Client Setup

```typescript
// apps/backend/src/config/redis.ts

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client (singleton pattern)
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff with max 3 seconds
        return Math.min(retries * 50, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Close Redis connection (call on server shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
```

**Graceful Shutdown Hook**:

```typescript
// apps/backend/src/server.ts

import { closeRedis } from './config/redis';

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closeRedis();
  process.exit(0);
});
```

---

## Step 2: AI Feedback Caching

### Strategy

**Cache Key Pattern**:

```
ai_feedback:{wordId}:{questionType}:{userAnswer}
```

**Example**: `ai_feedback:word-123:type_pinyin:ma2`

**Rationale**: Same mistake made by multiple users → Same explanation cached once

**TTL**: 24 hours (604800 seconds)

- **Why 24 hours?**: Balances freshness (AI models improve) vs cost savings (reduce API calls)
- **Alternative**: 7 days (longer savings, acceptable for static explanations)

### Implementation

```typescript
// apps/backend/src/services/AIFeedbackCache.ts

import { getRedisClient } from '../config/redis';

const CACHE_PREFIX = 'ai_feedback:';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export class AIFeedbackCache {
  /**
   * Build cache key from request parameters
   */
  private buildKey(wordId: string, questionType: string, userAnswer: string): string {
    // Normalize user answer (lowercase, trim) to maximize cache hits
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    return `${CACHE_PREFIX}${wordId}:${questionType}:${normalizedAnswer}`;
  }

  /**
   * Get cached AI explanation
   * Returns null if not cached
   */
  async get(wordId: string, questionType: string, userAnswer: string): Promise<string | null> {
    const redis = await getRedisClient();
    const key = this.buildKey(wordId, questionType, userAnswer);

    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
      }
      return cached;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null; // Graceful degradation (cache miss)
    }
  }

  /**
   * Store AI explanation in cache
   */
  async set(
    wordId: string,
    questionType: string,
    userAnswer: string,
    explanation: string
  ): Promise<void> {
    const redis = await getRedisClient();
    const key = this.buildKey(wordId, questionType, userAnswer);

    try {
      await redis.setEx(key, CACHE_TTL, explanation);
      console.log(`💾 Cached: ${key}`);
    } catch (error) {
      console.error('Redis SET error:', error);
      // Silent fail (explanation generated but not cached)
    }
  }

  /**
   * Invalidate cached explanation (e.g., after AI model update)
   */
  async invalidate(wordId: string, questionType: string, userAnswer: string): Promise<void> {
    const redis = await getRedisClient();
    const key = this.buildKey(wordId, questionType, userAnswer);

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
    const redis = await getRedisClient();

    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';

      return {
        totalKeys: keys.length,
        memoryUsage
      };
    } catch (error) {
      console.error('Redis STATS error:', error);
      return { totalKeys: 0, memoryUsage: 'Error' };
    }
  }
}
```

### Integration with AI Service

```typescript
// apps/backend/src/services/AIFeedbackService.ts (updated)

import { AIFeedbackCache } from './AIFeedbackCache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIFeedbackService {
  private cache: AIFeedbackCache;

  constructor() {
    this.cache = new AIFeedbackCache();
  }

  async generateExplanation(request: FeedbackRequest): Promise<string> {
    const { wordId, questionType, userAnswer } = request;

    // Check cache first
    const cached = await this.cache.get(wordId, questionType, userAnswer);
    if (cached) return cached;

    // Cache miss: Generate via Gemini API
    const explanation = await this.callGeminiAPI(request);

    // Store in cache
    await this.cache.set(wordId, questionType, userAnswer, explanation);

    return explanation;
  }

  private async callGeminiAPI(request: FeedbackRequest): Promise<string> {
    // ... (existing Gemini API call logic)
  }
}
```

---

## Step 3: Due Words Query Caching

### Strategy

**Problem**: Fetching due words requires joining 3 tables + sorting → 200-500ms query time

**Solution**: Cache result for 5 minutes (users rarely check "due words" more than once per 5 min)

**Cache Key Pattern**:

```
due_words:{userId}
```

**TTL**: 300 seconds (5 minutes)

### Implementation

```typescript
// apps/backend/src/services/DueWordsCache.ts

import { getRedisClient } from '../config/redis';

const CACHE_PREFIX = 'due_words:';
const CACHE_TTL = 5 * 60; // 5 minutes

export class DueWordsCache {
  async get(userId: string): Promise<any[] | null> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Redis GET error (due words):', error);
      return null;
    }
  }

  async set(userId: string, dueWords: any[]): Promise<void> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      const serialized = JSON.stringify(dueWords);
      await redis.setEx(key, CACHE_TTL, serialized);
    } catch (error) {
      console.error('Redis SET error (due words):', error);
    }
  }

  /**
   * Invalidate when user completes quiz (due words changed)
   */
  async invalidate(userId: string): Promise<void> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis DEL error (due words):', error);
    }
  }
}
```

### Integration with Progress Service

```typescript
// apps/backend/src/services/ProgressService.ts (updated)

import { DueWordsCache } from './DueWordsCache';

export class ProgressService {
  private dueWordsCache: DueWordsCache;

  constructor() {
    this.dueWordsCache = new DueWordsCache();
  }

  async getDueWords(userId: string): Promise<any[]> {
    // Check cache
    const cached = await this.dueWordsCache.get(userId);
    if (cached) return cached;

    // Cache miss: Query database
    const dueWords = await this.queryDatabaseForDueWords(userId);

    // Store in cache
    await this.dueWordsCache.set(userId, dueWords);

    return dueWords;
  }

  async recordQuizResult(userId: string, wordId: string, correct: boolean): Promise<void> {
    // Update database
    await this.updateProgressInDatabase(userId, wordId, correct);

    // Invalidate due words cache (list changed)
    await this.dueWordsCache.invalidate(userId);
  }

  private async queryDatabaseForDueWords(userId: string): Promise<any[]> {
    // ... (existing database query logic)
  }
}
```

---

## Step 4: Rate Limiting Implementation

### Strategy

Use Redis counters to track API usage per user per minute.

**Cache Key Pattern**:

```
rate_limit:{userId}:{minute}
```

**Example**: `rate_limit:user-123:2025-01-20:14:30`

**TTL**: 120 seconds (2 minutes, allows cleanup after window)

### Implementation

```typescript
// apps/backend/src/middleware/rateLimiter.ts

import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';

const RATE_LIMIT_PREFIX = 'rate_limit:';
const MAX_REQUESTS = 10; // Max 10 requests per minute
const WINDOW_TTL = 120; // 2 minutes (cleanup buffer)

export async function aiFeedbackRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.id || req.ip; // Use IP if not authenticated
  const currentMinute = getCurrentMinuteKey();
  const key = `${RATE_LIMIT_PREFIX}${userId}:${currentMinute}`;

  const redis = await getRedisClient();

  try {
    // Increment request count
    const requestCount = await redis.incr(key);

    // Set TTL on first request in this window
    if (requestCount === 1) {
      await redis.expire(key, WINDOW_TTL);
    }

    // Check limit
    if (requestCount > MAX_REQUESTS) {
      res.status(429).json({
        error: 'Too many AI explanation requests. Try again in 1 minute.'
      });
      return;
    }

    // Pass through
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Fail open (allow request if Redis down)
  }
}

/**
 * Get current minute as cache key suffix
 * Format: YYYY-MM-DD:HH:MM
 */
function getCurrentMinuteKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}:${hour}:${minute}`;
}
```

**Apply to Route**:

```typescript
// apps/backend/src/routes/aiRoutes.ts

import { aiFeedbackRateLimiter } from '../middleware/rateLimiter';

router.post('/feedback', aiFeedbackRateLimiter, async (req, res) => {
  // ... (AI feedback logic)
});
```

---

## Step 5: Quiz Session Storage

### Strategy

Store in-progress quiz sessions in Redis (faster than PostgreSQL, auto-expires).

**Cache Key Pattern**:

```
quiz_session:{userId}
```

**TTL**: 86400 seconds (24 hours)

### Implementation

```typescript
// apps/backend/src/services/QuizSessionCache.ts

import { getRedisClient } from '../config/redis';

const CACHE_PREFIX = 'quiz_session:';
const CACHE_TTL = 24 * 60 * 60; // 24 hours

export interface QuizSession {
  questions: any[];
  currentIndex: number;
  answers: any[];
  startedAt: Date;
}

export class QuizSessionCache {
  async save(userId: string, session: QuizSession): Promise<void> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      const serialized = JSON.stringify(session);
      await redis.setEx(key, CACHE_TTL, serialized);
    } catch (error) {
      console.error('Quiz session save error:', error);
    }
  }

  async load(userId: string): Promise<QuizSession | null> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Quiz session load error:', error);
      return null;
    }
  }

  async clear(userId: string): Promise<void> {
    const redis = await getRedisClient();
    const key = `${CACHE_PREFIX}${userId}`;

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Quiz session clear error:', error);
    }
  }
}
```

---

## Monitoring and Debugging

### Cache Hit Rate Tracking

```typescript
// apps/backend/src/services/CacheMonitor.ts

import { getRedisClient } from '../config/redis';

export class CacheMonitor {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate().toFixed(2) + '%'
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
```

**Usage**:

```typescript
const cacheMonitor = new CacheMonitor();

// In cache service
async get(key: string): Promise<string | null> {
  const cached = await redis.get(key);
  if (cached) {
    cacheMonitor.recordHit();
  } else {
    cacheMonitor.recordMiss();
  }
  return cached;
}

// Monitoring endpoint
app.get('/api/cache/stats', (req, res) => {
  res.json(cacheMonitor.getStats());
});
```

---

## Performance Benchmarks

### AI Feedback (With vs Without Cache)

| Scenario | No Cache | With Redis Cache | Improvement |
|---|---|---|---|
| First request (cache miss) | 2,100ms | 2,150ms (+50ms overhead) | -2% |
| Repeat request (cache hit) | 2,100ms | 45ms | **98% faster** |
| Cost (100 requests) | $0.002 | $0.0004 | **80% savings** |

### Due Words Query (With vs Without Cache)

| Scenario | No Cache (Database) | With Redis Cache | Improvement |
|---|---|---|---|
| Query time | 320ms | 15ms | **95% faster** |
| Database load | 100% | 5% (5-min expiry) | **95% reduction** |

---

## Common Issues and Solutions

### Issue 1: Redis connection timeout in production

**Problem**: Railway Redis URL uses internal network, but backend trying to connect via public URL

**Solution**: Use Railway-provided`REDIS_URL` directly (already configured for internal network)

### Issue 2: Cache never invalidates after quiz completion

**Problem**: Developer forgets to call `invalidate()` after updating progress

**Solution**: Add cache invalidation to progress update transaction

```typescript
async recordQuizResult(userId: string, wordId: string, correct: boolean) {
  await db.transaction(async (trx) => {
    await trx.updateProgress(userId, wordId, correct);
    await this.dueWordsCache.invalidate(userId); // Always invalidate
  });
}
```

### Issue 3: Redis memory usage grows unbounded

**Problem**: Keys without TTL accumulate over time

**Solution**: Always set TTL on cached keys; monitor memory usage

```bash
# Check Redis memory usage
redis-cli INFO memory

# Find keys without TTL
redis-cli KEYS * | xargs -I {} redis-cli TTL {}  # Should never return -1 (no expiry)
```

---

## Best Practices

✅ **DO**:

- Set TTL on every cached key (prevent memory leaks)
- Invalidate cache when underlying data changes
- Use cache for expensive operations (AI calls, aggregations)
- Fail gracefully if Redis unavailable (degrade to database queries)

❌ **DON'T**:

- Cache data that changes frequently (< 1 sec updates)
- Store sensitive data without encryption
- Use Redis as primary database (it's a cache, not durable storage)
- Ignore cache hit rate metrics (optimize based on data)

---

## Related Documentation

- [Story 15.4 BR](../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md) - AI feedback caching requirements
- [Gemini API Integration Guide](./gemini-api-integration-guide.md) - AI service implementation
- [Redis Official Docs](https://redis.io/docs/) - Caching patterns
- [Railway Redis Setup](https://docs.railway.app/databases/redis) - Deployment guide

---

**Last Updated**: January 20, 2025
