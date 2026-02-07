# Epic 14: Post-Epic Notes

**Epic:** [Epic 14: API & Infrastructure Modernization](./README.md)  
**Date:** February 7, 2026  
**Status:** Completed

This document captures additional work and discoveries made after completing the 6 planned stories.

---

## Story Summary

All 6 stories completed successfully:

1. ✅ [**Story 14.1: Jest to Vitest Migration**](./story-14-1-jest-to-vitest-migration.md)
   - Migrate testing infrastructure from Jest to Vitest for Vite compatibility

2. ✅ [**Story 14.2: Centralized API Configuration**](./story-14-2-centralized-api-config.md)
   - Create centralized API configuration and Axios client

3. ✅ [**Story 14.3: Axios Interceptors & Auth Resilience**](./story-14-3-axios-interceptors.md)
   - Implement request/response interceptors for token refresh and retry logic

4. ✅ [**Story 14.4: Progress Service Migration**](./story-14-4-progress-service-migration.md)
   - Migrate progress service to Axios with typed responses

5. ✅ [**Story 14.5: Conversation Service Migration**](./story-14-5-conversation-service-migration.md)
   - Migrate conversation service to Axios with typed responses

6. ✅ [**Story 14.6: Audio Service Migration**](./story-14-6-audio-service-migration.md)
   - Migrate audio service to Axios with typed responses (completes epic)

---

## Post-Epic Simplification

After completing Stories 14.4-14.6, additional cleanup was performed to remove technical debt:

### Duplicate Code Elimination

**Removed Classes:**

- `LocalAudioBackend` (90% identical to `DefaultAudioBackend`)
- `LocalConversationBackend` (90% identical to `DefaultConversationBackend`)

**Impact:**

- Code reduction: 307 → 155 lines (49.5% reduction in audio + conversation services)
- Duplication eliminated: ~44%
- Maintenance burden reduced: Single backend implementation per service

**Rationale:**

- Both backends called identical Axios endpoints with same parameters
- Only difference was error messages (not meaningful enough to justify duplication)
- Fallback resilience now handled by Axios interceptors (Story 14.3)

### Architecture Improvement

**Removed Manual Fallback Logic:**

- Service constructors no longer create fallback chains (`new AudioService(new LocalAudioBackend(), false)`)
- Services now rely on centralized Axios interceptors for retry/resilience
- Simplified to single backend per service with optional dependency injection for testing

**Before:**

```typescript
export class AudioService implements IAudioService {
  protected backend: IAudioBackend;
  declare fallbackService?: AudioService;

  constructor(backend?: IAudioBackend, withFallback = true) {
    this.backend = backend || new DefaultAudioBackend();
    if (withFallback) {
      this.fallbackService = new AudioService(new LocalAudioBackend(), false);
    }
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      return await this.backend.fetchWordAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchWordAudio(params); // Manual fallback
    }
  }
}
```

**After:**

```typescript
export class AudioService implements IAudioService {
  protected backend: IAudioBackend;

  constructor(backend?: IAudioBackend) {
    this.backend = backend || new DefaultAudioBackend();
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    // Axios interceptors handle retry automatically
    return await this.backend.fetchWordAudio(params);
  }
}
```

### Quality Improvements

**Type Safety:**

- Replaced all `error: any` → `error: unknown` with proper type guards
- Added `AxiosError` narrowing for HTTP-specific error handling
- Fixed type mismatches in `ProgressContext.tsx`

**Test Suite:**

- Removed 10+ duplicate backend tests (LocalBackend tests identical to DefaultBackend)
- Maintained 100% test coverage (42/42 tests passing)
- Added missing Vitest imports in test files

---

## Post-Epic Discoveries

After completing all 6 stories, runtime debugging revealed a systematic "double data" access pattern requiring correction across 3 services.

### Issue: Double Data Access Bug

**Problem:**
Frontend services accessed `response.data.data` assuming backend wrapped responses in `{ success: true, data: {...} }`. However, backend controllers return data **directly** via `res.json(data)`, not wrapped.

**How Axios Works:**

- Backend: `res.json([{ wordId: "123" }])` → HTTP body is `[{ wordId: "123" }]`
- Axios wraps: `{ data: [{ wordId: "123" }], status: 200, headers: {...} }`
- Frontend accessed: `response.data.data` → `[{ wordId: "123" }].data` → `undefined` ❌

**Expected vs. Actual:**

- **Expected (if backend wrapped):** `response.data.data` → `response.data.data`
- **Actual (backend direct):** `response.data` → direct data
- **Bug:** `response.data.data` → `undefined` (accessing `.data` on unwrapped array/object)

### Discovery Timeline (February 7, 2026)

1. **Initial Report**: User reported runtime TypeError in progressReducer:

   ```
   Cannot read properties of undefined (reading 'forEach')
   ```

2. **Surface Fix Attempted**: Added `Array.isArray()` check in reducer to handle undefined case

3. **Root Cause Challenge**: User challenged surface fix: "That may fix the surface but I think that's not the root cause"

