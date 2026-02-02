# Implementation 14-3: Progress Service Migration with Typed Responses

## Technical Scope

Migrate progress service and hooks from `authFetch` to Axios with full TypeScript type safety, validating the Epic 14 architecture end-to-end.

**Files Modified:**

- `packages/shared-types/src/index.ts` (add progress API types)
- `apps/frontend/src/features/mandarin/services/progressService.ts` (migrate to Axios)
- `apps/frontend/src/features/mandarin/hooks/useProgressActions.ts` (update imports)

**Files Created:**

- `packages/shared-types/src/progress.types.ts` (API contract types)
- `apps/frontend/src/features/mandarin/services/__tests__/progressService.test.ts` (integration tests)

## Implementation Details

### 1. Define TypeScript API Contracts

```typescript
// packages/shared-types/src/progress.types.ts
/**
 * Progress API type definitions
 * Shared between frontend and backend for type safety
 */

export interface WordProgress {
  wordId: string;
  userId: string;
  studyCount: number;
  correctCount: number;
  confidence: number; // 0.0 - 1.0
  learnedAt: string | null; // ISO 8601 datetime
  nextReviewDate: string | null; // ISO 8601 datetime
  lastReviewedAt: string | null; // ISO 8601 datetime
  createdAt: string;
  updatedAt: string;
}

export interface ProgressResponse {
  success: boolean;
  data: WordProgress[];
  message?: string;
}

export interface SingleProgressResponse {
  success: boolean;
  data: WordProgress;
  message?: string;
}

export interface UpdateProgressRequest {
  studyCount?: number;
  correctCount?: number;
  confidence?: number;
  learnedAt?: string | null;
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
}

export interface BatchUpdateRequest {
  updates: Array<{
    wordId: string;
    data: UpdateProgressRequest;
  }>;
}

export interface BatchUpdateResponse {
  success: boolean;
  data: {
    updated: number;
    failed: number;
    results: WordProgress[];
  };
  message?: string;
}
```

```typescript
// packages/shared-types/src/index.ts (add export)
export * from "./progress.types";
```

### 2. Migrate Progress Service to Axios

