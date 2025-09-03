# Story 4.4: Convert Section Management Pages

## Story Summary

**Story Goal:** Convert the section confirmation and section selection subpages from state-based components to dedicated route components.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders section management pages conditionally based on a state variable. These pages handle section confirmation and section selection, which are more complex interactions with state. Converting them to dedicated route components will improve code organization and enable direct navigation.

## Acceptance Criteria

- [ ] Create `SectionConfirmPage.tsx` component
- [ ] Create `SectionSelectPage.tsx` component
- [ ] Move rendering logic from conditional statements in `Mandarin.tsx` to these components
- [ ] Ensure both components use the `useMandarin` hook for state access
- [ ] Connect components to their respective routes in the router configuration
- [ ] Document components with JSDoc comments
- [ ] Create unit tests for both page components
- [ ] Verify functionality works identically after refactoring

## Implementation Notes

The page components should follow this pattern:

```tsx
// Example: src/features/mandarin/pages/SectionSelectPage.tsx
import { useNavigate } from "react-router-dom";
import { useMandarin } from "../context/MandarinContext";
import { SectionSelect } from "../components/SectionSelect";

export function SectionSelectPage() {
  const navigate = useNavigate();
  const { sections, setSelectedSectionId } = useMandarin();

  // Component logic here

  return <SectionSelect />;
}
```

## Estimated Time

- Development: 2.5 hours
- Testing: 1.5 hours
- Documentation: 30 minutes
- Total: 4.5 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
