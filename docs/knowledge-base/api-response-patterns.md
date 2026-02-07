# API Response Patterns: Wrapper vs. Direct

**Last Updated:** February 7, 2026  
**Audience:** Engineers designing REST APIs, integrating HTTP clients  
**Difficulty:** Intermediate

---

## Overview

REST APIs can return data in two primary patterns: **wrapped** (envelope pattern) or **direct** (raw data). Understanding the tradeoffs, client-side implications, and migration pitfalls is critical for maintainable integrations.

**One-Sentence Summary:** Choose direct responses for simplicity, wrapped responses for uniform error contracts—but never mix both without explicit documentation.

---

## Patterns Explained

### Direct Response Pattern

Backend returns the actual data structure without wrapping metadata.

```javascript
// Backend (Express)
res.json([
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
]);

// HTTP Response
// Status: 200
// Body: [{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]
```

**Client consumption:**

```typescript
const response = await axios.get("/api/items");
const items = response.data; // Array directly
```

**Use when:**

- Simple CRUD operations (list, get, create, update, delete)
- RESTful conventions with HTTP status codes conveying success/failure
- Performance matters (smaller payloads, less parsing overhead)
- GraphQL-style single endpoint not needed

### Wrapped Response Pattern (Envelope)

Backend wraps data in metadata container (`{ success, data, error, message }`).

```javascript
// Backend (Express)
res.json({
  success: true,
  data: [{ id: 1, name: "Item 1" }],
  message: "Items retrieved successfully",
  timestamp: new Date().toISOString(),
});

// HTTP Response
// Status: 200
// Body: {"success":true,"data":[...],"message":"...","timestamp":"..."}
```

**Client consumption:**

```typescript
const response = await axios.get("/api/items");
const items = response.data.data; // Unwrap envelope
```

**Use when:**

- Uniform error contract required (GraphQL-style)
- HTTP status alone insufficient (business-level errors vs. transport errors)
- Metadata needed (pagination, rate limits, request IDs)
- Legacy mobile clients need fixed structure

---

## HTTP Client Layering

Understanding how HTTP clients wrap responses helps avoid "double unwrap" bugs.

### Native Fetch

```typescript
// Backend: res.json([...])
const response = await fetch("/api/items");
const items = await response.json(); // Array directly
```

**Behavior:**

- `response.json()` returns parsed body exactly as backend sent
- No automatic wrapping—developer controls parsing
- HTTP metadata in separate properties: `response.status`, `response.headers`

### Axios

```typescript
// Backend: res.json([...])
const response = await axios.get("/api/items");
const items = response.data; // Array directly
```

**Behavior:**

- Axios wraps HTTP response in object: `{ data, status, headers, config }`
- `response.data` contains parsed body (JSON automatically parsed)
- **Critical:** Adds ONE layer of wrapping regardless of backend structure

### Common Pitfall: Double Unwrap Bug

**Scenario:** Backend returns data directly, but client assumes wrapper pattern.

```typescript
// Backend (Express)
res.json([{ id: 1 }]); // Direct array

// Client (Axios) - INCORRECT
interface ItemsResponse {
  success: boolean;
  data: Item[];
}
const response = await axios.get<ItemsResponse>("/api/items");
const items = response.data.data; // ❌ Attempting [...].data → undefined

// Client (Axios) - CORRECT
const response = await axios.get<Item[]>("/api/items");
const items = response.data; // ✅ Gets array directly
```

**Why this happens:**

1. Developer assumes backend follows wrapped pattern (common in tutorials)
2. Backend actually returns data directly (simpler, RESTful)
3. Axios wraps once: `{ data: [...] }`
4. Client accesses `response.data.data`: `[...].data` → `undefined`
5. Runtime error: "Cannot read property 'forEach' of undefined"

---

## When to Use Each Pattern

### ✅ Use Direct Responses

**Good for:**

- RESTful CRUD APIs with standard HTTP semantics
- High-performance endpoints (smaller payload, faster parsing)
- Microservices with consistent error middleware
- APIs consumed by typed clients (TypeScript, Swift, Kotlin)

**Example:**

```javascript
// List users
GET /api/users
200 OK
[{ "id": 1, "email": "user@example.com" }]

// Get single user
GET /api/users/1
200 OK
{ "id": 1, "email": "user@example.com" }

// Errors (HTTP status conveys failure)
GET /api/users/999
404 Not Found
{ "message": "User not found" } // ← Minimal error object, no success: false
```

**Benefits:**

- Smaller payloads (no wrapping overhead)
- Idiomatic REST (status codes = success/failure)
- Less client boilerplate (no `response.data.data`)
- Typed clients handle errors via status checks

### ✅ Use Wrapped Responses

**Good for:**

