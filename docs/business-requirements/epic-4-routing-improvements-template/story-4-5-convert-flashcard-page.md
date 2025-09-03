# Story 4.5: Convert Flashcard Page with Parameters

## Story Summary

**Story Goal:** Convert the flashcard subpage to a dedicated route component that uses route parameters for dynamic data.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders the flashcard page conditionally based on a state variable. This page requires dynamic data (section ID) that should be passed via route parameters rather than state. Converting it to use route parameters will enable direct navigation to specific sections via URL.

## Acceptance Criteria

- [ ] Create `FlashCardPage.tsx` component
- [ ] Implement route parameter handling for `sectionId`
- [ ] Move rendering logic from conditional statements in `Mandarin.tsx` to this component
- [ ] Ensure the component uses the `useMandarin` hook for state access
- [ ] Use `useParams` hook to extract and validate the `sectionId` parameter
- [ ] Connect component to its route in the router configuration
- [ ] Document component with JSDoc comments
- [ ] Create unit tests for the page component
- [ ] Verify functionality works identically after refactoring
- [ ] Test direct URL access with different section IDs

## Implementation Notes

The flashcard page component should follow this pattern:

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

## Estimated Time

- Development: 3 hours
- Testing: 2 hours
- Documentation: 30 minutes
- Total: 5.5 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Story #4.4: Convert Section Management Pages
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
