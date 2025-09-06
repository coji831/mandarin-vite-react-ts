# Implementation 4-5: Convert Flashcard Page with Parameters

## Technical Scope

Convert the flashcard subpage to a dedicated route component that uses route parameters for dynamic data. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

- `FlashCardPage.tsx` is implemented as a standalone route component in `/pages`.
- The component uses the `useParams` hook to extract the `sectionId` parameter and the `useMandarin` hook for state access.
- All navigation is now route-based, not state-based.
- JSDoc comments are added for documentation.
- Unit test files should be created or updated to match the new implementation.

## Architecture Integration

- The page uses the `useMandarin` hook for state access.
- Integrated into the router configuration as a dedicated route.
- Navigation uses React Router (`useNavigate`).
- Page is documented with JSDoc comments.

```
MandarinRoutes
  └─ MandarinLayout
      └─ FlashCardPage
```

## Technical Challenges & Solutions

**Challenge:** Migrating from state-based navigation to route-based navigation required refactoring component logic and updating references throughout the codebase.

**Solution:**

- Used React Router's `useNavigate` and `<Navigate />` for all navigation.
- Updated imports/exports to reflect new page locations.
- Deprecated legacy state-driven patterns.

## Testing Implementation

- Manual verification of navigation and functionality.
- Ensured identical behavior after refactoring.
- Unit tests should be added or updated to match the new implementation.

## References

- [Epic 4: Mandarin Feature Routing Improvements](../epic-4-routing-improvements)
- [Mandarin Feature Architecture](../../architecture.md)
- [React Router Documentation](https://reactrouter.com/)
- [Story 4-5: Convert Flashcard Page (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-5-convert-flashcard-page.md)