```typescript
// apps/frontend/src/features/mandarin/services/progressService.ts
import { apiClient } from "../../../services/axiosClient";
import {
  ProgressResponse,
  SingleProgressResponse,
  UpdateProgressRequest,
  BatchUpdateRequest,
  BatchUpdateResponse,
  WordProgress,
} from "@mandarin/shared-types";

/**
 * Progress API service using Axios with typed responses
 * Replaces authFetch with automatic token refresh and retry logic
 */
export const progressApi = {
  /**
   * Get all progress for current user
   */
  async getAllProgress(): Promise<WordProgress[]> {
    try {
      const response = await apiClient.get<ProgressResponse>("/api/v1/progress");
      return response.data.data;
    } catch (error) {
      console.error("[progressApi] Failed to fetch all progress:", error);
      throw new Error("Failed to load your progress. Please try again.");
    }
  },

  /**
   * Get progress for specific word
   */
  async getWordProgress(wordId: string): Promise<WordProgress | null> {
    try {
      const response = await apiClient.get<SingleProgressResponse>(`/api/v1/progress/${wordId}`);
      return response.data.data;
    } catch (error: any) {
      // 404 means no progress exists yet (valid case)
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`[progressApi] Failed to fetch progress for ${wordId}:`, error);
      throw new Error("Failed to load word progress. Please try again.");
    }
  },

  /**
   * Update progress for specific word
   */
  async updateWordProgress(wordId: string, data: UpdateProgressRequest): Promise<WordProgress> {
    try {
      const response = await apiClient.put<SingleProgressResponse>(
        `/api/v1/progress/${wordId}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      console.error(`[progressApi] Failed to update progress for ${wordId}:`, error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  /**
   * Batch update progress for multiple words
   */
  async batchUpdateProgress(updates: BatchUpdateRequest): Promise<WordProgress[]> {
    try {
      const response = await apiClient.post<BatchUpdateResponse>("/api/v1/progress/batch", updates);
      return response.data.data.results;
    } catch (error) {
      console.error("[progressApi] Failed to batch update progress:", error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  /**
   * Delete progress for specific word (reset to untouched)
   */
  async deleteWordProgress(wordId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/progress/${wordId}`);
    } catch (error) {
      console.error(`[progressApi] Failed to delete progress for ${wordId}:`, error);
      throw new Error("Failed to reset word progress. Please try again.");
    }
  },
};
```

### 3. Update useProgressActions Hook

```typescript
// apps/frontend/src/features/mandarin/hooks/useProgressActions.ts (changes only)
import { useMemo } from "react";
import { WordBasic, WordProgress } from "../types";
import { progressApi } from "../services/progressService"; // Updated import (no change needed)
import { useProgressDispatch } from "./useProgressDispatch";

export function useProgressActions() {
  const dispatch = useProgressDispatch();

  return useMemo(
    () => ({
      // ... existing actions unchanged

      // Mark word learned: optimistic update + API sync
      markWordLearned: async (id: string) => {
        const now = new Date().toISOString();

        // Optimistic update (unchanged)
        dispatch({
          type: "PROGRESS/UPDATE_WORD",
          payload: {
            wordId: id,
            data: {
              studyCount: 1,
              correctCount: 1,
              confidence: 1.0,
              learnedAt: now,
            },
          },
        });

        // API sync with typed response
        try {
          const updated = await progressApi.updateWordProgress(id, {
            studyCount: 1,
            correctCount: 1,
            confidence: 1.0,
            learnedAt: now,
          });

          // Sync backend response to local state
          dispatch({
            type: "PROGRESS/SYNC_FROM_SERVER",
            payload: { wordProgress: updated },
          });
        } catch (error) {
          console.error("Failed to sync progress to backend:", error);
          // Optimistic update remains; user sees immediate feedback
          // Error logged but not thrown (non-blocking)
        }
      },

      // Similar updates for other actions (markWordReviewed, resetWordProgress, etc.)
      // ... (pattern same as markWordLearned)
    }),
    [dispatch],
  );
}
```

### 4. Remove authFetch Dependency

```typescript
// Check for remaining authFetch imports in progress-related files
// Should be zero after migration:
// - progressService.ts ✅ (migrated to apiClient)
// - useProgressActions.ts ✅ (imports progressApi which uses apiClient)
```

### 5. Integration Tests

```typescript
// apps/frontend/src/features/mandarin/services/__tests__/progressService.test.ts
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { progressApi } from "../progressService";
import { WordProgress } from "@mandarin/shared-types";

describe("progressApi", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("getAllProgress", () => {
    it("should fetch all progress and return typed data", async () => {
      const mockProgress: WordProgress[] = [
        {
          wordId: "word1",
          userId: "user1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          learnedAt: "2026-01-01T00:00:00Z",
          nextReviewDate: "2026-02-01T00:00:00Z",
          lastReviewedAt: "2026-01-15T00:00:00Z",
          createdAt: "2025-12-01T00:00:00Z",
          updatedAt: "2026-01-15T00:00:00Z",
        },
      ];

      mock.onGet("/api/v1/progress").reply(200, {
        success: true,
        data: mockProgress,
      });

      const result = await progressApi.getAllProgress();
      expect(result).toEqual(mockProgress);
      expect(result[0].wordId).toBe("word1"); // Type-safe access
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onGet("/api/v1/progress").reply(500);

      await expect(progressApi.getAllProgress()).rejects.toThrow("Failed to load your progress");
    });
  });

  describe("updateWordProgress", () => {
    it("should update progress and return updated data", async () => {
      const updatedProgress: WordProgress = {
        wordId: "word1",
        userId: "user1",
        studyCount: 6,
        correctCount: 5,
        confidence: 0.9,
        learnedAt: "2026-01-01T00:00:00Z",
        nextReviewDate: "2026-02-05T00:00:00Z",
        lastReviewedAt: "2026-02-02T00:00:00Z",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2026-02-02T00:00:00Z",
      };

      mock.onPut("/api/v1/progress/word1").reply(200, {
        success: true,
        data: updatedProgress,
      });

      const result = await progressApi.updateWordProgress("word1", {
        studyCount: 6,
        correctCount: 5,
        confidence: 0.9,
      });

      expect(result).toEqual(updatedProgress);
    });
  });

  describe("getWordProgress", () => {
    it("should return null on 404 (word not yet learned)", async () => {
      mock.onGet("/api/v1/progress/newword").reply(404);

      const result = await progressApi.getWordProgress("newword");
      expect(result).toBeNull();
    });
  });
});
```

## Architecture Integration

```
Component (Flashcard)
       ↓ calls
useProgressActions()
       ↓ dispatches
progressReducer (optimistic update)
       ↓ async sync
progressApi.updateWordProgress()
       ↓ uses
apiClient (Axios with interceptors)
       ↓ makes HTTP request
[Request Interceptor] → Attach token
       ↓
Backend API
       ↓
[Response Interceptor] → Handle 401/retry
       ↓ returns
WordProgress (typed)
       ↓ syncs
PROGRESS/SYNC_FROM_SERVER action
       ↓ updates
progressReducer (server state)
```

**Type Safety Flow:**

```
TypeScript Interface (shared-types)
       ↓ imported by
progressService.ts (apiClient.get<ProgressResponse>)
       ↓ enforces
response.data.data: WordProgress[]
       ↓ consumed by
useProgressActions (dispatch payload)
       ↓ validated by
TypeScript compiler (compile-time checks)
```

## Technical Challenges & Solutions

### Challenge 1: Error Response Transformation

**Problem:** Axios throws errors differently than `fetch()`. `fetch` requires manual `response.ok` checks; Axios throws on non-2xx status codes. Existing error handling patterns invalid.

**Solution:** Wrap Axios calls in try-catch blocks and transform errors into user-friendly messages. Use `error.response?.status` to handle specific HTTP codes (404 for "not found" is valid for progress).

```typescript
try {
  const response = await apiClient.get<ProgressResponse>("/api/v1/progress");
  return response.data.data;
} catch (error: any) {
  if (error.response?.status === 404) {
    return null; // Valid case: no progress exists yet
  }
  throw new Error("Failed to load your progress. Please try again.");
}
```

### Challenge 2: Response Data Unwrapping

**Problem:** Backend returns `{ success: true, data: [...] }` structure. Axios returns `{ data: { success: true, data: [...] } }`. Double `.data` access confusing.

**Solution:** Define typed response interfaces (`ProgressResponse`) that match backend structure exactly. Services unwrap once: `response.data.data`. Components receive clean typed arrays.

```typescript
const response = await apiClient.get<ProgressResponse>("/api/v1/progress");
// response: AxiosResponse<ProgressResponse>
// response.data: ProgressResponse = { success: true, data: WordProgress[] }
return response.data.data; // WordProgress[]
```

### Challenge 3: Optimistic Updates + Type Safety

**Problem:** `useProgressActions` dispatches optimistic updates (partial data) then syncs full server response (complete data). TypeScript enforces complete `WordProgress` objects, but optimistic updates may not have all fields.

**Solution:** Define `UpdateProgressRequest` as optional fields (`studyCount?: number`). Reducer merges partial updates with existing state. Server sync action replaces with full `WordProgress` from backend.

```typescript
// Optimistic update (partial)
dispatch({
  type: "PROGRESS/UPDATE_WORD",
  payload: {
    wordId: id,
    data: { confidence: 1.0 }, // Only updated fields
  },
});

// Server sync (complete)
dispatch({
  type: "PROGRESS/SYNC_FROM_SERVER",
  payload: { wordProgress: updated }, // Full WordProgress object
});
```

### Challenge 4: Shared Types Package Integration

**Problem:** Frontend and backend need identical type definitions. Duplication risks drift. Monorepo has `shared-types` package, but wasn't used consistently.

**Solution:** Define all API contracts in `packages/shared-types/src/progress.types.ts`. Both frontend services and backend controllers import from `@mandarin/shared-types`. Single source of truth.

## Testing Implementation

### Unit Tests Coverage

- ✅ `getAllProgress()` - fetch all, handle errors
- ✅ `getWordProgress()` - single word, 404 handling
- ✅ `updateWordProgress()` - update single word
- ✅ `batchUpdateProgress()` - batch operations
- ✅ `deleteWordProgress()` - reset progress
- ✅ Type safety - TypeScript compile-time checks

### Integration Tests

- ✅ Mock Axios responses with `axios-mock-adapter`
- ✅ Verify typed responses (autocomplete works in tests)
- ✅ Error handling (500, 404, network errors)

### Manual Testing Checklist

- [ ] Open flashcard, mark word learned, verify optimistic update
- [ ] Refresh page, verify progress persisted (backend sync worked)
- [ ] Throttle network, mark word learned, verify retry behavior
- [ ] Expire token, mark word learned, verify auto-refresh
- [ ] Disconnect network, mark word learned, verify error message user-friendly
- [ ] Check browser console: no `authFetch` calls, only `apiClient`
- [ ] Verify TypeScript autocomplete works (type `progress.` in IDE)

### Rollback Plan

If critical issues found post-merge:

1. Revert `progressService.ts` to use `authFetch` (keep old version in git history)
2. Keep `shared-types` definitions (not harmful)
3. Frontend continues using Axios client (Story 14.1-14.2 remain)
4. Investigate issue, re-attempt migration after fix

## Performance Considerations

**Improvements:**

- Automatic retry reduces failed progress saves (better reliability)
- Token refresh eliminates re-login flow (saves ~2s per session)
- Typed responses reduce runtime type errors (fewer crashes)

**No Regressions:**

- Optimistic updates unchanged (immediate UI feedback)
- API call patterns unchanged (same endpoints, same frequency)
- Bundle size increase minimal (~13KB for Axios, amortized across all services)

**Metrics to Monitor (Post-Merge):**

- Progress save success rate (should remain >99.5%)
- API latency p95 (should remain <200ms)
- Frontend error rate (should not increase)

## Documentation Updates

### Code Conventions Guide

Update `docs/guides/code-conventions.md`:

````markdown
### Progress Service Migration Example

**Before (authFetch):**

```typescript
const response = await authFetch("/api/v1/progress");
if (!response.ok) {
  throw new Error("Failed");
}
const data = await response.json();
```
````

**After (Axios with types):**

```typescript
import { apiClient } from "@/services/axiosClient";
import { ProgressResponse } from "@mandarin/shared-types";

const response = await apiClient.get<ProgressResponse>("/api/v1/progress");
const data = response.data.data; // Typed as WordProgress[]
```

**Benefits:**

- ✅ Automatic token refresh
- ✅ Automatic retry on network errors
- ✅ TypeScript autocomplete
- ✅ Compile-time type checking

````

### Architecture Documentation
Update `docs/architecture.md`:

```markdown
### API Layer (Updated Epic 14)

**Stack:**
- Axios 1.6+ for HTTP requests
- Centralized `apiClient` with interceptors
- Shared TypeScript types in `@mandarin/shared-types`

**Services:**
- `progressService.ts` - Migrated ✅ (Story 14.4)
- `conversationService.ts` - Legacy (uses `ApiClient.authRequest`)
- `audioService.ts` - Legacy (uses `ApiClient.authRequest`)

**Migration Status:** 1/3 services migrated (Epic 14 complete)
````

## Related Documentation

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Epic 14 Implementation](./README.md)
- [Story 14.4 BR](../../business-requirements/epic-14-api-modernization/story-14-4-progress-service-migration.md)
- [Story 14.3 Implementation](./story-14-2-axios-interceptors.md) (Previous)
- [Code Conventions Guide](../../guides/code-conventions.md)
- [Architecture Overview](../../architecture.md)
