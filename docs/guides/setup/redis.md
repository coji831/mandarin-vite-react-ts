# Redis Setup Guide

**Last Updated:** June 3, 2026
**Purpose:** Configure Redis for caching, session management, and rate limiting
**Audience:** Developers setting up Redis for local development or production

> **When to read this:** When setting up Redis for local development, configuring cache behavior, troubleshooting Redis connection issues, or tuning cache performance for production.

## Overview

Redis is used for caching, session management, and rate limiting in the Mandarin learning app. The backend uses `ioredis` for Redis connectivity with `lazyConnect` to avoid blocking app startup when Redis is unavailable.

**Architecture:**

```
Application → RedisClient (singleton) → Redis (local or Railway)
             ↓
         RedisCacheService (fail-open)
             ↓
         CacheService (abstract interface)
```

**Key Design Principles:**

- **Fail-open**: If Redis is unavailable, cache operations fail silently and the app continues without caching
- **Singleton**: Single `RedisClient` instance manages connection lifecycle
- **Key Prefix**: All keys are prefixed with `mandarin:` to isolate from other projects sharing the same Redis instance
- **Lazy Connect**: Connection is deferred until first use, avoiding startup delays

> **Application-specific caching patterns:** See [Caching Patterns & Strategies](../operations/caching-patterns.md) for key formats, TTLs, invalidation, and monitoring.

---

## Configuration Options

### Option 1: Local Redis (Homebrew — macOS)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify
redis-cli ping
# Expected: PONG
```

Redis runs on `localhost:6379` by default. Set `REDIS_URL` in `.env.local`:

```env
REDIS_URL=redis://default:password@localhost:6379
```

### Option 2: Docker Redis

```bash
# Pull and run Redis in Docker
docker run -d -p 6379:6379 --name mandarin-redis redis:alpine

# Verify
docker exec mandarin-redis redis-cli ping
# Expected: PONG

# Stop and remove when done
docker stop mandarin-redis && docker rm mandarin-redis
```

### Option 3: Railway Redis (Production)

1. Navigate to your Railway project dashboard
2. Add the **Redis** plugin from the plugin marketplace
3. Railway automatically injects the `REDIS_URL` environment variable:
   - Internal: `redis://default:password@redis.railway.internal:6379`
   - Public: `redis://default:password@<host>.rlwy.net:6379`

No manual configuration is needed — the backend detects Railway's internal hostname and handles it automatically.

**Important:** If using Railway's internal hostname (`redis.railway.internal`) in local development, the backend automatically skips the connection. Use `localhost` for local development instead.

### Option 4: Disable Redis

Set `CACHE_ENABLED=false` in `.env.local`:

```env
CACHE_ENABLED=false
# REDIS_URL is not required when caching is disabled
```

The backend will skip Redis initialization entirely and all cache operations return `null` (cache miss) without errors.

---

## Environment Variables

| Variable                 | Required | Default                  | Description                            |
| ------------------------ | -------- | ------------------------ | -------------------------------------- |
| `REDIS_URL`              | No       | `redis://localhost:6379` | Redis connection string                |
| `CACHE_ENABLED`          | No       | `true`                   | Enable/disable caching                 |
| `CACHE_TTL_TTS`          | No       | `86400`                  | TTS cache TTL in seconds (24h)         |
| `CACHE_TTL_CONVERSATION` | No       | `3600`                   | Conversation cache TTL in seconds (1h) |

**URL Formats:**

```env
# Local development
REDIS_URL=redis://default:password@localhost:6379

# Railway (auto-injected)
REDIS_URL=redis://default:password@redis.railway.internal:6379

# Upstash (alternative provider)
REDIS_URL=redis://default:password@host.upstash.io:6379

# With TLS (production)
REDIS_URL=rediss://default:password@host:6379
```

> **Full environment variable reference:** See [Environment Setup Guide](../getting-started/environment-setup.md)

---

## Backend Configuration

The Redis connection is configured in `apps/backend/src/config/redis.js`.

### URL Parsing

The config automatically detects the URL type:

| URL Pattern                     | Type Detected    |
| ------------------------------- | ---------------- |
| `redis.railway.internal`        | Railway internal |
| `*.rlwy.net` or `*.railway.app` | Railway public   |
| `localhost` or `127.0.0.1`      | Localhost        |
| Other                           | External         |

**Key behavior:** In local development (`NODE_ENV !== "production"`), if the URL contains `redis.railway.internal`, the connection is **skipped** with a warning. This prevents accidental connections to production Redis from local development.

### Connection Settings

```javascript
// From apps/backend/src/config/redis.js
export const redisConfig = {
  // Connection details parsed from REDIS_URL
  host,
  port,
  password,
  username,

  // Connection options
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect until explicitly called
  connectTimeout: 10000, // 10 seconds
  keepAlive: 30000, // 30 seconds
  keyPrefix: "mandarin:",

  // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
  retryStrategy(times) {
    return Math.min(times * 1000, 10000);
  },
};
```

