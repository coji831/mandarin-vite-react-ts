# Story 4.3: Convert Basic Pages

## Story Summary

**Story Goal:** Convert the vocabulary list and daily commitment subpages from state-based components to dedicated route components.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders vocabulary list selection and daily commitment pages conditionally based on a state variable. We need to convert these simpler subpages to dedicated components that render on specific routes. This will improve code organization and enable direct navigation.

## Acceptance Criteria

- [ ] Create `VocabularyListPage.tsx` component
- [ ] Create `DailyCommitmentPage.tsx` component
- [ ] Move rendering logic from conditional statements in `Mandarin.tsx` to these components
- [ ] Ensure both components use the `useMandarin` hook for state access
- [ ] Connect components to their respective routes in the router configuration
- [ ] Document components with JSDoc comments
- [ ] Create unit tests for both page components
- [ ] Verify functionality works identically after refactoring

## Implementation Notes

The page components should follow this pattern:

```tsx
// Example: src/features/mandarin/pages/VocabularyListPage.tsx
import { useNavigate } from "react-router-dom";
import { useMandarin } from "../context/MandarinContext";
import { VocabularyListSelector } from "../components/VocabularyListSelector";

export function VocabularyListPage() {
  const navigate = useNavigate();
  const { setSelectedList } = useMandarin();

  // Component logic here

  return <VocabularyListSelector />;
}
```

## Estimated Time

- Development: 2 hours
- Testing: 1 hour
- Documentation: 30 minutes
- Total: 3.5 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
