# Story 13.5: Redis Caching - Implementation Checklist

**Story**: [Story 13.5: Redis Caching Layer](./story-13-5-redis-caching.md)  
**Status**: Not Started  
**Last Updated**: January 14, 2026

---

## Phase 1: Infrastructure Setup

### 1.1 Railway Redis Provisioning

- [x] Open Railway dashboard for `mandarin-backend` project
- [x] Click "New" → "Database" → "Add Redis"
- [x] Wait for Redis instance to provision (~1 minute)
- [x] Verify `REDIS_URL` environment variable appears in Variables tab
- [x] Copy `REDIS_URL` value (format: `redis://:password@host:port`)
- [x] Test connection from Railway dashboard (Redis tab → "Connect" button)

### 1.2 Local Development Configuration

- [x] Update `.env.example` (root folder) with this example config:
  ```bash
  # Redis Configuration
  REDIS_URL="redis://default:password@redis.railway.internal:6379"
  CACHE_ENABLED="true"
  CACHE_TTL_TTS="86400"
  CACHE_TTL_CONVERSATION="3600"
  ```
- [x] Update local `.env.local` (root folder) with real Railway Redis URL in step 1.1 (same as production)
- [x] Document in `apps/backend/README.md`: "Development uses same Railway Redis instance (separate database index)"

### 1.3 Dependencies Installation

- [x] Add Redis packages to `apps/backend/package.json`:
  ```bash
  npm install ioredis --workspace=@mandarin/backend
  npm install -D ioredis-mock testcontainers --workspace=@mandarin/backend
  ```
- [x] Verify installation: `npm list ioredis --workspace=@mandarin/backend`
- [ ] Commit: `chore(story-13-5): add ioredis dependencies`

---

## Phase 2: Redis Client & Abstractions

### 2.1 Redis Configuration Module

- [ ] Create `apps/backend/src/config/redis.js`
- [ ] Parse `REDIS_URL` environment variable
- [ ] Handle Railway Redis format (with password authentication)
- [ ] Configure connection options:
  - `maxRetriesPerRequest: 3`
  - `enableReadyCheck: true`
  - `retryStrategy: exponential backoff (1s, 2s, 4s, max 10s)`
  - `lazyConnect: true`
- [ ] Export configuration object
- [ ] Test: `node -e "require('./apps/backend/src/config/redis.js')"`

### 2.2 Redis Client Wrapper

- [ ] Create `apps/backend/src/services/cache/RedisClient.js`
- [ ] Import ioredis and config
- [ ] Initialize ioredis client with config
- [ ] Add event listeners:
  - `connect`: log "Redis connected"
  - `error`: log error but don't throw
  - `close`: log "Redis connection closed"
  - `reconnecting`: log "Redis reconnecting..."
- [ ] Implement `ping()` method with 1s timeout
- [ ] Implement `quit()` method for graceful shutdown
- [ ] Export singleton instance
- [ ] Test manually: Create test script to verify connection

### 2.3 Cache Service Interface

- [ ] Create `apps/backend/src/services/cache/CacheService.js` (abstract class)
- [ ] Define methods:
  - `async get(key)`
  - `async set(key, value, ttl)`
  - `async delete(key)`
  - `async clear(pattern)`
  - `async getMulti(keys)`
- [ ] Add JSDoc comments for each method
- [ ] Export abstract class

### 2.4 Redis Cache Implementation

- [ ] Create `apps/backend/src/services/cache/RedisCacheService.js`
- [ ] Extend `CacheService` abstract class
- [ ] Constructor accepts `redisClient` dependency
- [ ] Implement `get()`:
  - Add namespace prefix: `mandarin:`
  - Call `redisClient.get(key)`
  - Return null on error (fail-open)
- [ ] Implement `set()`:
  - Add namespace prefix
  - Serialize value if object: `JSON.stringify()`
  - Call `redisClient.setex(key, ttl, value)`
  - Log error and continue on failure
- [ ] Implement `delete()`:
  - Add namespace prefix
  - Call `redisClient.del(key)`
