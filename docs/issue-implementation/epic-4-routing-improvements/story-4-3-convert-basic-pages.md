# Implementation 4-3: Convert Basic Pages

## Story Summary

**Goal:** Convert the vocabulary list and daily commitment subpages from state-based components to dedicated route components.

**Status:** Completed  
**Epic:** Epic 4: Routing Improvements

## Background

Previously, vocabulary list selection and daily commitment pages were rendered conditionally based on a state variable in `Mandarin.tsx`. This limited direct navigation and browser history support. Refactoring these to dedicated route components improves code organization and enables direct navigation.

## Implementation Details

### VocabularyListPage Example

```tsx
/**
 * VocabularyListPage
 * Dedicated subpage for selecting a vocabulary list and previewing sample words.
 * Uses MandarinContext for state and navigation.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMandarinContext } from "../context/useMandarinContext";
import type { VocabularyList, Word } from "../types";

export function VocabularyListPage() {
  const { selectVocabularyList } = useMandarinContext();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [samples, setSamples] = useState<Record<string, Word[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // ...fetch lists logic...
  }, []);

  useEffect(() => {
    // ...fetch samples logic...
  }, [lists]);

  const handleSelect = async (list: VocabularyList) => {
    // ...fetch words logic...
    selectVocabularyList(list.name, uniqueWords);
    navigate("/mandarin/daily-commitment");
  };

  // ...render logic...
}
```

### DailyCommitmentPage Example

```tsx
/**
 * DailyCommitmentPage
 * Renders the daily commitment page as a dedicated route component.
 * Uses the useMandarinContext hook for state access.
 */
import React from "react";
import { useMandarinContext } from "../context/useMandarinContext";
import { useNavigate } from "react-router-dom";

export function DailyCommitmentPage() {
  const {
    selectedList,
    selectedWords,
    inputValue,
    setInputValue,
    dailyWordCount,
    saveCommitment,
    loading,
    error,
  } = useMandarinContext();
  const navigate = useNavigate();

  // ...logic for recommended range, validation, etc...

  const handleConfirm = () => {
    saveCommitment(inputNum);
    navigate("../next-section"); // Update route as needed
  };

  // ...render logic...
}
```

### Unit Test Example

> **Note:** Unit test files for these pages should be created or updated to match the latest implementation. See `src/features/mandarin/pages/VocabularyListPage.tsx` and `DailyCommitmentPage.tsx` for logic to cover.

## Architecture Integration

- Both pages use the `useMandarin` hook for state access.
- Integrated into the router configuration as dedicated routes.
- Navigation uses React Router (`useNavigate`).
- Pages are documented with JSDoc comments.
- Relationship diagram:

```
MandarinRoutes
  └─ MandarinLayout
      ├─ VocabularyListPage
      └─ DailyCommitmentPage
```

## Technical Challenges & Solutions

**Challenge:** Migrating from state-based navigation to route-based navigation required refactoring component logic and updating references throughout the codebase.

**Solution:**

- Used React Router's `useNavigate` and `<Navigate />` for all navigation.
- Updated imports/exports to reflect new page locations.
- Deprecated legacy state-driven patterns.

**Code Snippet:**

```tsx
// Old pattern in Mandarin.tsx
if (currentPage === "vocabularyList") {
  return <VocabularyListSelector />;
}

// New pattern
<Route path="vocabulary-list" element={<VocabularyListPage />} />;
```

## Testing & Verification

- Manual verification of navigation and functionality.
- Ensured identical behavior after refactoring.
- Unit tests should be added or updated to match the new implementation.

## References

- [Epic 4: Mandarin Feature Routing Improvements](../epic-4-routing-improvements)
- [Mandarin Feature Architecture](../../architecture.md)
- [React Router Documentation](https://reactrouter.com/)
- [Story 4-3: Convert Basic Pages (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-3-convert-basic-pages.md)
