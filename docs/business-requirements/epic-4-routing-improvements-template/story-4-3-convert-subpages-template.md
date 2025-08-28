# Story 3: Convert Subpages to Routes

## Story Summary

**Story Goal:** Convert each subpage from a component rendered based on state to a dedicated route component.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders subpages conditionally based on a state variable. We need to convert each subpage to its own component that renders on a specific route. This will improve code organization and enable direct navigation.

## Acceptance Criteria

- [ ] Create dedicated page components for each subpage:
  - [ ] `VocabularyListPage.tsx`
  - [ ] `DailyCommitmentPage.tsx`
  - [ ] `SectionConfirmPage.tsx`
  - [ ] `SectionSelectPage.tsx`
  - [ ] `FlashCardPage.tsx`
- [ ] Each page component should:
  - [ ] Use the `useMandarin` hook for state access
  - [ ] Contain the logic specific to that page
  - [ ] Use the router for navigation
- [ ] Document all page components with JSDoc comments
- [ ] Create unit tests for all page components
- [ ] Verify all functionality works identically after refactoring

## Implementation Notes

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

Key updates:

- Replace `setCurrentPage` calls with `navigate` calls
- Use route parameters for dynamic content (e.g., sectionId)
- Get data and actions from context instead of props

## Estimated Time

- Development: 5 hours
- Testing: 3 hours
- Documentation: 2 hours
- Total: 10 hours

## Dependencies

- Story #1: Create Nested Route Structure
- Story #2: Create Layout Component with Outlet
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