- [ ] Implement `clear()`:
  - Use `SCAN` (not `KEYS`) for pattern matching
  - Delete in batches using pipeline
- [ ] Implement `getMulti()`:
  - Use `mget` for batch retrieval
  - Return Map of results
- [ ] Add structured logging for all operations
- [ ] Export class

### 2.5 No-Op Cache Implementation

- [ ] Create `apps/backend/src/services/cache/NoOpCacheService.js`
- [ ] Extend `CacheService` abstract class
- [ ] Implement all methods to return immediately:
  - `get()` → `null`
  - `set()` → `void` (no-op)
  - `delete()` → `void` (no-op)
  - `clear()` → `void` (no-op)
  - `getMulti()` → `new Map()`
- [ ] Log "CACHE_DISABLED" warning on initialization
- [ ] Export class

### 2.6 Cache Factory

- [ ] Create `apps/backend/src/services/cache/index.js`
- [ ] Import all cache implementations
- [ ] Implement `createCacheService()`:
  - Check if `CACHE_ENABLED === 'true'`
  - Try `redisClient.ping()` with timeout
  - If healthy → return `new RedisCacheService(redisClient)`
  - If error → log warning, return `new NoOpCacheService()`
- [ ] Implement `getCacheService()` singleton
- [ ] Export factory functions
- [ ] Test: Import and verify singleton pattern works

### 2.7 Unit Tests - Cache Services

- [ ] Create `apps/backend/src/services/cache/__tests__/RedisCacheService.test.js`
- [ ] Use `ioredis-mock` to mock Redis
- [ ] Test cases:
  - `set() then get() returns same value`
  - `get() non-existent key returns null`
  - `delete() removes key`
  - `clear() removes pattern-matched keys`
  - `TTL expires after configured time`
  - `Redis error doesn't crash (returns null)`
- [ ] Run tests: `npm test -- RedisCacheService`
- [ ] Verify all tests pass

- [ ] Create `apps/backend/src/services/cache/__tests__/NoOpCacheService.test.js`
- [ ] Test cases:
  - `get() always returns null`
  - `set() doesn't throw`
  - `Logs CACHE_DISABLED on init`
- [ ] Run tests: `npm test -- NoOpCacheService`
- [ ] Verify all tests pass

---

## Phase 3: Domain-Specific Cached Services

### 3.1 Cached TTS Service

- [ ] Create `apps/backend/src/services/tts/CachedTTSService.js`
- [ ] Constructor accepts `ttsService` and `cacheService` dependencies
- [ ] Import hash utility from `apps/backend/utils/hashUtils.js` (already exists)
- [ ] Implement `generateCacheKey(text, voice)`:
  - Format: `tts:{hash}` where hash = SHA256(text + voice)
  - Return string
- [ ] Implement `synthesize(text, options)`:
  - Generate cache key
  - Try `cacheService.get(cacheKey)`
  - If hit: log "CACHE_HIT", return cached value
  - If miss: log "CACHE_MISS"
    - Call `ttsService.synthesize(text, options)`
    - Store result: `cacheService.set(cacheKey, result, TTL_TTS)`
    - Return result
- [ ] Add metrics tracking (in-memory Map):
  - Increment `hits` counter on cache hit
  - Increment `misses` counter on cache miss
- [ ] Implement `getMetrics()` method
- [ ] Export class

### 3.2 Cached Conversation Service

- [ ] Create `apps/backend/src/services/conversation/CachedConversationService.js`
- [ ] Constructor accepts `conversationService` and `cacheService` dependencies
- [ ] Implement `generateCacheKey(wordId, prompt)`:
  - Format: `conv:{wordId}:{hash}` where hash = SHA256(prompt)
  - Return string
- [ ] Implement `generateConversation(wordId, word, options)`:
  - Generate cache key
  - Try `cacheService.get(cacheKey)`
  - If hit: log "CACHE_HIT", parse JSON, return conversation
  - If miss: log "CACHE_MISS"
    - Call `conversationService.generateConversation(wordId, word, options)`
    - Serialize result: `JSON.stringify(result)`
    - Store: `cacheService.set(cacheKey, serialized, TTL_CONVERSATION)`
    - Return result
