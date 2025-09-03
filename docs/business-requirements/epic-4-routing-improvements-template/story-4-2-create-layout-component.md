# Story 4.2: Create Layout Component with Outlet

## Story Summary

**Story Goal:** Create a layout component with an outlet for the Mandarin feature to maintain consistent UI elements across all subpages.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

With the implementation of nested routing, we need a layout component that contains common UI elements (like navigation) while allowing different subpages to be rendered in a designated area. This improves consistency and reduces code duplication.

## Implementation Plan

1. Create a new layout file `MandarinLayout.tsx` in `src/features/mandarin/layouts/`
2. Implement a layout component that includes the `MandarinProvider` and common UI elements
3. Use React Router's `Outlet` component to render nested routes
4. Update the router configuration to use this layout

## Technical Details

### Layout Component Structure

```tsx
import { Outlet } from "react-router-dom";
import { MandarinProvider } from "../context/MandarinContext";
import { Navbar } from "../components/Navbar";

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

### Router Configuration Update

```tsx
import { Route, Routes } from "react-router-dom";
import { MandarinLayout } from "../layouts/MandarinLayout";
import /* page components */ "../pages";

export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        {/* other routes */}
      </Route>
    </Routes>
  );
}
```

## Acceptance Criteria

- [ ] `MandarinLayout` component is created with common UI elements
- [ ] The layout uses React Router's `Outlet` component for nested routes
- [ ] The layout wraps all content with `MandarinProvider` for context access
- [ ] The router configuration is updated to use the layout
- [ ] UI elements are consistent across all subpages
- [ ] The layout is documented with JSDoc comments
- [ ] Unit tests are created for the layout
- [ ] All functionality works identically after refactoring

## Dependencies

- Story #4.1: Create Nested Route Structure
- Epic #3: State Management Refactor (for `MandarinProvider`)

## Related Issues

- Epic #4: Routing Improvements
