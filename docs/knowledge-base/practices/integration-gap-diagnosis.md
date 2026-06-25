# Integration Gap Diagnosis Checklist

**Category:** Practices  
**Last Updated:** June 26, 2026

---

## Why

When a feature is built across frontend and backend, each piece may be fully implemented and tested in isolation — yet the feature fails end-to-end. The most common cause is not a logic bug but an **integration gap**: a missing import, a mismatched path, or an unwired component. These gaps are invisible to unit tests (which test each piece independently) and often slip through code review because each side looks correct in isolation.

This article provides a reusable 3-gap checklist to diagnose and prevent integration failures. Every developer or agent integrating a new feature across frontend and backend should run through this checklist before marking the feature as done.

---

## Use Case

- Adding a new backend API endpoint and a frontend UI component that consumes it
- Moving or renaming an existing route or component
- Debugging a feature that is "implemented but doesn't work" (404 responses, empty UI, missing data)
- Code review checklist for cross-stack PRs

---

## Key Concepts

### The 3-Gap Diagnosis Pattern

Every frontend-backend integration must satisfy three conditions. If any one is missing, the feature is invisible to the user.

```
┌─────────────────────────────────────────────────────┐
│                 3-Gap Diagnosis                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Gap 1: Backend Route Mounted                         │
│  └── Is the route file imported + registered in       │
│      the router index?                                │
│                                                       │
│  Gap 2: API Paths Match                               │
│  └── Does frontend call the same path the backend     │
│      defines? Are they using shared constants?        │
│                                                       │
│  Gap 3: Component Wired                               │
│  └── Is the frontend component imported and rendered   │
│      in the parent view?                               │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Gap 1: Backend Route Mounted

An Express route file may define a perfect endpoint, but if it is never imported into the router index, the endpoint returns 404 for every request.

### Checklist

- [ ] Does a route file exist for this feature? (e.g., `examplesRoute.js`)
- [ ] Is the route file **imported** at the top of `routes/index.js`?
- [ ] Is the route file **registered** with `router.use(routeName)` in the correct position?
- [ ] Does the registration follow the same pattern as existing routes? (import → register — not custom mounting)

### DO: Import and register the route

```javascript
// routes/index.js — GOOD
import { authRouter } from "./authRouter.js";
import { examplesRouter } from "./examplesRouter.js";
//                                    ↑ imported
export const router = Router();
router.use(authRouter);
router.use(examplesRouter);
//       ↑ registered
```

### DON'T: Create a route file without registering it

```javascript
// routes/index.js — BAD
import { authRouter } from "./authRouter.js";
// examplesRouter.js exists but is NOT imported here
// The endpoint is defined but returns 404 forever
```

---

## Gap 2: API Paths Match

The frontend must call the exact same path the backend defines. Hardcoded strings on either side drift apart over time. Shared route constants prevent this.

### Checklist

- [ ] Does the backend route use a hardcoded path string or a shared constant?
- [ ] Does the frontend API service use a hardcoded path string or a shared constant?
- [ ] If both use shared constants: are the constants defined in a single shared package?
- [ ] If either side uses a hardcoded path: do they match exactly? (Watch for `/v1/` prefix mismatches, missing/extra segments)
- [ ] Does the frontend use the project-standard API client (`apiClient`) instead of raw `axios`/`fetch`?

### DO: Use shared route constants

```typescript
// shared-constants/src/index.ts — GOOD
export const ROUTE_PATTERNS = {
  examples: "/v1/examples",
  examplesSingleLine: "/single-line",
} as const;
```

```typescript
// Frontend API service — GOOD
import { ROUTE_PATTERNS } from "@shared/constants";
import { apiClient } from "@/services";

export async function fetchExamples(word: string, hskLevel: number, language: string) {
  const response = await apiClient.post(
    ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine,
    { word, hskLevel, language },
  );
  return response.data?.data ?? [];
}
```

```javascript
// Backend route — GOOD
import { ROUTE_PATTERNS } from "@shared/constants";