- [ ] Add metrics tracking (hits/misses)
- [ ] Implement `getMetrics()` method
- [ ] Implement `clearCache(wordId)` for invalidation
- [ ] Export class

### 3.3 Unit Tests - Cached Services

- [ ] Create `apps/backend/src/services/tts/__tests__/CachedTTSService.test.js`
- [ ] Mock `TTSService` and `CacheService`
- [ ] Test cases:
  - `Cache hit skips TTS call`
  - `Cache miss calls TTS and stores result`
  - `Same input generates same cache key`
  - `Cache error falls back to TTS (no crash)`
  - `Metrics increment correctly`
- [ ] Run tests: `npm test -- CachedTTSService`
- [ ] Verify all tests pass

- [ ] Create `apps/backend/src/services/conversation/__tests__/CachedConversationService.test.js`
- [ ] Mock `ConversationService` and `CacheService`
- [ ] Test cases:
  - `Cache hit skips Gemini call`
  - `Cache miss calls Gemini and stores result`
  - `JSON serialization/deserialization works`
  - `clearCache() invalidates specific wordId`
  - `Metrics increment correctly`
- [ ] Run tests: `npm test -- CachedConversationService`
- [ ] Verify all tests pass

---

## Phase 4: Integration & Middleware

### 4.1 Server Initialization

- [ ] Open `apps/backend/src/index.js` (main server file)
- [ ] Import `getCacheService()` from `./services/cache/index.js`
- [ ] Initialize cache service before routes:
  ```javascript
  const cacheService = getCacheService();
  logger.info("Cache service initialized", {
    enabled: cacheService.constructor.name !== "NoOpCacheService",
  });
  ```
- [ ] Add graceful shutdown handler:
  ```javascript
  process.on("SIGTERM", async () => {
    await redisClient.quit();
    process.exit(0);
  });
  ```
- [ ] Test server starts without errors

### 4.2 Cache Metrics Middleware

- [ ] Create `apps/backend/src/middleware/cacheMetrics.js`
- [ ] Store metrics in-memory (Map per service type)
- [ ] Implement `getCacheMetrics()` function:
  - Collect TTS metrics
  - Collect Conversation metrics
  - Calculate hit rates
  - Return aggregated object
- [ ] Reset counters every 5 minutes (setInterval)
- [ ] Export `getCacheMetrics()`

### 4.3 Health Check Endpoint Update

- [ ] Open `apps/backend/controllers/healthController.js` (existing file)
- [ ] Import `redisClient` and `getCacheMetrics()`
- [ ] Add Redis health check:
  ```javascript
  const redisHealthy = await redisClient
    .ping()
    .then(() => true)
    .catch(() => false);
  ```
- [ ] Add cache metrics to response:
  ```javascript
  cache: {
    redis: { connected: redisHealthy },
    metrics: getCacheMetrics()
  }
  ```
- [ ] Test endpoint: `GET /api/health`
- [ ] Verify response includes Redis status

### 4.4 TTS Route Integration

- [ ] Open `apps/backend/controllers/ttsController.js` (existing file)
- [ ] Import `CachedTTSService`
- [ ] Replace direct `TTSService` instantiation with:
  ```javascript
  const ttsService = new TTSService();
  const cachedTtsService = new CachedTTSService(ttsService, cacheService);
  ```
- [ ] Update route handler to use `cachedTtsService`
- [ ] Test: `POST /api/tts` with same text twice
- [ ] Verify: Second request is faster (cache hit)
- [ ] Check logs for "CACHE_HIT" / "CACHE_MISS"

### 4.5 Conversation Route Integration

- [ ] Open `apps/backend/controllers/conversationController.js` (existing file)
- [ ] Import `CachedConversationService`
- [ ] Replace direct `ConversationService` instantiation with:
  ```javascript
  const conversationService = new ConversationService();
  const cachedConvService = new CachedConversationService(conversationService, cacheService);
  ```
