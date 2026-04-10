# Integration Solution Design: Example Caching Feature

**Work Package:** Story 16.3 — Example Caching Integration Bug Fix (Stage 2: Design)  
**Created:** 2026-04-10  
**Prepared By:** Design Planning Architect  
**Status:** Pending approval

---

## Inquiry Checklist

**Files Examined:**

- [apps/backend/src/api/routes/examplesRoute.js](apps/backend/src/api/routes/examplesRoute.js) — Endpoint definition with hardcoded `/v1/examples/single-line` prefix
- [apps/backend/src/api/routes/index.js](apps/backend/src/api/routes/index.js) — Route mounting point; examplesRoute not imported/registered
- [apps/frontend/src/services/examplesApi.ts](apps/frontend/src/services/examplesApi.ts) — API client calls `/api/examples` (path mismatch with backend)
- [apps/frontend/src/features/word/components/WordDetails.tsx](apps/frontend/src/features/word/components/WordDetails.tsx) — Detail page renders ConversationBox; WordExamplesPanel not wired
- [apps/frontend/src/features/word/components/WordExamplesPanel.tsx](apps/frontend/src/features/word/components/WordExamplesPanel.tsx) — UI panel built, ready to use
- [packages/shared-constants/src/index.js](packages/shared-constants/src/index.js) — Centralized ROUTE_PATTERNS; examples pattern NOT yet defined
- [apps/frontend/src/features/quiz/services/quizService.ts](apps/frontend/src/features/quiz/services/quizService.ts) — Pattern reference showing correct usage of ROUTE_PATTERNS + apiClient
- [apps/backend/src/core/services/CachedExampleService.js](apps/backend/src/core/services/CachedExampleService.js) — Backend service fully built, tested

**Ambiguities Resolved:**

- **API path standard**: Project enforces `/v1/<domain>` via `ROUTE_PATTERNS` in shared-constants. Decision: Add examples pattern there, not hardcode paths in individual route files.
- **Frontend API client**: Project standard is `apiClient` + `ROUTE_PATTERNS` (quizService.ts example), not raw axios calls. examplesApi.ts currently deviates; will standardize.
- **Component wiring scope**: WordDetails.tsx currently renders ConversationBox conditionally. Will add WordExamplesPanel alongside, always visible (not conditional) based on user request context.

**Plan Approved:** [ ] Pending user/governor acknowledgment

---

## Problem Framing

The Example Caching feature is fully implemented across backend (CachedExampleService with 14 passing tests), frontend UI (WordExamplesPanel, useExamples hook), and API services (examplesApi.ts). However, three structural integration gaps prevent the feature from being accessible end-to-end:

1. **Backend route not mounted**: The `examplesRoute.js` file contains the endpoint logic but is never imported or registered in `routes/index.js`, making the endpoint completely inaccessible (404 responses).
2. **API path mismatch**: The backend defines `POST /v1/examples/single-line` but the frontend API client calls `POST /api/examples`, breaking the frontend-to-backend contract.
3. **Frontend component not wired**: The WordDetails page (where examples should appear) renders only ConversationBox and does not import or render WordExamplesPanel, so users never see the examples even if the API calls succeed.

These gaps prevent the end-to-end flow: API request → backend service → GCS cache → response → UI render. No critical bugs in component logic exist; the feature simply isn't connected.

---

## Solution Strategy

### Gap 1: Backend Route Not Mounted

**Current State:**

- `apps/backend/src/api/routes/examplesRoute.js` contains a router definition that could handle the endpoint.
- `apps/backend/src/api/routes/index.js` does not import or register this router.

**Fix Strategy:**

1. Import `examplesRoute` at the top of `routes/index.js` (following the pattern used for all other routers: authRouter, progressRouter, etc.).
2. Register it with `router.use(examplesRoute)` in the appropriate location within the file.
3. This will activate the endpoint without code changes to `examplesRoute.js`.

**Rationale:** Simple, follows existing pattern in codebase (health, auth, progress, etc. routers are all mounted the same way).

---

### Gap 2: API Path Mismatch

**Current State:**

- Backend route file hardcodes: `router.post("/v1/examples/single-line", ...)`
- Frontend examplesApi.ts hardcodes: `axios.post("/api/examples", ...)`
- Project standard (ROUTE_PATTERNS in shared-constants) is NOT used in either file.

