# Implementation 4-1: Create Nested Route Structure

## Technical Scope

Create a nested routing structure for the Mandarin feature to replace the current state-based navigation approach. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

```typescript
// src/features/mandarin/router/MandarinRoutes.tsx
import { Route, Routes, Navigate } from "react-router-dom";
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

## Architecture Integration

This routing structure integrates with the main app router and the Mandarin context provider. All subpages are now standalone route components under `/mandarin`.

## Technical Challenges & Solutions

Problem: State-based navigation limited direct URL access and browser history.
Solution: Refactored to use React Router nested routes and moved all subpages to `/pages` as standalone route components.

## Testing Implementation

Tested navigation to all subpages via direct URL and browser back/forward. Confirmed all features work as before.

## Acceptance Criteria

- [ ] Nested route structure is created for the Mandarin feature
- [ ] Routes are defined for all subpages
- [ ] Route parameters are used where appropriate
- [ ] Main router is updated to include the Mandarin routes
- [ ] Routes are properly typed
- [ ] Documentation is updated to reflect the new route structure
- [ ] Unit tests are created for the router
- [ ] All routes are accessible directly via URLs

## Dependencies

- Epic #3: State Management Refactor (should be completed first)

## Related Issues

- Epic #4: Routing Improvements
