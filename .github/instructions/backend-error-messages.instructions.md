---
description: "Use when writing backend API controllers, services, or error handling. Covers consistent error response format and message conventions."
applyTo: "apps/backend/src/**/*Controller*, apps/backend/src/**/*Service*, apps/backend/src/**/*.ts"
---

# Backend Error Message Convention

## How To Apply (Numbered Steps)

1. **Identify the action** — What operation failed? (load, create, update, delete, fetch)
2. **Identify the resource** — What was being operated on? (quiz attempt, review item, phase gate, pinyin pool)
3. **Construct the message** — Format: `"Failed to {action} {resource}"` (e.g., `"Failed to create quiz attempt"`)
4. **Pick the error code** — Match the action to the code table below
5. **Return the JSON shape** — Always `{ error: string, code: string }` — never add extra fields

```typescript
// Step-by-step: Controller error handler
res.status(400).json({
  error: "Failed to create quiz attempt", // Steps 1-3
  code: "VALIDATION_ERROR", // Step 4
});
```

6. **Verify** — Run `grep -r '"error":' apps/backend/src/` to confirm all controllers follow the pattern

## Format

All error messages must follow: `"Failed to {action} {resource}"`

### ✅ Examples

- `"Failed to load pinyin pool"` ✓
- `"Failed to create quiz attempt"` ✓
- `"Failed to fetch review items"` ✓
- `"Failed to update phase gate"` ✓

### ❌ Inconsistent Patterns to Avoid

- `"Error loading data"` — not specific enough
- `"Failed to fetch"` — no resource named
- `"Cannot create"` — not "Failed to" format
- `"Something went wrong"` — not actionable

## Response Shape

```typescript
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

Consistent error messages make debugging faster and enable frontend error handling to be generic rather than case-by-case.

---

**See also:** `testing-standards.instructions.md` (test your error handlers) • `backend-audit skill` (audit error format)
