# Story 4.3: Convert Basic Pages

## Story Summary

**Story Goal:** Convert the vocabulary list and daily commitment subpages from state-based components to dedicated route components.

**Status:** Completed

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation renders vocabulary list selection and daily commitment pages conditionally based on a state variable. We need to convert these simpler subpages to dedicated components that render on specific routes. This will improve code organization and enable direct navigation.

## Acceptance Criteria

- [x] Create `VocabularyListPage.tsx` component
- [x] Create `DailyCommitmentPage.tsx` component
- [x] Move rendering logic from conditional statements in `Mandarin.tsx` to these components
- [x] Ensure both components use the `useMandarin` hook for state access
- [x] Connect components to their respective routes in the router configuration
- [x] Document components with JSDoc comments
- [ ] Create unit tests for both page components
- [x] Verify functionality works identically after refactoring

## Implementation Notes

The page components are implemented as dedicated route components using React Router and context hooks. Logic for fetching lists, handling selection, and navigation is handled within each component. UI and state management follow the patterns established in previous stories. See codebase for details.

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
