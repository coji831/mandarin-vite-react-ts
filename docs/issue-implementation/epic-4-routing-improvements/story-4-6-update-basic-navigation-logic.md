# Story 4.6: Update Basic Navigation Logic

## Story Summary

**Story Goal:** Update basic navigation logic to use React Router's navigation instead of state changes.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation uses state changes (`setCurrentPage`) for navigation between subpages. This story focuses on updating basic navigation patterns (next/previous buttons, simple redirects) to use the router, which will enable proper browser history support and direct URL access.

## Acceptance Criteria

- [ ] Identify all basic navigation points in the application
- [ ] Replace `setCurrentPage` calls with `navigate` calls from React Router
- [ ] Update component props that pass navigation callbacks
- [ ] Document all navigation changes
- [ ] Create unit tests for updated navigation logic
- [ ] Verify all basic navigation works identically after refactoring

## Implementation Notes

Navigation should be updated like this:

```tsx
// Before
function handleNextClick() {
  setCurrentPage("dailycommitment");
}

// After
function handleNextClick() {
  navigate("/mandarin/daily-commitment");
}
```

Key updates:

- Import and use `useNavigate` hook
- Replace callback props with direct navigation
- Update any components that trigger navigation

## Estimated Time

- Development: 1.5 hours
- Testing: 1 hour
- Documentation: 30 minutes
- Total: 3 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Epic #3: State Management Refactor (for context)
