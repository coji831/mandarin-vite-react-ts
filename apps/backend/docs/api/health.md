---
purpose: Health check endpoint — /api/v1/health with Redis status
status: active
last-verified: 2026-08-18
type: guide
---

# Health Check

## GET /api/v1/health

General health check endpoint with Redis cache status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "uptime": 1234.56,
  "services": { "gemini": true, "tts": true },
  "cache": {
    "redis": { "connected": true }
  }
}
```