- GraphQL-style single endpoints (everything returns 200, errors in body)
- Paginated APIs needing metadata (page, total, hasMore)
- Legacy clients expecting fixed structure
- Business-level errors alongside HTTP errors

**Example:**

```javascript
// Success with pagination metadata
GET /api/users?page=2
200 OK
{
  "success": true,
  "data": [{ "id": 3, "email": "user3@example.com" }],
  "pagination": { "page": 2, "totalPages": 5, "totalItems": 50 }
}

// Business-level error (still 200 OK)
POST /api/transfer
200 OK
{
  "success": false,
  "error": { "code": "INSUFFICIENT_FUNDS", "message": "Balance too low" },
  "data": null
}

// Transport error (HTTP status used)
POST /api/transfer
500 Internal Server Error
{
  "success": false,
  "error": { "code": "SERVER_ERROR", "message": "Database unavailable" }
}
```

**Benefits:**

- Uniform structure (every response has `success`, `data`, `error`)
- Supports business errors with 200 status (like GraphQL)
- Extra metadata lives in root (pagination, rate limits)
- Mobile clients can parse without inspecting HTTP status

---

## Migration Strategy

### Migrating from Fetch to Axios

**Before (Fetch):**

```typescript
const response = await fetch("/api/items");
if (!response.ok) throw new Error("Failed");
const items = await response.json(); // Type: Item[]
```

**After (Axios):**

```typescript
const response = await axios.get<Item[]>("/api/items");
const items = response.data; // Type: Item[]
```

**Key change:** Remove manual `.json()` parsing; Axios does it automatically.

### Changing Backend Pattern (Breaking Change)

**Scenario:** Backend currently returns direct data, needs to add pagination metadata.

**Option 1: Add wrapper (BREAKING CHANGE)**

```javascript
// Before
res.json([{ id: 1 }]);

// After
res.json({
  success: true,
  data: [{ id: 1 }],
  pagination: { page: 1, total: 100 },
});
```

**Impact:** All clients must update to `response.data.data`. Requires major version bump (v1 → v2).

**Option 2: Add metadata in headers (NON-BREAKING)**

```javascript
// Keep body unchanged
res.set("X-Total-Count", "100");
res.set("X-Page", "1");
res.json([{ id: 1 }]);
```

**Impact:** Existing clients work unchanged. New clients can read headers for metadata. Preferred for backward compatibility.

**Option 3: Support both via content negotiation**

```javascript
const format = req.query.format || 'direct';

if (format === 'wrapped') {
  res.json({ success: true, data: items, pagination: {...} });
} else {
  res.set('X-Total-Count', items.length);
  res.json(items); // Direct
}
```

**Impact:** Gradual migration. New clients use `?format=wrapped`, old clients unaffected. Deprecate direct format in v3.

---

## Testing Alignment

**Critical Rule:** Test mocks must **exactly** match backend behavior.

### Wrong Mock (Common Mistake)

```typescript
// Test assumes wrapped pattern
mock.onGet("/api/items").reply(200, {
  success: true,
  data: [{ id: 1 }],
});

// Backend actually returns
res.json([{ id: 1 }]); // Direct array
```

**Result:** Test passes ✅, production fails ❌ (runtime TypeError).

### Correct Mock

```typescript
// Mock matches backend exactly
mock.onGet("/api/items").reply(200, [{ id: 1 }]);

// Backend returns
res.json([{ id: 1 }]); // Direct array
```

**Result:** Test and production behavior identical.

### Validation Checklist

- [ ] Inspect actual backend controller code (what does `res.json(...)` receive?)
- [ ] Use network inspector to capture real API response (not documentation)
- [ ] Mock returns **exact** structure (no assumptions about wrappers)
- [ ] Test with both success and error cases
- [ ] Verify TypeScript types match actual response (not idealized type)

---

## Error Handling Patterns

### Direct Pattern Errors

```javascript
// Backend
if (!user) {
  return res.status(404).json({ message: "User not found", code: "USER_NOT_FOUND" });
}

// Client (Axios)
try {
  const response = await axios.get("/api/users/123");
  const user = response.data; // User object
} catch (error) {
  if (error.response?.status === 404) {
    console.log(error.response.data.message); // "User not found"
  }
}
```

**Strategy:** HTTP status codes convey error type. Body contains error details. Client uses status-based branching.

### Wrapped Pattern Errors

```javascript
// Backend (always 200 OK)
if (!user) {
  return res.status(200).json({
    success: false,
    error: { code: "USER_NOT_FOUND", message: "User not found" },
    data: null,
  });
}

// Client (Axios)
const response = await axios.get("/api/users/123");
if (!response.data.success) {
  console.log(response.data.error.message); // "User not found"
}
```

**Strategy:** HTTP status always 200 (or 500 for transport errors). `success` flag indicates business success. Client checks `success` first, then inspects `error` or `data`.

### Hybrid Pattern (Recommended)

