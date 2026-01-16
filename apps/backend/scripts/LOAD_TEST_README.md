# Load Test README

## Prerequisites

```bash
npm install -g artillery
```

## Running Load Tests

### 1. Start the backend server

```bash
npm run dev:backend
```

### 2. Run the load test

```bash
artillery run apps/backend/scripts/loadTest.yml
```

### 3. Analyze Results

Expected metrics after 60-second test:

- **Total requests**: ~600 (10 req/s × 60s)
- **TTS cache hit rate**: >50% (from `/api/health` endpoint)
- **Conversation cache hit rate**: >50% (from `/api/health` endpoint)
- **p95 latency for cached requests**: <200ms
- **p95 latency for uncached requests**: 1-3s (depends on external API)

### 4. Check Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Look for `cache.metrics` section:

```json
{
  "cache": {
    "redis": { "connected": true },
    "metrics": {
      "services": {
        "TTS": { "hits": 300, "misses": 150, "total": 450, "hitRate": "66.67" },
        "Conversation": { "hits": 120, "misses": 30, "total": 150, "hitRate": "80.00" }
      },
      "overall": {
        "hits": 420,
        "misses": 180,
        "total": 600,
        "hitRate": "70.00"
      }
    }
  }
}
```

### 5. Monitor Railway Redis

- Open Railway dashboard
- Navigate to Redis instance
- Check memory usage (should stay <100MB for this test)
- Monitor commands per second (should peak at ~10-15 during test)

## Load Test Scenarios

### Scenario 1: TTS Cache Hit Rate Test (50% weight)

- Sends identical TTS request repeatedly
- Text: "你好世界"
- Voice: "cmn-CN-Wavenet-A"
- Goal: Maximize cache hits after first miss

### Scenario 2: TTS Cache Miss Test (20% weight)

- Sends different TTS requests each time
- Text: Random strings
- Goal: Test cache miss performance

### Scenario 3: Conversation Cache Hit Rate Test (30% weight)

- Sends identical conversation request repeatedly
- WordId: "load-test-word-123"
- Word: "你好"
- Goal: Maximize cache hits after first miss

## Troubleshooting

### High Latency

- Check if external APIs (Google TTS, Gemini) are slow
- Verify Redis connection is healthy
- Check Railway Redis latency in dashboard

### Low Cache Hit Rate

- Ensure cache is enabled (`CACHE_ENABLED=true` in `.env.local`)
- Check Redis connection in logs
- Verify cache keys are being generated consistently

### Memory Issues

- Monitor Railway Redis memory usage
- Consider shorter TTLs if memory grows too large
- Review cache key patterns for uniqueness
