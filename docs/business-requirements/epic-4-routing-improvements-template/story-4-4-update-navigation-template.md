# Story 4: Update Navigation Logic

## Story Summary

**Story Goal:** Update all navigation to use the router instead of state changes, ensuring browser history is properly maintained.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation uses state changes (`setCurrentPage`) for navigation between subpages. We need to update all navigation to use the router, which will enable proper browser history support and direct URL access.

## Acceptance Criteria

- [ ] Update all navigation to use `useNavigate` from React Router
- [ ] Replace all `setCurrentPage` calls with `navigate` calls
- [ ] Ensure browser back and forward buttons work correctly
- [ ] Add appropriate route parameters where needed
- [ ] Document all navigation changes
- [ ] Create unit tests for navigation logic
- [ ] Verify all navigation works identically after refactoring

## Implementation Notes

Navigation should be updated like this:

```tsx
// Before
function VocabularyListSelector({ onNext }) {
  const handleSelectList = (listName) => {
    setSelectedList(listName);
    onNext(); // This calls setCurrentPage("dailycommitment")
  };
}

// After
function VocabularyListSelector() {
  const navigate = useNavigate();
  const { setSelectedList } = useMandarin();

  const handleSelectList = (listName) => {
    setSelectedList(listName);
    navigate("/mandarin/daily-commitment");
  };
}
```

Key updates:

- Import and use `useNavigate` hook
- Replace callback props with direct navigation
- Use route parameters for dynamic navigation

## Estimated Time

- Development: 3 hours
- Testing: 2 hours
- Documentation: 1 hour
- Total: 6 hours

## Dependencies

- Story #1: Create Nested Route Structure
- Story #2: Create Layout Component with Outlet
- Story #3: Convert Subpages to Routes
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