### Cache Configuration

```javascript
export const cacheConfig = {
  enabled: process.env.CACHE_ENABLED === "true",
  ttl: {
    tts: parseInt(process.env.CACHE_TTL_TTS || "86400", 10), // 24 hours
    conversation: parseInt(process.env.CACHE_TTL_CONVERSATION || "3600", 10), // 1 hour
  },
};
```

---

## Redis Client

The `RedisClient` (`apps/backend/src/infrastructure/cache/RedisClient.js`) is a singleton wrapper around `ioredis` that manages connection lifecycle.

### Connection Events

The client logs all connection state changes:

- `connect` → Redis connection established
- `ready` → Client ready to accept commands
- `error` → Non-fatal error (app continues without cache)
- `close` → Connection closed
- `reconnecting` → Auto-reconnect with delay
- `end` → Connection fully ended

### Health Check

```javascript
const redisClient = RedisClient.getInstance();
const isAlive = await redisClient.ping(1000); // timeout: 1s
// Returns true/false
```

### Graceful Shutdown

```javascript
await redisClient.quit(); // Call on server shutdown
```

---

## Cache Service

The `RedisCacheService` (`apps/backend/src/infrastructure/cache/RedisCacheService.js`) extends `CacheService` and provides fail-open cache operations.

### Available Operations

| Method                 | Description                         | Fail-Open Behavior    |
| ---------------------- | ----------------------------------- | --------------------- |
| `get(key)`             | Retrieve cached value               | Returns `null`        |
| `set(key, value, ttl)` | Store value with TTL                | Logs error, continues |
| `delete(key)`          | Remove single key                   | Logs error, continues |
| `clear(pattern)`       | Remove keys by pattern (SCAN-based) | Returns `0`           |
| `getMulti(keys)`       | Retrieve multiple keys (MGET)       | Returns empty `Map`   |

**All operations use `mandarin:` key prefix automatically.**

### SCAN-Based Pattern Deletion

The `clear()` method uses `SCAN` (not `KEYS`) for production safety:

```javascript
// Clears all TTS cache keys
const deleted = await redisCacheService.clear("tts:*");
console.log(`Deleted ${deleted} keys`);
```

Uses pipelining (100 keys per batch) for efficient large-scale deletion.

---

## Troubleshooting

### Redis connection fails in production

**Cause:** Railway Redis URL format mismatch — some plugins use `redis://` vs `rediss://` for TLS.

**Solution:** Check Railway environment variables; update `REDIS_URL` to include correct protocol and TLS settings.

### Backend starts but cache is not working

**Cause:** Redis URL points to Railway internal hostname in local development.

**Solution:** Use `localhost` URL for local development:

```env
REDIS_URL=redis://default:password@localhost:6379
```

### Redis connection timeout

**Cause:** Network issues or Redis server not running.

**Solution:**

1. Verify Redis is running: `redis-cli ping` or `docker ps`
2. Check `REDIS_URL` format
3. Increase `connectTimeout` in `redis.js` if network is slow

### Cache hit rate is 0%

**Cause:** Cache keys not consistent, TTL too short, or Redis not connected.

**Solutions:**

1. Check health endpoint: `curl http://localhost:3001/api/v1/health | jq '.cache'`
2. Verify `CACHE_ENABLED=true`
3. Check logs for "Redis Client Error"

> **Comprehensive troubleshooting:** See [Troubleshooting Guide](../operations/troubleshooting.md)

---

## Related Documentation

### Project Guides

- [Caching Patterns & Strategies](../operations/caching-patterns.md) — Key formats, TTLs, invalidation, monitoring
- [Environment Setup Guide](../getting-started/environment-setup.md) — Environment variable reference
- [Deployment Guide](../operations/deployment.md) — Production deployment with Railway Redis
- [Backend Development Guide](./backend-development.md) — Backend architecture

- [Infrastructure Configuration Management](../../knowledge-base/infrastructure/infra-configuration-management.md) — Environment strategies, validation
- [Integration Caching](../../knowledge-base/infrastructure/integration-caching.md) — Transferable caching concepts

### Source Files

- `apps/backend/src/config/redis.js` — Redis connection configuration
- `apps/backend/src/infrastructure/cache/RedisClient.js` — Redis client singleton
- `apps/backend/src/infrastructure/cache/RedisCacheService.js` — Cache service implementation
- `apps/backend/src/infrastructure/cache/CacheService.js` — Abstract cache interface

---

## Verification

Confirm Redis is configured and accessible:

```bash
cd apps/backend

# Check Redis connection via the health endpoint
curl http://localhost:3001/api/v1/health 2>/dev/null | jq '.cache'
# Expected: { "enabled": true, "status": "connected" }

# Or test directly with Redis CLI
redis-cli -u "$REDIS_URL" ping
# Expected: PONG
```

**Expected result:** The backend health endpoint shows `"enabled": true`, or `redis-cli ping` returns `PONG`.

---

**Last Updated:** June 3, 2026
