# Implementation 17-2: Extract Progress Feature (Frontend)

## Technical Scope

**Files to create:**

- `apps/frontend/src/features/progress/stores/progressStore.ts` — Zustand store
- `apps/frontend/src/features/progress/hooks/useRecordActivity.ts` — public API hook
- `apps/frontend/src/features/progress/hooks/index.ts` — barrel
- `apps/frontend/src/features/progress/services/progressService.ts` — API client (moved from quiz)
- `apps/frontend/src/features/progress/services/index.ts` — barrel
- `apps/frontend/src/features/progress/types/index.ts` — types (moved from quiz)
- `apps/frontend/src/features/progress/index.ts` — feature barrel
- `apps/frontend/src/features/progress/README.md` — optional feature overview

**Files to modify:**

- `apps/frontend/src/features/quiz/hooks/useProgressActions.ts` — delegate progress recording to `useRecordActivity()`
- `apps/frontend/src/features/quiz/hooks/useProgressState.ts` — update imports
- `apps/frontend/src/features/quiz/hooks/useProgressDispatch.ts` — update imports
- `apps/frontend/src/features/quiz/services/index.ts` — remove progressService re-export
- `apps/frontend/src/features/quiz/types/index.ts` — remove Progress-related type exports
- `apps/frontend/src/features/quiz/index.ts` — remove progress-related exports
- `apps/backend/package.json` — no changes (backend handled in Story 17.3)
- `apps/frontend/package.json` — add `zustand` dependency
- `apps/frontend/src/features/quiz/reducers/progressReducer.ts` — keep as transitional (removed in Story 17.5)

**Installation:**

```bash
cd apps/frontend
npm install zustand
```

## Implementation Details

### Step 1: Install Zustand

```bash
cd apps/frontend
npm install zustand
```

### Step 2: Create Zustand Progress Store

```typescript
// features/progress/stores/progressStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { WordProgress } from "../types";
import * as progressApi from "../services/progressService";

interface ProgressState {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
  isLoading: boolean;
  error: string | undefined;

  // Actions
  loadProgress: () => Promise<void>;
  updateWordProgress: (wordId: string, data: Partial<WordProgress>) => void;
  batchUpdate: (updates: Array<{ wordId: string; data: Partial<WordProgress> }>) => void;
  reset: () => void;
}

const initialState = {
  wordsById: {},
  wordIds: [],
  isLoading: false,
  error: undefined,
};

export const useProgressStore = create<ProgressState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadProgress: async () => {
        set({ isLoading: true, error: undefined });
        try {
          const records = await progressApi.getAllProgress();
          const wordsById: Record<string, WordProgress> = {};
          const wordIds: string[] = [];
          for (const record of records) {
            wordsById[record.wordId] = record;
            wordIds.push(record.wordId);
          }
          set({ wordsById, wordIds, isLoading: false });
        } catch (err) {
          set({ error: "Failed to load progress", isLoading: false });
        }
      },

      updateWordProgress: (wordId, data) =>
        set((state) => ({
          wordsById: {
            ...state.wordsById,
            [wordId]: { ...state.wordsById[wordId], ...data },
          },
          wordIds: state.wordIds.includes(wordId) ? state.wordIds : [...state.wordIds, wordId],
        })),

      batchUpdate: (updates) =>
        set((state) => {
          const newWordsById = { ...state.wordsById };
          const newWordIds = [...state.wordIds];
          for (const { wordId, data } of updates) {
            newWordsById[wordId] = { ...newWordsById[wordId], ...data };
            if (!newWordIds.includes(wordId)) {
              newWordIds.push(wordId);
            }
          }
          return { wordsById: newWordsById, wordIds: newWordIds };
        }),

      reset: () => set(initialState),
    }),
    { name: "progress-store" },
  ),
);
```

### Step 3: Create `useRecordActivity()` Hook

```typescript
// features/progress/hooks/useRecordActivity.ts
import { useCallback } from "react";
import { useProgressStore } from "../stores/progressStore";
import * as progressApi from "../services/progressService";

interface RecordActivityParams {
  feature: string; // "quiz" | "reading" | "radicals"
  wordId: string;
  correct: boolean;
  data?: Record<string, unknown>;
}

export function useRecordActivity() {
  const updateWordProgress = useProgressStore((s) => s.updateWordProgress);

  return useCallback(
    async (params: RecordActivityParams) => {
      const { feature, wordId, correct, data } = params;

      // Optimistic update
      updateWordProgress(wordId, {
        studyCount: (data?.studyCount as number) ?? 1,
        correctCount: correct ? 1 : 0,
        lastReviewed: new Date().toISOString(),
      });

      // Server sync via generic event endpoint
      try {
        await progressApi.recordEvent({
          type: "record-answer",
          feature,
          data: { wordId, correct, ...data },
        });
      } catch (err) {
        console.error("Failed to sync progress event:", err);
        // Optimistic update remains — will reconcile on next loadProgress()
      }
    },
    [updateWordProgress],
  );
}
```

### Step 4: Move/Copy `progressService.ts`

Copy from `features/quiz/services/progressService.ts` to `features/progress/services/progressService.ts`. Add the new `recordEvent` function for the generic event endpoint:

