# Epic 4: Mandarin Feature Routing Improvements

## Technical Overview

This epic refactors the Mandarin feature to use proper nested routing instead of a single-page state-driven approach. The goal is to improve navigation, browser history support, and component organization by leveraging React Router and context-based state management.

## Epic Summary

**Epic Goal:** Refactor the Mandarin feature to use nested routing, enabling direct URL navigation, browser history integration, and improved code organization.

**Status:** In Progress  
**Last Update:** September 4, 2025

## Background

The current Mandarin feature uses a state variable (`currentPage`) to control which subpage is displayed. This limits direct navigation, browser history, and component organization. Refactoring to route-based navigation addresses these limitations and aligns with modern React best practices.

## Implementation Strategy

- Create a dedicated router configuration for the Mandarin feature.
- Set up nested routes for each subpage.
- Update navigation to use React Router instead of state changes.
- Create a layout component with an outlet for nested routes.
- Update URL paths to include list and section IDs where appropriate.
- Ensure browser navigation (back/forward) works correctly.

## Design Decisions & Tradeoffs

- **React Router v6** is used for nested routing, providing a clean and scalable structure.
- **Context-based state management** (from Epic 3) is retained for sharing state between routes.
- Deprecated state-driven navigation in favor of route-based navigation.
- Route parameters are used for dynamic subpages (e.g., flashcards by section).
- Tradeoff: Initial refactor requires updating many references and navigation logic, but results in maintainable, scalable code.

## Architecture Integration

- All subpages are implemented as dedicated route components in the `pages` directory.
- Navigation logic uses React Router (`useNavigate`, `<Navigate />`).
- Shared UI elements are managed via a layout component (`MandarinLayout`).
- Context hooks (`useMandarin`) provide state access across routes.

## Implementation Details

### Router Configuration

```tsx
// src/features/mandarin/router/MandarinRoutes.tsx
import { Route, Routes } from "react-router-dom";
import { MandarinLayout } from "../layouts/MandarinLayout";
import {
  VocabularyListPage,
  DailyCommitmentPage,
  SectionConfirmPage,
  SectionSelectPage,
  FlashCardPage,
} from "../pages";

export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<VocabularyListPage />} />
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

### Layout Component

```tsx
// src/features/mandarin/layouts/MandarinLayout.tsx
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

### Main App Router

```tsx
// src/router/Router.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Root } from "../layouts/Root";
import { Home } from "../pages/Home";
import { MandarinRoutes } from "../features/mandarin/router/MandarinRoutes";

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

## Testing & Verification

- Navigation and functionality for all new subpages are tested for robust routing and direct URL access.
- Unit tests and manual verification confirm that all features work identically to before the refactor.

## Known Issues & Limitations

- Route guards for invalid routes are not yet implemented.
- Loading states for route transitions are pending.
- Route parameters are not persisted in context for performance optimization.

## Results & Benefits

- Users can navigate directly to subpages via URLs.
- Browser back/forward buttons work as expected.
- Each subpage is its own component with clear responsibility.
- URL sharing and route parameters are supported.
- All features work identically to before the refactor.

## Lessons Learned

- Proper routing should be implemented from the start.
- State-based navigation has significant limitations.
- Context and routing work well together for complex features.

## Next Steps

- Add route guards for invalid routes.
- Implement loading states for route transitions.
- Persist route parameters in context for improved performance.

## References

- [Epic 4: Mandarin Feature Routing Improvements (Business Requirements)](../business-requirements/epic-4-routing-improvements-template/README.md)
- [Story 4-3: Convert Basic Pages](./story-4-3-convert-basic-pages.md)
- [Mandarin Feature Architecture](../../architecture.md)
- [React Router Documentation](https://reactrouter.com/)
- [Epic 3: State Management Refactor](../business-requirements/epic-3-state-management-refactor-template/README.md)
