---
description: "Use when writing backend API controllers, services, or error handling. Covers consistent error response format and message conventions."
applyTo:
  ["apps/backend/src/**/*Controller*", "apps/backend/src/**/*Service*", "apps/backend/src/**/*.js"]
---

# Backend Error Message Convention

## Format

All error messages must follow: `"Failed to {action} {resource}"`

## ✅ Examples

- `"Failed to load pinyin pool"` ✓
- `"Failed to create quiz attempt"` ✓
- `"Failed to fetch review items"` ✓
- `"Failed to update phase gate"` ✓

## ❌ Inconsistent Patterns to Avoid

- `"Error loading data"` — not specific enough
- `"Failed to fetch"` — no resource named
- `"Cannot create"` — not "Failed to" format
- `"Something went wrong"` — not actionable

## Response Shape

```javascript
// ✅ DO — Consistent error JSON
res.status(400).json({
  error: "Failed to load review items",
  code: "LOAD_ERROR",
});

// ❌ DON'T — Inconsistent shape
res.status(400).json({
  message: "Failed to fetch",
  status: "error",
});
```

## Error Code Convention

Use SCREAMING_SNAKE_CASE error codes matching the action:

| Code               | When                           |
| ------------------ | ------------------------------ |
| `LOAD_ERROR`       | Data loading failures          |
| `VALIDATION_ERROR` | Input validation failures      |
| `NOT_FOUND`        | Resource not found             |
| `AUTH_ERROR`       | Authentication / authorization |
| `INTERNAL_ERROR`   | Unexpected server errors       |

## Reasoning

Consistent error messages make debugging faster and enable frontend error handling to be generic rather than case-by-case. The "Failed to {action} {resource}" pattern is specific enough to diagnose issues while being generic enough to apply uniformly.