```typescript
// features/progress/services/progressService.ts
import { apiClient } from "../../../shared/api/axiosClient";
import { API_ROUTES } from "@mandarin/shared-constants";

export async function getAllProgress() {
  const { data } = await apiClient.get(API_ROUTES.progress);
  return data;
}

export async function getWordProgress(wordId: string) {
  const { data } = await apiClient.get(API_ROUTES.progressWord(wordId));
  return data;
}

export async function updateWordProgress(wordId: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(API_ROUTES.progressWord(wordId), payload);
  return data;
}

export async function batchUpdateProgress(updates: Array<Record<string, unknown>>) {
  const { data } = await apiClient.post(API_ROUTES.progressBatch, { updates });
  return data;
}

// NEW: Generic event endpoint
export async function recordEvent(event: {
  type: string;
  feature: string;
  data: Record<string, unknown>;
}) {
  const { data } = await apiClient.post("/api/progress/event", event);
  return data;
}
```

### Step 5: Update Quiz Feature

- In `useProgressActions.ts`, replace direct dispatch to progressReducer with calls to `useRecordActivity()`
- Keep quiz's `progressReducer` and `ProgressContext` as transitional — they will be removed in Story 17.5
- Update barrel exports to re-export progress items from new location

## Architecture Integration

```
Before:
  features/quiz/
    reducers/progressReducer.ts  ← progress state managed by quiz
    context/ProgressContext.tsx   ← provides progress via Context
    hooks/useProgressActions.ts   ← dispatches to progressReducer
    hooks/useProgressState.ts     ← reads from ProgressContext
    services/progressService.ts   ← API client
    types/Progress.ts             ← progress types

After (transitional):
  features/progress/              ← NEW: owns progress state
    stores/progressStore.ts       ← Zustand store
    hooks/useRecordActivity.ts    ← public API hook
    services/progressService.ts   ← API client (moved)
    types/index.ts                ← types (moved)

  features/quiz/                  ← still has progressReducer (transitional)
    reducers/progressReducer.ts   ← kept for backward compat until Story 17.5
    context/ProgressContext.tsx    ← kept for backward compat until Story 17.6
```

## Technical Challenges & Solutions

### Challenge 1: Dual State Sources During Transition

**Problem:** During the transitional period, two state sources exist simultaneously — the old `progressReducer` (Context, in quiz) and the new `progressStore` (Zustand, in progress feature). Components using `ProgressContext` won't see updates made to the Zustand store and vice versa.

**Root Cause:** The migration is phased: Story 17.2 creates the new store but existing quiz consumers still use the old Context + reducer pattern. Inconsistent state would occur if both sources were written to independently.

**Solution:** Keep `progressReducer` operational during transition. Features that have been migrated use the Zustand store directly. Unmigrated consumers continue to use `ProgressContext`. Both sources call the same backend API, so data stays consistent via server-side reconciliation. The `useRecordActivity()` hook writes to the Zustand store optimistically, while `useProgressActions()` continues writing to the old Context reducer. Dual writes are avoided by design — each consumer uses exactly one source.

**Resolution timeline:** Story 17.5 removes `progressReducer`, Story 17.6 removes `ProgressContext`.

### Challenge 2: Quiz Barrel Export Cleanup

**Problem:** The quiz feature's barrel (`features/quiz/index.ts`) exported `progressApi` and four progress types (`UserProgress`, `UserProgressListEntry`, `WordProgress`, `ProgressState`). Removing these exports without checking all external consumers could cause import resolution failures.

**Root Cause:** The quiz barrel acted as a de facto progress module API. Multiple consumers (FlashCardPage, NavBar, Sidebar, etc.) imported progress-related items from `features/quiz/`.

**Solution:** 
- Retained the internal files (`quiz/services/progressService.ts`, `quiz/types/Progress.ts`) for backward compat
- Removed only the barrel re-exports — external consumers must now import from `features/progress/`
- Verified all existing imports still resolve (internal quiz code imports directly, not through barrel)
- Quiz's `progressReducer.ts` intentionally kept as transitional (removed in Story 17.5)

### Challenge 3: Zustand Dependency Installation

**Problem:** `zustand` was not installed in the project. Installing it required running `npm install` in the frontend workspace.

**Solution:** Installed via `npm install zustand` in `apps/frontend/`. Verified import resolves correctly via `import { create } from "zustand"` and `import { devtools } from "zustand/middleware"`.

## Testing Implementation

### New Tests Created

**File:** `features/progress/stores/__tests__/progressStore.test.ts`

4 tests covering:
1. **Initial state** — verifies empty `wordsById` and `wordIds`
2. **Optimistic update** — `updateWordProgress` correctly merges partial data
3. **Batch update** — `batchUpdate` handles multiple word records atomically
4. **Reset** — `reset` returns store to initial empty state

### Verification Results

| Metric | Result |
|--------|--------|
| Test files | **31/31 passed** (+1 new: progressStore.test.ts) |
| Tests | **259/259 passed** (+4 new store tests) |
| Regressions | None — all existing quiz tests unchanged |
| `tsc --noEmit` | Zero type errors |

Store tests are simpler than reducer tests — no context wrapping needed (Zustand stores are provider-less).
