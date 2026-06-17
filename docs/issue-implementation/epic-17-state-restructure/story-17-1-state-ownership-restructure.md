# Implementation 17-1: State Ownership Restructure

## Technical Scope

**Files to create:**

- `apps/frontend/src/shared/store/uiStore.prelude.ts` — moved from `features/quiz/reducers/uiReducer.ts`
- `apps/frontend/src/shared/store/userStore.prelude.ts` — moved from `features/quiz/reducers/userReducer.ts`
- `apps/frontend/src/shared/store/index.ts` — barrel export

**Files to modify:**

- `apps/frontend/src/features/quiz/reducers/rootReducer.ts` — remove `listReducer`, `vocabLists` slice, simplify `RootState`
- `apps/frontend/src/features/quiz/context/ProgressContext.tsx` — update imports, state shape
- `apps/frontend/src/features/quiz/index.ts` — remove uiReducer/userReducer exports, add re-exports from shared
- `apps/frontend/src/features/vocabulary/index.ts` — ensure `listReducer` is exported if needed by external consumers
- `apps/frontend/src/features/quiz/hooks/useProgressActions.ts` — update UI action imports if needed
- `apps/frontend/src/features/quiz/hooks/useProgressState.ts` — update RootState references
- `apps/frontend/src/features/quiz/hooks/useProgressDispatch.ts` — verify imports
- All test files importing `uiReducer`, `userReducer`, or `RootState` from quiz feature

**Files to delete:**

- `apps/frontend/src/features/quiz/reducers/uiReducer.ts` (moved)
- `apps/frontend/src/features/quiz/reducers/userReducer.ts` (moved)

## Implementation Details

### Step 1: Create `shared/store/` directory with prelude files

```typescript
// shared/store/uiStore.prelude.ts
// PRELUDE — temporary file before Zustand migration (Story 17.5)
// Same content as original features/quiz/reducers/uiReducer.ts

export type UiState = {
  isLoading: boolean;
  lastUpdated: string | null;
  selectedList: string | null;
  selectedWords: WordBasic[];
  error: string | undefined;
  initialized: boolean;
};

export const uiInitialState: UiState = {
  isLoading: false,
  lastUpdated: null,
  selectedList: null,
  selectedWords: [],
  error: undefined,
  initialized: false,
};

export type UiAction =
  | { type: "UI/SET_LOADING"; payload: { isLoading: boolean } }
  | { type: "UI/SET_UPDATED"; payload: { lastUpdated: string } }
  | { type: "UI/SET_SELECTED_LIST"; payload: { listId: string | null } }
  | { type: "UI/SET_SELECTED_WORDS"; payload: { words: WordBasic[] } }
  | { type: "UI/SET_ERROR"; payload: { error?: string } }
  | { type: "UI/SET_INITIALIZED"; payload: { initialized: boolean } };

export function uiReducer(state: UiState = uiInitialState, action: UiAction): UiState {
  switch (action.type) {
    case "UI/SET_LOADING":
      return { ...state, isLoading: action.payload.isLoading };
    case "UI/SET_UPDATED":
      return { ...state, lastUpdated: action.payload.lastUpdated };
    case "UI/SET_SELECTED_LIST":
      return { ...state, selectedList: action.payload.listId };
    case "UI/SET_SELECTED_WORDS":
      return { ...state, selectedWords: action.payload.words };
    case "UI/SET_ERROR":
      return { ...state, error: action.payload.error };
    case "UI/SET_INITIALIZED":
      return { ...state, initialized: action.payload.initialized };
    default:
      return state;
  }
}
```

### Step 2: Simplify `rootReducer.ts`

```typescript
// After: only composes progress + user + ui (vocabLists removed)
import { ProgressAction, progressInitialState, progressReducer } from "./progressReducer";
import { ProgressState } from "../types";
import { UiAction, uiInitialState, uiReducer } from "../../../shared/store/uiStore.prelude";
import { UiState } from "../../../shared/store/uiStore.prelude";
import {
  UserAction,
  userInitialState,
  userReducer,
  UserState,
} from "../../../shared/store/userStore.prelude";

export type RootAction = ProgressAction | UserAction | UiAction;

export type RootState = {
  progress: ProgressState;
  user: UserState;
  ui: UiState;
};

export const initialState: RootState = {
  progress: progressInitialState,
  user: userInitialState,
  ui: uiInitialState,
};

export function rootReducer(state: RootState = initialState, action: RootAction): RootState {
  return {
    progress: progressReducer(state.progress, action as ProgressAction),
    user: userReducer(state.user, action as UserAction),
    ui: uiReducer(state.ui, action as UiAction),
  };
}
```

