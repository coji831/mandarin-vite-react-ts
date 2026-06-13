# Health Check

## GET /api/health

General health check endpoint with Redis cache status and metrics.

**Response:**

```json
{
  "status": "ok",
  "mode": "real",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "services": { "gemini": true, "tts": true },
  "cache": {
    "redis": { "connected": true },
    "metrics": {
      "services": {
        "TTS": { "hits": 150, "misses": 50, "total": 200, "hitRate": "75.00" },
        "Conversation": { "hits": 80, "misses": 20, "total": 100, "hitRate": "80.00" }
      },
      "overall": { "hits": 230, "misses": 70, "total": 300, "hitRate": "76.67" }
    }
  }
}
```

**Cache Metrics Fields:**

- `hits`: Number of cache hits (requests served from Redis)
- `misses`: Number of cache misses (requests requiring external API calls)
- `total`: Total requests processed
- `hitRate`: Percentage of requests served from cache (as string)
