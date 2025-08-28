# Story 1: Create Nested Route Structure

## Story Summary

**Story Goal:** Create a nested routing structure for the Mandarin feature to replace the current state-based navigation approach.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current Mandarin feature uses a state variable (`currentPage`) to control which subpage is displayed. This approach has limitations regarding URL-based navigation and browser history support. By implementing proper nested routing:

- Users can navigate directly to subpages via URLs
- Browser back/forward buttons will work correctly
- Routes can include parameters for specific content
- The application structure will be more intuitive

## Acceptance Criteria

- [ ] Create a new router configuration file `MandarinRoutes.tsx` in `src/features/mandarin/router/`
- [ ] Define routes for each subpage of the Mandarin feature:
  - [ ] `/mandarin` (index route)
  - [ ] `/mandarin/vocabulary-list`
  - [ ] `/mandarin/daily-commitment`
  - [ ] `/mandarin/section-confirm`
  - [ ] `/mandarin/section-select`
  - [ ] `/mandarin/flashcards/:sectionId`
- [ ] Update the main router to include these nested routes
- [ ] Add appropriate route parameters for list IDs and section IDs
- [ ] Document the routing structure
- [ ] Create unit tests for the router
- [ ] Verify all routes are accessible directly via URLs

## Implementation Notes

The router configuration should be structured as follows:

```tsx
export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        <Route path="daily-commitment" element={<DailyCommitmentPage />} />
        <Route path="section-confirm" element={<SectionConfirmPage />} />
        <Route path="section-select" element={<SectionSelectPage />} />
        <Route path="flashcards/:sectionId" element={<FlashCardPage />} />
      </Route>
    </Routes>
  );
}
```

The main router should be updated to include these routes:

```tsx
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Root />}>
          <Route index element={<Home />} />
          <Route path="mandarin/*" element={<MandarinRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Estimated Time

- Development: 3 hours
- Testing: 2 hours
- Documentation: 1 hour
- Total: 6 hours

## Dependencies

- Epic #3: State Management Refactor (should be completed first)

## Related Issues

- Epic #4: Routing Improvements
