# Implementation 17-6: Provider Cleanup & Boundary Enforcement

## Technical Scope

**Files to modify:**

- `apps/frontend/src/shared/layouts/LearnLayout.tsx` — remove provider wrappers
- `apps/frontend/src/features/quiz/pages/QuizPage.tsx` — remove QuizProvider, use store directly
- `apps/frontend/src/features/quiz/index.ts` — remove context/reducer exports
- `apps/frontend/src/features/vocabulary/index.ts` — remove listReducer exports
- `apps/frontend/src/shared/store/index.ts` — ensure UI/user stores are exported
- `apps/frontend/eslint.config.js` — add no-restricted-imports rules
- `apps/frontend/src/features/quiz/context/index.ts` — remove context exports (or delete)

**Files to delete:**

- `apps/frontend/src/features/quiz/context/ProgressContext.tsx`
- `apps/frontend/src/features/quiz/context/UserIdentityContext.tsx`
- `apps/frontend/src/features/quiz/context/QuizContext.tsx`
- `apps/frontend/src/features/quiz/context/index.ts`
- `apps/frontend/src/features/quiz/context/__tests__/useProgressContext.test.tsx`
- `apps/frontend/src/features/quiz/reducers/rootReducer.ts`
- `apps/frontend/src/features/quiz/reducers/quizReducer.ts`
- `apps/frontend/src/features/quiz/reducers/progressReducer.ts` (if still present)
- `apps/frontend/src/features/quiz/reducers/uiReducer.ts` (if still present)
- `apps/frontend/src/features/quiz/reducers/userReducer.ts` (if still present)
- `apps/frontend/src/features/quiz/reducers/index.ts`
- `apps/frontend/src/features/vocabulary/reducers/listReducer.ts`
- `apps/frontend/src/features/vocabulary/reducers/index.ts`
- `apps/frontend/src/shared/store/uiStore.prelude.ts` (if still present)
- `apps/frontend/src/shared/store/userStore.prelude.ts` (if still present)

**Files to remove imports from (update barrel exports):**

- All feature `index.ts` files that re-export context/reducer items

## Implementation Details

### Step 1: Clean Up `LearnLayout.tsx`

```typescript
// Before:
function LearnLayout() {
  return (
    <UserIdentityProvider>
      <ProgressProvider>
        <div className="learn-layout">
          <nav>...</nav>
          <div className="learn-content"><Outlet /></div>
        </div>
      </ProgressProvider>
    </UserIdentityProvider>
  );
}

// After:
function LearnLayout() {
  return (
    <div className="learn-layout">
      <nav>...</nav>
      <div className="learn-content"><Outlet /></div>
    </div>
  );
}
```

### Step 2: Clean Up `QuizPage.tsx`

```typescript
// Before:
function QuizPage() {
  return (
    <QuizProvider>
      {/* Quiz content */}
    </QuizProvider>
  );
}

// After: No provider needed. Components use useQuizSessionStore() directly.
function QuizPage() {
  return (
    {/* Quiz content */}
  );
}
```

### Step 3: Add ESLint Rules

In `apps/frontend/eslint.config.js`, add/update the `no-restricted-imports` rule:

```javascript
"no-restricted-imports": [
  "error",
  {
    patterns: [
      // Existing: prevent direct internal imports (must use barrel)
      {
        group: [
          "**/features/*/components/**",
          "**/features/*/hooks/**",
          "**/features/*/services/**",
          "**/features/*/types/**",
          "**/features/*/utils/**",
          "**/features/*/context/**",
          "**/features/*/reducers/**",
        ],
        message: "Import from the feature's barrel (index.ts) instead of internal paths.",
      },
      // NEW: prevent cross-feature store imports
      {
        group: ["**/features/*/stores/**"],
        message: "Cross-feature store imports are forbidden. Import from the feature's barrel (index.ts) instead.",
      },
      // NEW: prevent direct shared/store imports (use barrel)
      {
        group: ["**/shared/store/**"],
        message: "Import from shared/store/index.ts instead of internal paths.",
      },
    ],
  },
],
```

### Step 4: Delete Context and Reducer Files

After confirming no remaining imports reference these files:

- Delete all context files listed above
- Delete all reducer files listed above
- Update barrel exports

### Step 5: Update Barrel Exports

- `features/quiz/index.ts`: Remove context/reducer/reducer-type exports
- `features/vocabulary/index.ts`: Remove `listsReducer`, `listsInitialState`, `ListAction` exports
- `shared/store/index.ts`: Ensure `uiStore` and `userStore` hooks/types are exported

## Architecture Integration

```
Before — Provider-heavy tree:
  LearnLayout
    → UserIdentityProvider (context)
      → ProgressProvider (context + rootReducer + useReducer)
        → <Outlet />
          → QuizPage
            → QuizProvider (context + quizReducer + useReducer)
              → Quiz components using useQuizState/useQuizActions

After — Flat tree:
  LearnLayout
    → <Outlet />
      → QuizPage
        → Quiz components using useQuizSessionStore() directly
```

## Technical Challenges & Solutions

### Challenge 1: QuizContext Deletion — Replacing Provider Logic

**Problem:** `QuizContext.tsx` contained both the `QuizProvider` wrapper component AND the `useQuizState`/`useQuizActions` hooks used by `ExamLayout` and `ResultsLayout`. Simply deleting the file would break these components.

**Root Cause:** The provider did more than just provide context — it initialized `useQuizSession`, `useAnswerSubmission`, and `useSessionSummary` hooks, created action handlers, and managed the `sessionStarted` ref guard and the LOADING→RESULTS transition effect.

**Solution:** Created `features/quiz/hooks/useQuizEngine.ts` — a dedicated initialization hook that QuizPage calls instead of wrapping in `QuizProvider`. The engine handles: (1) startSession on mount with ref guard, (2) retry via `resetSession()` → effect detects LOADING phase → calls `startSession()`, (3) LOADING→RESULTS transition when all questions answered. Exported `quizRetry` module-level object so `ResultsLayout` and `ErrorScreen` can trigger retries without context.

`ExamLayout` was refactored to read from `useQuizSessionStore` directly and create its own `useAnswerSubmission` hook. `ResultsLayout` reads from the store directly and creates its own `useSessionSummary` hook.

**Lesson:** When deleting a context provider, ensure all initialization side effects are preserved elsewhere.

### Challenge 2: Test Files Referencing Deleted Context

**Problem:** Tests in `VocabularyCard.test.tsx`, `Sidebar.test.tsx`, and `FlashCardPage.test.tsx` used `ProgressStateContext.Provider` to inject mock state. Deleting `ProgressContext.tsx` broke these tests.

**Root Cause:** The existing test pattern relied on React Context for dependency injection, which is no longer available.

**Solution:** Mocked `useProgressState` hook via `vi.mock` in each test file. The mock returns a function that applies the selector to a controlled mock state, preserving the same test assertions without the context wrapper.

**Lesson:** Tests that depend on deleted context files need to switch to mocking the consuming hooks instead.

## Testing Implementation

- Updated `VocabularyCard.test.tsx`, `Sidebar.test.tsx`, `FlashCardPage.test.tsx` to mock `useProgressState` instead of using `ProgressStateContext.Provider`
- Deleted `useProgressContext.test.tsx` (tested deleted context file)
- Deleted `quizReducer.test.ts` and `progressReducer.test.ts` (tested deleted reducer files)
- Deleted `uiStore.prelude.test.ts` and `userStore.prelude.test.ts` (tested deleted prelude files)
- All other store tests (Zustand) remain unchanged and pass
- **Final test results: 29 test files, 259 tests — all passing**