- [ ] Update route handler to use `cachedConvService`
- [ ] Test: `POST /api/conversation` with same wordId twice
- [ ] Verify: Second request is faster (cache hit)
- [ ] Check logs for "CACHE_HIT" / "CACHE_MISS"

---

## Phase 5: Integration Testing

### 5.1 Local E2E Tests

- [ ] Start backend locally: `npm run dev:backend`
- [ ] Verify Redis connection in logs: "Redis connected"
- [ ] Test TTS endpoint:
  - Send request with text "你好"
  - Note response time (should be ~1-2s)
  - Send same request again
  - Note response time (should be <200ms)
  - Check `/api/health` → verify cache hit rate >0%
- [ ] Test Conversation endpoint:
  - Send request with wordId "word-123"
  - Note response time (should be ~2-3s)
  - Send same request again
  - Note response time (should be <200ms)
  - Check `/api/health` → verify cache hit rate >0%
- [ ] Test Redis unavailable scenario:
  - Pause Railway Redis instance
  - Restart backend
  - Verify logs: "Cache service initialized: NoOpCacheService"
  - Send TTS request → should work (no cache)
  - Resume Railway Redis

### 5.2 Integration Test Suite

- [ ] Create `apps/backend/tests/integration/cache.test.js`
- [ ] Use Testcontainers to spin up Redis container
- [ ] Test cases:
  - `Real Redis connection lifecycle`
  - `TTS request caching (hit rate >50% after 3 requests)`
  - `Conversation request caching (hit rate >50% after 3 requests)`
  - `Cache invalidation on clearCache()`
  - `TTL expiration (advance time, verify cache miss)`
- [ ] Run: `npm test -- cache.test`
- [ ] Verify all tests pass

### 5.3 Load Testing (Manual)

- [ ] Install artillery: `npm install -g artillery`
- [ ] Create `apps/backend/scripts/loadTest.yml`:
  ```yaml
  config:
    target: "http://localhost:3001"
    phases:
      - duration: 60
        arrivalRate: 10
  scenarios:
    - name: "TTS Cache Test"
      flow:
        - post:
            url: "/api/tts"
            json:
              text: "你好世界"
              voice: "cmn-CN-Wavenet-A"
  ```
- [ ] Run: `artillery run apps/backend/scripts/loadTest.yml`
- [ ] Check results:
  - p95 latency for cached requests <200ms
  - Total requests: ~600 (10 req/s × 60s)
  - Expected cache hit rate: >50% (check `/api/health`)
- [ ] Verify Railway Redis memory usage <100MB (Railway dashboard)

---

## Phase 6: Documentation & Monitoring

### 6.1 API Documentation Update

- [ ] Open `apps/backend/docs/api-spec.md`
- [ ] Add cache-related headers to endpoint docs:
  - `X-Cache-Status: HIT | MISS` (optional response header)
- [ ] Document `/api/health` cache metrics response format
- [ ] Add section: "Caching Strategy"
  - TTS: 24-hour TTL
  - Conversations: 1-hour TTL
  - Cache invalidation endpoints

### 6.2 Developer Guide

- [ ] Create `docs/guides/redis-caching-guide.md`
- [ ] Sections:
  - Overview
  - Railway Redis setup
  - Local development (using Railway Redis)
  - Cache key format
  - Cache invalidation
  - Troubleshooting (Redis connection errors)
  - Monitoring (health endpoint, Railway dashboard)
- [ ] Add link to guide in `docs/guides/README.md`

### 6.3 Railway Dashboard Setup

- [ ] Open Railway Redis dashboard
- [ ] Add alert: Memory usage >80% → email notification
- [ ] Verify metrics graphs visible:
  - Memory usage
  - Commands per second
  - Connected clients
- [ ] Take screenshot for documentation

### 6.4 Environment Variables Documentation

- [ ] Verify `.env.example` (root folder) has all Redis variables documented
- [ ] Update `apps/backend/README.md` → Environment Variables section
- [ ] Document each variable:
  - `REDIS_URL`: Railway auto-injects, copy from dashboard for local dev
  - `CACHE_ENABLED`: Set to "false" to disable caching
  - `CACHE_TTL_TTS`: TTS cache TTL in seconds (default: 86400)
  - `CACHE_TTL_CONVERSATION`: Conversation cache TTL (default: 3600)