4. **Deep Investigation**: Inspected backend controllers (`progressController.js`, `ttsController.js`, `conversationController.js`):

   ```javascript
   // All controllers return data DIRECTLY (no wrapper)
   res.json([...]); // Arrays
   res.json({ id, name }); // Objects
   // NOT: res.json({ success: true, data: [...] })
   ```

5. **Systematic Audit**: Found 8 affected methods across 3 services:
   - **progressService**: 5 methods (getAllProgress, getWordProgress, updateWordProgress, batchUpdateProgress, getProgressStats)
   - **audioService**: 2 methods (fetchWordAudio, fetchTurnAudio)
   - **conversationService**: 1 method (generateConversation)

6. **Test Mock Mismatch**: All test mocks incorrectly returned wrapped data:

   ```typescript
   // ❌ Test Mock (WRONG - doesn't match backend)
   mock.onGet("/api/progress").reply(200, {
     success: true,
     data: [{ wordId: "123" }],
   });

   // ✅ Actual Backend Response
   res.json([{ wordId: "123" }]); // Direct array
   ```

   Result: Tests passed ✅, production failed ❌

### Resolution

**Code Changes:**

- Changed `response.data.data` → `response.data` in all 8 methods
- Removed 6 unused wrapped response type imports:
  - `ProgressApiResponse`
  - `SingleProgressApiResponse`
  - `BatchUpdateApiResponse`
  - `WordAudioApiResponse`
  - `TurnAudioApiResponse`
  - `ConversationApiResponse`

**Test Changes:**

- Updated 10 test mocks to return direct data matching backend behavior:
  - `progressService.test.ts`: 3 mocks
  - `audioService.test.ts`: 6 mocks
  - `conversationService.test.ts`: 1 mock (+ type safety test for AxiosError)

**Type Safety Improvements:**

- Replaced `error: any` → `error: unknown` with AxiosError type guards:

  ```typescript
  // Before
  catch (error: any) {
    if (error.response?.status === 404) return null;
    throw new Error("Failed");
  }

  // After
  catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) return null;
      console.error("API error:", error.response?.status, error.message);
    }
    throw new Error("Failed to load data. Please try again.");
  }
  ```

### Key Lessons Learned

1. **Always verify actual backend response structure** during migration - don't assume based on documentation or conventions

2. **Test mocks must exactly match backend behavior** - not idealized/assumed structure. Mismatched mocks give false confidence.

3. **Systematic bugs require systematic audits** - check all services when pattern detected, not just reported case

4. **Axios wraps once, backend may not wrap at all**:
   - Axios adds ONE layer: `{ data: <response body> }`
   - Backend may return direct data (arrays, objects)
   - Result: Access `response.data` directly (NOT `response.data.data`)

5. **User challenges to "surface fixes" often reveal deeper architectural misunderstandings** - investigate root causes when questioned

---

## Documentation Created

New knowledge base articles created to capture transferable lessons:

1. **[API Response Patterns](../../knowledge-base/api-response-patterns.md)**
   - Wrapper vs. direct response patterns
   - Axios integration and double unwrap pitfalls
   - Test mock alignment strategies
   - Migration best practices
   - ~500 lines of detailed guidance

2. **[TypeScript Error Handling](../../knowledge-base/typescript-error-handling.md)**
   - Best practices for `error: unknown` pattern
   - AxiosError type narrowing
   - User-friendly error messaging
   - Testing error handling patterns
   - ~400 lines of practical examples

**Updated Documentation:**

- [Code Conventions](../../guides/code-conventions.md) - Added "Backend Response Structure" and "Error Handling Standards" sections
- [Testing Guide](../../guides/testing-guide.md) - Added "Aligning Mocks with Backend Behavior" subsection
- [Story 14.4-14.6 Implementation Docs](.) - Added Challenge 2 documenting the bug discovery

---

## Metrics

**Code Quality:**

- Lines of service code: 307 → 155 (49.5% reduction)
- Duplicate code eliminated: ~44%
- Type safety: 100% (`error: any` → `error: unknown`)
- Test coverage: Maintained at 100% (42/42 passing)

**Bug Fixes:**

- Methods corrected: 8 across 3 services
- Type imports removed: 6 unused wrappers
- Test mocks updated: 10 to match backend reality

**Documentation:**

- New KB articles: 2 (~900 lines)
- Updated guides: 3 (code conventions, testing, story implementations)
- Total documentation added: ~1,200 lines

**Time Investment:**

- Post-epic cleanup: ~3 hours
- Bug discovery + fix: ~2 hours
- Knowledge base creation: ~4 hours
- **Total post-epic work:** ~9 hours

---

## Related Documentation

**Business Requirements:**

- [Epic 14 BR README](../../business-requirements/epic-14-api-modernization/README.md)
- All 6 story BRs in [business-requirements/epic-14-api-modernization/](../../business-requirements/epic-14-api-modernization/)

**Implementation:**

- [Epic 14 Implementation README](./README.md)
- All 6 story implementation docs in this directory

**Knowledge Base:**

- [API Response Patterns](../../knowledge-base/api-response-patterns.md)
- [TypeScript Error Handling](../../knowledge-base/typescript-error-handling.md)

**Guides:**

- [Code Conventions](../../guides/code-conventions.md)
- [Testing Guide](../../guides/testing-guide.md)
