# Implementation 17-5: Zustand Migration (UI + User + Progress)

## Technical Scope

**Files to create:**

- `apps/frontend/src/shared/store/uiStore.ts` — replaces `uiStore.prelude.ts`
- `apps/frontend/src/shared/store/userStore.ts` — replaces `userStore.prelude.ts`

**Files to modify:**

- `apps/frontend/src/shared/store/index.ts` — update exports to real stores
- `apps/frontend/src/features/progress/stores/progressStore.ts` — finalize (may have been created in Story 17.2)
- `apps/frontend/src/features/quiz/context/ProgressContext.tsx` — delegate to Zustand stores
- `apps/frontend/src/features/quiz/reducers/rootReducer.ts` — remove progressReducer (progress now in Zustand)
- All hooks and components consuming UI/user/progress state

**Files to delete:**

- `apps/frontend/src/shared/store/uiStore.prelude.ts`
- `apps/frontend/src/shared/store/userStore.prelude.ts`
- `apps/frontend/src/features/quiz/reducers/progressReducer.ts`
- `apps/frontend/src/features/quiz/reducers/__tests__/progressReducer.test.ts` (replaced)

**Files to retain (transitional, removed in Story 17.6):**

- `features/quiz/context/ProgressContext.tsx` — thin wrapper over Zustand stores
- `features/quiz/reducers/uiReducer.ts` — delete (already moved in Story 17.1)
- `features/quiz/reducers/userReducer.ts` — delete (already moved in Story 17.1)

## Implementation Details

### Step 1: Create `shared/store/uiStore.ts`

```typescript
// shared/store/uiStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { WordBasic } from "../../features/vocabulary/types/Word";

interface UiState {
  isLoading: boolean;
  lastUpdated: string | null;
  selectedList: string | null;
  selectedWords: WordBasic[];
  error: string | undefined;
  initialized: boolean;

  // Actions
  setLoading: (isLoading: boolean) => void;
  setUpdated: (lastUpdated: string) => void;
  setSelectedList: (listId: string | null) => void;
  setSelectedWords: (words: WordBasic[]) => void;
  setError: (error?: string) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      isLoading: false,
      lastUpdated: null,
      selectedList: null,
      selectedWords: [],
      error: undefined,
      initialized: false,

      setLoading: (isLoading) => set({ isLoading }),
      setUpdated: (lastUpdated) => set({ lastUpdated }),
      setSelectedList: (listId) => set({ selectedList: listId }),
      setSelectedWords: (words) => set({ selectedWords: words }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ initialized }),
      reset: () =>
        set({
          isLoading: false,
          lastUpdated: null,
          selectedList: null,
          selectedWords: [],
          error: undefined,
          initialized: false,
        }),
    }),
    { name: "ui-store" },
  ),
);
```

### Step 2: Create `shared/store/userStore.ts`

```typescript
// shared/store/userStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UserPreferences {
  theme?: string;
  language?: string;
}

interface UserState {
  userId: string | null;
  preferences: UserPreferences | null;

  // Actions
  setUserId: (userId: string | null) => void;
  setPreferences: (preferences: UserPreferences) => void;
  refresh: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      userId: null,
      preferences: null,

      setUserId: (userId) => set({ userId }),
      setPreferences: (preferences) => set({ preferences }),
      refresh: () => {
        // Re-read identity from localStorage or API
        const storedId = localStorage.getItem("deviceUserId");
        if (storedId) set({ userId: storedId });
      },
      reset: () => set({ userId: null, preferences: null }),
    }),
    { name: "user-store" },
  ),
);
```

### Step 3: Update `ProgressContext.tsx`

The `ProgressContext` becomes a thin wrapper that reads from Zustand stores, rather than using `useReducer`:

```typescript
// ProgressContext.tsx — transitional wrapper over Zustand stores
// Will be removed entirely in Story 17.6
import { createContext, ReactNode, useEffect, useState } from "react";
import { useProgressStore } from "../../progress/stores/progressStore";
import { useUiStore } from "../../../shared/store/uiStore";
import { useUserStore } from "../../../shared/store/userStore";

// Context provides the same API but delegates to Zustand
// Components should migrate to Zustand directly
```

### Step 4: Update `rootReducer.ts`

Remove `progressReducer` from composition since progress is now managed by the Zustand store. If `rootReducer` still exists (transitional), it only composes user and ui (which also delegate to Zustand).

### Step 5: Update All Consumers

Hooks like `useProgressState`, `useProgressActions`, `useProgressDispatch` are updated to read from Zustand stores instead of Context. Components using these hooks work without changes.

- `useProgressState()` → `useProgressStore((s) => s)`
- `useProgressActions()` → direct store action calls
- `useUserIdentity()` → `useUserStore((s) => ({ identity: { userId: s.userId }, refresh: s.refresh }))`

## Architecture Integration

```
After this story:
  All 5 stores are Zustand:
    features/quiz/stores/quizSessionStore.ts
    features/vocabulary/stores/listStore.ts
    features/progress/stores/progressStore.ts
    shared/store/uiStore.ts
    shared/store/userStore.ts

  Context providers still exist (thin wrappers) — removed in Story 17.6
  No more .prelude.ts files
  No more progressReducer/rootReducer in quiz feature
```

## Technical Challenges & Solutions

```
Problem: ProgressContext provides the initial data-loading lifecycle (load from backend on mount)
Solution: Create a custom hook or store initializer that calls loadProgress() on first access.
Zustand stores can have async initialize actions that components call in useEffect.
```

## Testing Implementation

- Created `shared/store/__tests__/uiStore.test.ts` — 5 tests covering setLoading, setSelectedList, setError, reset, setInitialized
- Created `shared/store/__tests__/userStore.test.ts` — 4 tests covering setUserId, setPreferences, reset, refresh
- All tests use direct store API (`getState().action()`, `getState().state`) — no context wrapping
- Prelude tests kept for backward compat (reducer tests still pass)
- Full suite: **34 test files, 280 tests passed**