- [ ] Note: Backend loads from root `.env.local` via `src/config/index.js`

---

## Phase 7: Story Completion

### 7.1 Acceptance Criteria Validation

- [ ] **AC1**: Redis client configured with graceful fallback
  - ✅ Test: Stop Redis → app continues with NoOpCacheService
- [ ] **AC2**: CachedTTSService wraps TTSService (24-hour TTL)
  - ✅ Test: Verify `TTL tts:key` returns ~86400 in Redis
- [ ] **AC3**: Conversation responses cached (1-hour TTL)
  - ✅ Test: Verify `TTL conv:key` returns ~3600 in Redis
- [ ] **AC4**: Cache hit/miss rates logged for monitoring
  - ✅ Test: Check `/api/health` endpoint returns metrics
- [ ] **AC5**: Cache hit rate >50% under load
  - ✅ Test: Artillery load test shows >50% hit rate
- [ ] **AC6**: API response times <200ms p95 for hits, <2s for misses
  - ✅ Test: Artillery results show p95 latencies within spec
- [ ] **AC7**: System functions correctly when Redis unavailable
  - ✅ Test: Pause Redis → app still serves requests (no cache)

### 7.2 Code Quality Checks

- [ ] Run all tests: `npm test --workspace=@mandarin/backend`
- [ ] Verify 100% pass rate
- [ ] Run linter: `npm run lint --workspace=@mandarin/backend`
- [ ] Fix any linting errors
- [ ] Type check (if TypeScript): `tsc --noEmit`
- [ ] Review code against conventions: `docs/guides/code-conventions.md`

### 7.3 Documentation Updates

- [ ] Update story BR file: Check all acceptance criteria boxes
- [ ] Create story implementation doc: `docs/issue-implementation/epic-13-production-backend-architecture/story-13-5-redis-caching.md`
- [ ] Update epic BR README: Mark story 13.5 complete
- [ ] Update epic implementation README: Add story 13.5 summary

### 7.4 Git Commit & PR

- [ ] Review all changes: `git status`
- [ ] Stage all files: `git add .`
- [ ] Commit with conventional format:

  ```bash
  git commit -m "feat(story-13-5): implement Redis caching layer

  - Add ioredis client with graceful fallback to NoOpCacheService
  - Implement CachedTTSService with 24-hour TTL
  - Implement CachedConversationService with 1-hour TTL
  - Add cache metrics tracking and health check integration
  - Achieve >50% cache hit rate under load testing
  - API response times: <200ms p95 for hits, <2s for misses
  - System degrades gracefully when Redis unavailable

  Closes story 13.5
  Related: #epic-13"
  ```

- [ ] Push branch: `git push origin epic-13-production-backend-architecture`
- [ ] Create PR with description from story implementation doc
- [ ] Request review
- [ ] Address review comments
- [ ] Merge after approval

---

## Rollback Plan

If issues arise post-deployment:

1. **Emergency Disable**:

   ```bash
   # In Railway dashboard, set environment variable:
   CACHE_ENABLED=false
   # Redeploy backend
   ```

2. **Partial Rollback**:

   - Keep Redis infrastructure
   - Revert controller changes to use non-cached services
   - Redeploy

3. **Full Rollback**:
   - Revert entire PR
   - Remove Railway Redis plugin (optional - can keep for future use)

---

## Notes & Blockers

### Decisions Made

- Using Railway Redis (not local Docker) for development
- Single Redis instance for dev + prod (separate logical databases via key prefixes)
- Fail-open strategy (continue without cache on Redis errors)

### Open Questions

- [ ] Should we add cache warming on app startup? (NO - lazy loading is fine)
- [ ] Should we implement cache-aside vs write-through? (CACHE-ASIDE for now)
- [ ] Should we add Redis clustering for HA? (NOT YET - single instance sufficient)

### Blockers

- None currently

---

**Last Updated**: January 16, 2026  
**Progress**: 11/80 steps completed (Phase 1 complete, awaiting review)