router.post(
  ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine,
  asyncHandler(async (req, res) => {
    /* ... */
  }),
);
```

### DON'T: Hardcode paths on either side

```typescript
// Frontend — BAD
const response = await axios.post("/api/examples", {
  /* ... */
});
//              ↑ hardcoded path, raw axios — will break if backend changes
```

```javascript
// Backend — BAD
router.post(
  "/v1/examples/single-line",
  asyncHandler(async (req, res) => {
    /* ... */
  }),
);
//        ↑ hardcoded — frontend and backend can drift independently
```

---

## Gap 3: Component Wired

A frontend component may be fully built, styled, and tested — but if it is never imported and rendered in the parent view, the user never sees it.

### Checklist

- [ ] Is the component **imported** at the top of the parent file?
- [ ] Is the component **rendered** in the JSX (not just imported but unused)?
- [ ] Are the required props passed correctly? (Check prop names and types)
- [ ] Is the component placed in the correct location within the parent layout?
- [ ] Is the component conditionally hidden? (Check `&&`, ternary, or `display:none`)

### DO: Import and render the component

```tsx
// WordDetails.tsx — GOOD
import { WordExamplesPanel } from "./WordExamplesPanel";

function WordDetails({ word, hskLevel }: WordDetailsProps) {
  return (
    <div>
      <p>
        <strong>Pinyin:</strong> {word.pinyin}
      </p>
      <p>
        <strong>Meaning:</strong> {word.english}
      </p>
      <WordExamplesPanel word={word.chinese} hskLevel={hskLevel} language="en" />
      {/*         ↑ rendered with correct props */}
    </div>
  );
}
```

### DON'T: Build a component without wiring it

```tsx
// WordDetails.tsx — BAD
// WordExamplesPanel is fully built but never imported or rendered here
// The UI is complete but shows nothing to the user
function WordDetails({ word, hskLevel }: WordDetailsProps) {
  return (
    <div>
      <p>
        <strong>Pinyin:</strong> {word.pinyin}
      </p>
      <p>
        <strong>Meaning:</strong> {word.english}
      </p>
      {/* WordExamplesPanel should go here, but it's missing */}
    </div>
  );
}
```

---

## Full Diagnosis Checklist

Use this checklist when integrating any new feature across frontend and backend:

### Backend

- [ ] Route file exists and defines the endpoint
- [ ] Route file is imported in `routes/index.js`
- [ ] Route is registered with `router.use()`
- [ ] Route uses shared constants from `ROUTE_PATTERNS` (or matches frontend exactly)
- [ ] Backend service returns data in the format the frontend expects

### Shared Constants

- [ ] Route patterns are defined in `packages/shared-constants`
- [ ] Both frontend and backend import from the same source
- [ ] No hardcoded paths remain on either side

### Frontend API Layer

- [ ] API service exists (not calling `axios`/`fetch` directly)
- [ ] API service uses `apiClient` + `ROUTE_PATTERNS`
- [ ] API response is parsed correctly (check for wrapper vs direct response pattern)

### Frontend Component

- [ ] Component is imported in the parent
- [ ] Component is rendered with correct props
- [ ] Component is not hidden by a conditional that is always false
- [ ] Component handles loading, empty, and error states

---

## Common Failure Patterns

| Symptom                                     | Likely Gap                      | How to Verify                                    |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| API returns 404                             | Gap 1 (route not mounted)       | Check `routes/index.js` for the import           |
| API returns 200 but empty data              | Gap 2 (wrong path)              | Compare frontend URL vs backend route definition |
| API works in Postman but not in app         | Gap 2 (path mismatch)           | Check frontend API service for hardcoded paths   |
| Component builds but nothing shows          | Gap 3 (not wired)               | Check parent file for import + JSX usage         |
| Feature works locally but not in production | Gap 1 or 2 (missing env config) | Check deployment for route registration          |

---

## Cross-References

- [API Response Patterns: Wrapper vs. Direct](../backend/api-response-patterns.md) — Understanding response format contracts between frontend and backend
- [Frontend UI Patterns](../frontend/frontend-ui-patterns.md) — Component composition patterns in the frontend