### Step 3: Update `ProgressContext.tsx`

Update imports to use `shared/store/` barrel. Remove `ListAction` from `RootAction` union. Remove `vocabLists` from `RootState`.

### Step 4: Handle vocabulary state consumers

Any component/hook that previously read `vocabLists` from `ProgressContext` must now get vocabulary state directly from the vocabulary feature. Since `listReducer` is currently a placeholder (only `INIT`/`RESET` actions returning state unchanged), this is safe — no real data flow is disrupted.

### Step 5: Update barrel exports

- `features/quiz/index.ts`: Remove `uiReducer`, `uiInitialState`, `userReducer`, `userInitialState` exports. Add re-exports from `shared/store/` if needed.
- `shared/store/index.ts`: Export all four items (`uiReducer`, `uiInitialState`, `userReducer`, `userInitialState`) plus their types.

## Architecture Integration

```
Before:
  features/quiz/reducers/
    rootReducer.ts (composes 4 slices: vocabLists + progress + user + ui)
    uiReducer.ts    ← quiz owns UI state
    userReducer.ts  ← quiz owns user state

After:
  shared/store/
    uiStore.prelude.ts  ← neutral home for UI state
    userStore.prelude.ts ← neutral home for user state
    index.ts            ← barrel export
  features/quiz/reducers/
    rootReducer.ts (simplified: 3 slices: progress + user + ui)
    (vocabLists slice removed — vocabulary owns its state)
```

## Technical Challenges & Solutions

### Challenge 1: Test Mock States Referencing `vocabLists`

**Problem:** Four test files across quiz, vocabulary, and pages features constructed mock `RootState` objects containing a `vocabLists` property. After removing `vocabLists` from `RootState`, these tests failed TypeScript compilation.

**Root Cause:** The mock states were written to match the old 4-slice `RootState` shape. The type definition change propagated to all consumers constructing `RootState` values.

**Solution:** Removed `vocabLists: { itemsById: {}, itemIds: [] }` from mock state objects in all four test files. Since no component logic actually read from `vocabLists` in these tests, no behavioral changes were needed — only type-level fixes.

**Files affected:**

- `features/quiz/context/__tests__/useProgressContext.test.tsx` — also removed unused `AppUserState` import
- `pages/__tests__/FlashCardPage.test.tsx`
- `features/vocabulary/components/__tests__/VocabularyCard.test.tsx`
- `features/vocabulary/components/__tests__/Sidebar.test.tsx` (two mock states)

**Lesson:** When refactoring state shapes, always run `tsc --noEmit` first to catch all consumer type mismatches before test execution.

### Challenge 2: Shared Import Path Resolution

**Problem:** Moving `uiReducer.ts` to `shared/store/uiStore.prelude.ts` required updating its relative import path for `WordBasic` and `UiState` types, since the file moved from `features/quiz/reducers/` to `shared/store/`.

**Root Cause:** The original file imported types from sibling modules using relative paths (`../types`, `../../vocabulary/types/Word`). After relocation, these paths no longer resolved.

**Solution:** Updated import paths to:

- `../../features/vocabulary/types/Word` (was `../../vocabulary/types/Word`)
- `../../features/quiz/types` (was `../types`)

The `userStore.prelude.ts` required no import changes since `UserState` is defined inline.

## Testing Implementation

- **Test files moved:** `uiReducer.test.ts` → `shared/store/__tests__/uiStore.prelude.test.ts`, `userReducer.test.ts` → `shared/store/__tests__/userStore.prelude.test.ts`
- **Test imports updated:** Both test files updated to import from `../uiStore.prelude` and `../userStore.prelude` respectively
- **Mock state cleanup:** `vocabLists` property removed from 4 test files (5 mock state objects)
- **Verification results:**
  - 30/30 test files passed
  - 255/255 tests passed
  - `tsc --noEmit`: zero type errors
- **No test logic changed** — only import paths and mock state shapes updated