```javascript
// Backend
if (!user) {
  return res.status(404).json({ message: "User not found" });
}

// Success case
res.status(200).json(userData); // Direct data

// Client (Axios with interceptor)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      return null; // Treat 404 as valid "not found" state
    }
    throw new Error(error.response?.data?.message || "Request failed");
  },
);
```

**Strategy:** Use HTTP status for transport/auth errors (401, 403, 500). Use 404 for valid "not found" states. Return direct data on success. Interceptor normalizes errors.

---

## Tradeoffs Summary

| Aspect             | Direct                       | Wrapped                            |
| ------------------ | ---------------------------- | ---------------------------------- |
| **Payload size**   | Smaller (no metadata)        | Larger (wrapper overhead)          |
| **HTTP semantics** | Idiomatic (status = success) | Non-standard (always 200)          |
| **Client code**    | Cleaner (`response.data`)    | Verbose (`response.data.data`)     |
| **Error handling** | Status-based (401, 404)      | Body-based (`success: false`)      |
| **Metadata**       | Headers or pagination links  | Built-in (`pagination`, `meta`)    |
| **Versioning**     | Use `/v1/`, `/v2/` paths     | Can version structure in body      |
| **Type safety**    | Simple (data matches type)   | Complex (generic `ApiResponse<T>`) |
| **Migration cost** | Low (change types only)      | High (change all access patterns)  |
| **GraphQL-like**   | No (RESTful)                 | Yes (uniform structure)            |

---

## Recommendations

### For New APIs

**Use direct responses by default:**

- Simpler client integration
- Smaller payloads
- Idiomatic REST
- Add wrappers only if metadata genuinely needed (pagination, rate limits)

**Reserve wrappers for:**

- Paginated collections (`{ data: [...], page, total }`)
- Batch operations (`{ results: [], errors: [] }`)
- Legacy client compatibility

### For Existing APIs

**Do NOT change pattern without major version bump:**

- Direct → Wrapped: Breaking change (all clients must update)
- Wrapped → Direct: Breaking change (removes `success`, `error` fields)

**Safe alternatives:**

- Add metadata in headers (`X-Total-Count`, `Link` for pagination)
- Provide parallel endpoint (`/v2/items` with new structure)
- Use content negotiation (`?format=wrapped`)

---

## Real-World Example: Epic 14 Discovery

**Context:** Migrated 3 frontend services from Fetch to Axios. Assumed backend followed wrapped pattern (`{ success, data }`).

**Bug:** Frontend accessed `response.data.data` but backend returned data directly. `response.data.data` evaluated to `undefined`, causing runtime TypeError in production.

**Root Cause:**

1. Backend used direct pattern: `res.json([...])`
2. Axios wrapped once: `{ data: [...] }`
3. Frontend accessed `response.data.data`: `[...].data` → `undefined`
4. Test mocks returned wrapped data (`{ success: true, data: [...] }`) → tests passed
5. Production backend returned direct data → production failed

**Resolution:**

- Changed all services to `response.data` (single unwrap)
- Removed 6 wrapper type imports (`ProgressApiResponse`, etc.)
- Updated 10 test mocks to return direct data
- Added validation: inspect actual backend response, not documentation

**Key Lesson:** Always verify actual backend response structure. Test mocks must match reality, not assumptions.

---

## Related Documentation

**Project-Specific Guides:**

- [Code Conventions - Backend Response Structure](../guides/code-conventions.md#backend-response-structure)
- [Testing Guide - Aligning Mocks](../guides/testing-guide.md#aligning-mocks-with-backend-behavior)

**Knowledge Base:**

- [TypeScript Error Handling](./typescript-error-handling.md) - Best practices for `error: unknown`
- [Backend Architecture](./backend-architecture.md) - Clean Architecture, CORS
- [Frontend State Management](./frontend-state-management.md) - Normalized state, data loading

**External Resources:**

- [REST API Best Practices](https://restfulapi.net/) - Idiomatic HTTP semantics
- [Axios Documentation](https://axios-http.com/docs/intro) - Response schema
- [RFC 7807: Problem Details](https://www.rfc-editor.org/rfc/rfc7807) - Standard error format

---

## When NOT to Use

### Avoid Direct Pattern When:

- GraphQL-style single endpoint (all responses 200, errors in body)
- Mobile clients need fixed structure for parsing stability
- Rich metadata required (pagination, partial success indicators)

### Avoid Wrapped Pattern When:

- Simple CRUD with no metadata needs
- HTTP status codes sufficient for error handling
- Performance critical (every byte matters)
- RESTful conventions preferred

---

## Summary

**Choose direct responses for simplicity and REST semantics. Choose wrapped responses for uniform structure and metadata. Document your choice explicitly. Never mix patterns without versioning. Always validate test mocks against actual backend behavior.**
