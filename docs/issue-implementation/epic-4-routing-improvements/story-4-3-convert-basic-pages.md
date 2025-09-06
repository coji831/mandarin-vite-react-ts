# Implementation 4-3: Convert Basic Pages

## Technical Scope

Convert the vocabulary list and daily commitment subpages from state-based components to dedicated route components. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

- `VocabularyListPage.tsx` and `DailyCommitmentPage.tsx` are implemented as standalone route components in `/pages`.
- Logic for list selection, daily commitment, and navigation is handled within each component using the `useMandarin` hook and React Router's `useNavigate`.
- All navigation is now route-based, not state-based.
- JSDoc comments are added to each page for documentation.
- Unit test files should be created or updated to match the new implementation.

## Architecture Integration

- Both pages use the `useMandarin` hook for state access.
- Integrated into the router configuration as dedicated routes.
- Navigation uses React Router (`useNavigate`).
- Pages are documented with JSDoc comments.

```
MandarinRoutes
  └─ MandarinLayout
      ├─ VocabularyListPage
      └─ DailyCommitmentPage
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
- [Story 4-3: Convert Basic Pages (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-3-convert-basic-pages.md)
