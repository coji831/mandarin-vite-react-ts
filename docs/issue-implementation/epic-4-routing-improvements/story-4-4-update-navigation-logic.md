# Story 4.4: Update Navigation Logic

## Story Summary

**Story Goal:** Update all navigation to use the router instead of state changes, ensuring browser history is properly maintained.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation uses state changes (`setCurrentPage`) for navigation between subpages. We need to update all navigation to use the router, which will enable proper browser history support and direct URL access.

## Implementation Plan

1. Identify all navigation points in the application (buttons, links, callbacks)
2. Replace `setCurrentPage` calls with `navigate` calls from React Router
3. Update any components that trigger navigation to use the router
4. Add appropriate route parameters for dynamic navigation
5. Test all navigation paths to ensure they work correctly

## Technical Details

### Navigation Updates

For each navigation action, we'll update it like this:

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

### Component Updates

Components that previously received navigation callbacks will now handle navigation directly:

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

### Route Parameters

For navigation that needs to pass data, we'll use route parameters:

```tsx
// Before
function handleSectionSelect(sectionId) {
  setSelectedSectionId(sectionId);
  setCurrentPage("flashcards");
}

// After
function handleSectionSelect(sectionId) {
  navigate(`/mandarin/flashcards/${sectionId}`);
}
```

## Acceptance Criteria

- [ ] All navigation uses `useNavigate` from React Router
- [ ] No `setCurrentPage` calls remain in the codebase
- [ ] Browser back and forward buttons work correctly for all navigation paths
- [ ] Route parameters are used where needed for dynamic navigation
- [ ] All navigation works identically to before refactoring
- [ ] Direct URL access works for all routes
- [ ] Unit tests are updated to account for router-based navigation

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Epic #3: State Management Refactor (for context)

## Related Issues

- Epic #4: Routing Improvements
