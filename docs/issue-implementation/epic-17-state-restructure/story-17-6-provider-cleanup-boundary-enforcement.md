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

```
Problem: Components may still reference deleted context exports
Solution: Do a comprehensive grep for all context/reducer imports before deleting files.
Update or remove each reference. Run full test suite to catch any missed references.
```

## Testing Implementation

- Update tests that mocked Context providers to mock Zustand stores instead
- Remove tests for deleted context/reducer files
- Verify all store tests pass
