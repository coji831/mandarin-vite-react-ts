# Story 4.1: Create Nested Route Structure

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

## Implementation Plan

1. Create a new router configuration file `MandarinRoutes.tsx` in `src/features/mandarin/router/`
2. Define routes for each subpage of the Mandarin feature
3. Update the main router to include these nested routes
4. Add appropriate route parameters for list IDs and section IDs
5. Ensure all routes are properly typed

## Technical Details

### Route Structure

The Mandarin feature should have the following routes:

- `/mandarin` (index route) - redirects to vocabulary list
- `/mandarin/vocabulary-list` - vocabulary list selection
- `/mandarin/daily-commitment` - set daily commitment
- `/mandarin/section-confirm` - confirm sections
- `/mandarin/section-select` - select section for learning
- `/mandarin/flashcards/:sectionId` - flashcard page for a specific section

### Router Configuration

```tsx
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

### Main Router Update

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