**Fix Strategy:**

**Option A (Recommended):**

1. Add examples routes to `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js`:
   ```javascript
   examples: "/v1/examples",
   examplesSingleLine: "/single-line",
   ```
2. Update `apps/backend/src/api/routes/examplesRoute.js` to use the pattern:
   ```javascript
   import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
   router.post(
     ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine,
     asyncHandler(...)
   );
   ```
3. Update `apps/frontend/src/services/examplesApi.ts` to use `apiClient` + `ROUTE_PATTERNS`:

   ```typescript
   import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
   import { apiClient } from "services";

   export async function fetchExamples(
     word: string,
     hskLevel: number,
     language: string,
   ): Promise<Example[]> {
     const response = await apiClient.post(
       ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine,
       { word, hskLevel, language },
     );
     return response.data?.data ?? [];
   }
   ```

**Why Option A:**

- **Consistency**: Matches project standard (quizService.ts, conversationRoutes.js pattern).
- **Single source of truth**: ROUTE_PATTERNS is shared between frontend and backend; any change is synchronized automatically.
- **Maintainability**: Future changes to the API path only require a single edit in shared-constants.
- **Testability**: Pattern can be mocked or toggled per environment.

**Option B (Not Recommended):**

- Keep backend hardcoded `/v1/examples/single-line`, update frontend to call it.
- **Downside**: Breaks project convention, creates inconsistency, frontend deviates from quizService.ts/axiosClient standard.

**Decision:** **Proceed with Option A.**

---

### Gap 3: Frontend Component Not Wired

**Current State:**

- `WordDetails.tsx` renders basic word info + ConversationBox (conditionally).
- `WordExamplesPanel.tsx` is fully built but never imported or rendered.
- Users navigate to word details but never see examples.

**Fix Strategy:**

