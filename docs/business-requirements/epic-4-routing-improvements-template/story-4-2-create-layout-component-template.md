# Story 2: Create Layout Component with Outlet

## Story Summary

**Story Goal:** Create a layout component with an outlet for the Mandarin feature to maintain consistent UI elements across all subpages.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

With the implementation of nested routing, we need a layout component that contains common UI elements (like navigation) while allowing different subpages to be rendered in a designated area. This improves consistency and reduces code duplication.

## Acceptance Criteria

- [ ] Create a new layout file `MandarinLayout.tsx` in `src/features/mandarin/layouts/`
- [ ] Implement a layout component that includes:
  - [ ] `MandarinProvider` for context access
  - [ ] Common UI elements (navbar, sidebar, etc.)
  - [ ] React Router's `Outlet` component for nested routes
- [ ] Update the router configuration to use this layout
- [ ] Document the layout with JSDoc comments
- [ ] Create unit tests for the layout
- [ ] Verify UI elements are consistent across all subpages
- [ ] Verify all functionality works identically after refactoring

## Implementation Notes

The layout component should be structured as follows:

```tsx
export function MandarinLayout() {
  return (
    <MandarinProvider>
      <div className="mandarin-container">
        <Navbar />
        <div className="mandarin-content">
          <Outlet />
        </div>
      </div>
    </MandarinProvider>
  );
}
```

The router configuration should be updated to use this layout:

```tsx
export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        {/* other routes */}
      </Route>
    </Routes>
  );
}
```

## Estimated Time

- Development: 2 hours
- Testing: 1 hour
- Documentation: 1 hour
- Total: 4 hours

## Dependencies

- Story #1: Create Nested Route Structure
- Epic #3: State Management Refactor (for `MandarinProvider`)

## Related Issues

- Epic #4: Routing Improvements
