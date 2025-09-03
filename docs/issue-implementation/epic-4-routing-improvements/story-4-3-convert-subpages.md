# Story 4.3: Convert Basic Pages

## Story Summary

**Story Goal:** Convert each subpage from a component rendered based on state to a dedicated route component.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders subpages conditionally based on a state variable. We need to convert each subpage to its own component that renders on a specific route. This will improve code organization and enable direct navigation.

## Implementation Plan

1. Create dedicated page components for each subpage:

   - `VocabularyListPage.tsx`
   - `DailyCommitmentPage.tsx`
   - `SectionConfirmPage.tsx`
   - `SectionSelectPage.tsx`
   - `FlashCardPage.tsx`

2. Move the rendering logic from the conditional statements in `Mandarin.tsx` to these dedicated components

3. Update each component to:

   - Use the `useMandarin` hook for state access
   - Contain the logic specific to that page
   - Use the router for navigation

4. Update the router configuration to reference these new components

## Technical Details

### Page Components

Each page component should follow this pattern:

```tsx
// Example: src/features/mandarin/pages/VocabularyListPage.tsx
import { useNavigate } from "react-router-dom";
import { useMandarin } from "../context/MandarinContext";
import { VocabularyListSelector } from "../components/VocabularyListSelector";

export function VocabularyListPage() {
  const navigate = useNavigate();
  const { setSelectedList } = useMandarin();

  const handleSelectList = (listName: string) => {
    setSelectedList(listName);
    navigate("/mandarin/daily-commitment");
  };

  return <VocabularyListSelector onSelectList={handleSelectList} />;
}
```

### Route Parameters

For pages that need dynamic data, use route parameters:

```tsx
// src/features/mandarin/pages/FlashCardPage.tsx
import { useParams } from "react-router-dom";
import { useMandarin } from "../context/MandarinContext";
import { FlashCard } from "../components/FlashCard";

export function FlashCardPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { sections, selectSection } = useMandarin();

  useEffect(() => {
    if (sectionId) {
      selectSection(sectionId);
    }
  }, [sectionId, selectSection]);

  return <FlashCard />;
}
```

## Acceptance Criteria

- [ ] Dedicated page components are created for all subpages
- [ ] Each page component uses the `useMandarin` hook for state access
- [ ] Navigation uses the router instead of state changes
- [ ] Route parameters are used where appropriate
- [ ] All components are documented with JSDoc comments
- [ ] Unit tests are created for all page components
- [ ] All functionality works identically after refactoring

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