1. Import `WordExamplesPanel` at the top of `WordDetails.tsx`.
2. Extract `hskLevel` from word object or props (verify it's available).
3. Add a `<WordExamplesPanel />` component below or alongside `<ConversationBox />`.
4. **Placement**: Always render examples panel (not conditional like conversation). Rationale: Examples are lightweight, don't require user action to display, and complement the vocabulary learning flow.

**Example:**

```typescript
import { WordExamplesPanel } from "./WordExamplesPanel";

function WordDetails({ wordId, chinese, pinyin, english, hskLevel }: Readonly<WordDetailsProps>) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div style={{ marginTop: "20px", textAlign: "left" }}>
      <p><strong>Pinyin:</strong> {pinyin}</p>
      <p><strong>Meaning:</strong> {english}</p>

      {/* Always show examples */}
      <WordExamplesPanel word={chinese} hskLevel={hskLevel} language="en" />

      {/* Existing conversation (conditional) */}
      {wordId && chinese && (
        <div>
          <button onClick={() => setShowExample((show) => !show)}>
            {showExample ? "Hide Example" : "View Example"}
          </button>
          {showExample && (
            <ConversationBox wordId={wordId} word={chinese} onClose={() => setShowExample(false)} />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Work Package Decomposition

### WP-A: Extend Shared Constants with Examples Route Pattern

**Files to Modify:**

- `packages/shared-constants/src/index.js`

**Scope:**

- Add two new properties to `ROUTE_PATTERNS` export:
  - `examples: "/v1/examples"`
  - `examplesSingleLine: "/single-line"`
- No logic changes, pure constant additions.

**Dependencies:**

- None (no other packages depend on this yet)

**Effort:** 5 minutes  
**Complexity:** Low

**Verification:**

- New constants exist in exported object
- No TypeScript errors in shared-constants package build

---

### WP-B: Standardize Backend Examples Route

**Files to Modify:**

- `apps/backend/src/api/routes/examplesRoute.js`

**Scope:**

- Import `ROUTE_PATTERNS` from `@mandarin/shared-constants`
- Replace hardcoded route path `/v1/examples/single-line` with `ROUTE_PATTERNS.examples + ROUTE_PATTERNS.examplesSingleLine`
- No handler logic changes, only path definition

**Dependencies:**

- WP-A (must have new ROUTE_PATTERNS constants available)

**Effort:** 10 minutes  
**Complexity:** Low

**Verification:**

- Import statement added without errors
- Path evaluates to `/v1/examples/single-line` at runtime (same as before)
- Backend build succeeds

---

### WP-C: Mount Backend Examples Route

**Files to Modify:**

- `apps/backend/src/api/routes/index.js`

**Scope:**

- Add import statement: `import examplesRouter from "./examplesRoute.js";`
- Add registration line: `router.use(examplesRouter);`
- Place it logically after vocabularyRouter or at the end, with a comment noting Story 16.3

**Dependencies:**

- WP-B (route must be defined before mounting)

**Effort:** 5 minutes  
**Complexity:** Low

**Verification:**

- Import statement present
- `router.use()` call present
- Backend test or manual request to `POST /v1/examples/single-line` returns 200 (not 404)

---

### WP-D: Standardize Frontend Examples API Client

**Files to Modify:**

- `apps/frontend/src/services/examplesApi.ts`

**Scope:**

- Import `ROUTE_PATTERNS` from `@mandarin/shared-constants`
- Import `apiClient` from `"services"` instead of raw axios
- Replace `axios.post("/api/examples", ...)` with `apiClient.post(ROUTE_PATTERNS.examples + ..., ...)`
- Preserve error handling and return types

**Dependencies:**

- WP-A (new ROUTE_PATTERNS constants)
- WP-B (backend route must match)

**Effort:** 10 minutes  
**Complexity:** Low

**Verification:**

- New imports added without errors
- API call path evaluates to `/v1/examples/single-line` at runtime
- Frontend build succeeds
- Existing tests (if any) still pass

---

### WP-E: Wire Frontend Component Integration

**Files to Modify:**

- `apps/frontend/src/features/mandarin/components/WordDetails.tsx`

**Scope:**

- Import `WordExamplesPanel` from `"./WordExamplesPanel"`
- Extract `hskLevel` from WordDetails props (verify it's available in the WordBasic type or add if missing)
- Add `<WordExamplesPanel word={chinese} hskLevel={hskLevel} language="en" />` to component render
- Place it above or below the existing ConversationBox section
- No state management changes, purely declarative component composition

**Dependencies:**

- WP-D (API must be functional before rendering)
- No backend dependency (can be integrated independently for UI testing)

**Effort:** 10 minutes  
**Complexity:** Low

**Verification:**

- Component imports without errors
- WordDetails builds successfully
- Manual browser test: Navigate to a word detail page; examples panel displays

---

## Integration Points & Risk Analysis

| Risk Category                 | Description                                                                                                         | Severity | Mitigation                                                                                                                                   | Verification                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Data Contract Mismatch**    | Backend response shape may not match frontend `Example` interface (chinese, pinyin, english fields)                 | Medium   | Review CachedExampleService response format; update examplesApi.ts Example type if needed                                                    | API response inspection + TypeScript strict type check       |
| **Path Routing Conflict**     | New `/v1/examples` path may conflict with other mounted routers (unlikely but possible)                             | Low      | Grep codebase for existing `/examples` routes; ensure no overlap in routes/index.js                                                          | Manual code review of routes/index.js                        |
| **Component Rendering Props** | WordDetails may not have `hskLevel` prop available; will cause TypeScript error                                     | Low      | Inspect WordBasic type definition in `features/mandarin/types/` directory; add field if missing                                              | TypeScript compilation check                                 |
| **Loading State Handling**    | If API takes >2s, skeleton/spinner may flicker; affects UX                                                          | Low      | WordExamplesPanel already includes skeleton UI (verified in component review); no action needed                                              | Manual throttle test for slow API                            |
| **CORS/Credentials**          | apiClient may require credentials for authenticated endpoint; examples generation may require auth                  | Medium   | Verify CachedExampleService doesn't require authentication (public or app-level service); if auth required, ensure apiClient forwards tokens | Backend service code review + browser network tab inspection |
| **Cache Hit Attribution**     | useExamples hook tracks cacheHit, but GCS backend cache vs sessionStorage cache distinction may be unclear to users | Low      | UI already shows cache status via analytics; acceptable trade-off                                                                            | No action needed                                             |

---

## Implementation Order & Rationale

**Recommended Sequence (Backend First, Then Frontend):**

1. **WP-A: Extend Shared Constants** (5 min)
   - Why first: No dependencies; unblocks all downstream changes; low risk.
   - Validates that shared-constants package is buildable.

2. **WP-B: Standardize Backend Route Definition** (10 min)
   - Why second: Builds on WP-A; prepares backend for next step.
   - Ensures backend code follows project convention before mounting.

3. **WP-C: Mount Backend Route** (5 min)
   - Why third: Activates the endpoint server-side.
   - Dependencies satisfied by WP-A, WP-B.
   - After this step: `POST /v1/examples/single-line` is live on backend.

4. **WP-D: Standardize Frontend API Client** (10 min)
   - Why fourth: Bridges frontend → backend now that backend is ready.
   - Can run tests against live backend after this step.
   - Validates frontend-to-backend contract.

5. **WP-E: Wire Frontend Component** (10 min)
   - Why last: Requires WP-D to be complete for end-to-end testing.
   - Lowest risk; pure UI composition.
   - After this step: Feature is visible and functional end-to-end.

**Rationale for Backend-First Sequence:**

- **Reduces integration surprises**: Backend is functional before frontend relies on it.
- **Enables parallel testing**: Backend route can be tested in isolation (e.g., curl, Postman) before UI is wired.
- **Clear dependency order**: Each step has explicit prerequisites and verification points.
- **Non-blocking UI development**: Frontend engineers can mock or stub API responses during WP-E if WP-C is delayed.

---

## Testing Strategy

### Manual Testing (E2E Validation)

**Prerequisite:** All WPs deployed, backend running, frontend running.

#### Test 1: Route Accessibility

```bash
# After WP-C (backend route mounted)
curl -X POST http://localhost:3001/v1/examples/single-line \
  -H "Content-Type: application/json" \
  -d '{"word":"学","hskLevel":1,"language":"en"}'

# Expected: 200 response with examples data (not 404)
```

#### Test 2: API Path Standardization (After WP-D)

```bash
# Browser DevTools → Network tab
# Navigate to word detail page
# Inspect POST request to /v1/examples/single-line
# Expected: Headers include Authorization token (if applicable), body matches contract
```

#### Test 3: UI Rendering (After WP-E)

```
1. Start frontend: npm run dev
2. Navigate to any vocabulary word detail page
3. Verify WordExamplesPanel appears above or below conversation box
4. Verify examples text displays (Chinese, Pinyin, English)
5. Verify skeleton/loader shows during API fetch (if slow)
```

#### Test 4: Data Format Validation (After WP-D)

```
1. Open browser console
2. Navigate to word detail page
3. Check console for type errors or missing fields
4. Inspect API response shape matches Example[] type:
   - Each item has: chinese, pinyin, english fields
```

### Automated Test Coverage

**Affected Test Suites (Update/Add):**

1. **Backend Route Tests** (apps/backend/tests/)
   - Verify examplesRoute returns 200 for valid word/hskLevel
   - Verify error handling for invalid payloads
   - _Note: CachedExampleService already has 14 tests passing; no changes needed there_

2. **Frontend Hook Tests** (apps/frontend/src/features/word/hooks/**tests**/)
   - useExamples: Already has tests; verify they still pass after API path change
   - Test deduplication logic still works with new apiClient
   - Test error handling (simulated API timeout, 500 response)

3. **Frontend Component Tests** (apps/frontend/src/features/word/components/**tests**/)
   - WordExamplesPanel: Verify it renders with mock examples
   - WordDetails: Add test for WordExamplesPanel import and render (new)
   - Add snapshot test for new component hierarchy

4. **Integration Tests** (if applicable)
   - Mock backend service, verify frontend hook calls correct endpoint
   - Verify response shape transform (GCS response → Example[])

**Test Execution Before Closure:**

```bash
# Backend tests
npm run test --workspace=backend -- tests/api/routes/examplesRoute.test.js

# Frontend tests
npm run test --workspace=frontend -- features/word/

# Full test suite (sanity check)
npm test
```

---

## Effort Estimate

| Work Package                    | Effort         | Complexity     | Notes                                                      |
| ------------------------------- | -------------- | -------------- | ---------------------------------------------------------- |
| WP-A: Extend Shared Constants   | 5 min          | Low            | Pure constant addition; no logic                           |
| WP-B: Standardize Backend Route | 10 min         | Low            | Pattern replacement; path unchanged                        |
| WP-C: Mount Backend Route       | 5 min          | Low            | Two-line import/registration                               |
| WP-D: Standardize Frontend API  | 10 min         | Low            | Import swap; path unchanged at runtime                     |
| WP-E: Wire Frontend Component   | 10 min         | Low            | Component import + render; no state logic                  |
| **Manual End-to-End Testing**   | 15 min         | Low            | Curl test, browser UI test, console inspection             |
| **Automated Test Review/Fixes** | 20 min         | Medium         | Updating examplesApi tests if needed; new WordDetails test |
| **Total Implementation**        | **75 minutes** | **Low–Medium** | ~1.25 hours                                                |

**Complexity Assessment:** **Low to Medium**

- No new algorithms, state machine logic, or architectural changes.
- All components already built; purely integration work.
- Primary risk: API path coordination and type mismatches (mitigated by TypeScript strict mode and contract validation).

---

## Recommended Next Specialist

### Primary Workflow:

1. **Backend Implementation Specialist** (WP-A, WP-B, WP-C)
   - Executes shared-constants update
   - Refreshes backend route definition
   - Verifies endpoint is live

2. **Frontend Implementation Specialist** (WP-D, WP-E)
   - Standardizes API client
   - Wires UI component
   - Validates end-to-end flow

**Execution Mode:** **Sequential (not parallel)** to avoid integration surprises.

- Backend must be live before frontend API client is finalized.
- However, WP-A can be done by either specialist independently.

---

## Open Questions / Design Decisions

### Design Decision 1: Always Render Examples vs. Toggle

**Question:** WordDetails currently toggles ConversationBox visibility. Should examples be:

- **(A) Always rendered** (recommended): Examples are lightweight, always useful context, no user action required.
- **(B) Toggle like conversation**: Reduces UI clutter, but requires extra UI state management.

**Recommendation:** **(A) Always rendered**

- **Rationale**: Examples are reading comprehension aids; useful on initial page load without user interaction.
- **UX benefit**: No extra click/state needed; examples appear instantly.
- **Scope**: Matches user intent (examples should be available on word detail page).

**User Input Needed:** ✅ (Assumed per user request context: "examples panel should display alongside conversation")

---

### Design Decision 2: Endpoint Path Naming Convention

**Question:** Should the sub-path be `examplesSingleLine` or something shorter?

**Current Proposed:** `/v1/examples/single-line` with ROUTE_PATTERNS split as:

```javascript
examples: "/v1/examples",
examplesSingleLine: "/single-line",
```

**Alternative:** Single pattern:

```javascript
examplesPath: "/v1/examples/single-line",
```

**Recommendation:** **Current approach (split patterns)**

- **Rationale**: Allows future expansion (e.g., `/v1/examples/batch` for multiple words). Consistent with project style (conversationRoutes uses `.conversations`, `.conversationTextGenerate`, etc.).

**User Input Needed:** ✅ (Standard practice in codebase)

---

### Design Decision 3: Frontend API Client Library

**Question:** Should examplesApi.ts continue using axios, or migrate to apiClient?

**Current Code:** Raw axios.post()  
**Recommended:** apiClient.post() (with ROUTE_PATTERNS)

**Rationale:**

- Centralized error handling (apiClient has interceptors for auth, refresh, normalization)
- Consistent with quizService.ts and project standard
- Easier to mock in tests
- Enables automatic retry logic if configured

**User Input Needed:** ✅ (Standard practice; no choice needed)

---

### Design Decision 4: Data Shape Validation

**Question:** Should examplesApi.ts validate the response shape, or rely on TypeScript types?

**Current**: examplesApi.ts has types (`Example` interface) but no runtime shape validation.

**Recommendation:** Keep TypeScript-only validation (no runtime guards).

- **Rationale**: CachedExampleService is trusted; GCS response format is tested. Runtime validation overhead not justified.
- **Test coverage**: useExamples hook tests already cover GCS→frontend contract.

**User Input Needed:** ✅ (No action needed; current approach is fine)

---

## Blockers / Escalations

**None identified.** All required files exist and are accessible. No external dependency blockers.

---

## Summary

This design decomposes the three structural integration gaps into five sequential, low-risk work packages covering:

1. **Backend route infrastructure** (standardize path in shared constants, mount route)
2. **Frontend API client** (standardize with project convention)
3. **UI integration** (import and render component)

**Total effort:** ~1.25 hours  
**Risk level:** Low (no new logic, all components exist, pure wiring)  
**Next step:** User approval → delegate to Implementation Specialists in sequential order (Backend, then Frontend)
