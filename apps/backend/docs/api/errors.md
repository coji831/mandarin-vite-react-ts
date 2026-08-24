---
purpose: Error response format — the unified error structure
status: active
last-verified: 2026-08-18
type: guide
---

# Error Response Format

All errors follow this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "requestId": "uuid-v4"
}
```

## Common Error Codes

| Code                  | Status | Description                        |
| --------------------- | ------ | ---------------------------------- |
| `VALIDATION_ERROR`    | 400    | Invalid or missing required fields |
| `NOT_FOUND`           | 404    | Resource not found                 |
| `UNAUTHORIZED`        | 401    | Missing or invalid authentication  |
| `RATE_LIMIT_EXCEEDED` | 429    | Too many requests                  |
| `TTS_ERROR`           | 500    | TTS generation failure             |
| `INTERNAL_ERROR`      | 500    | Unexpected server error            |

## Response Headers

- `X-Request-Id`: Unique request identifier for tracing
- `Access-Control-Allow-Origin`: CORS header (`*` in development)
