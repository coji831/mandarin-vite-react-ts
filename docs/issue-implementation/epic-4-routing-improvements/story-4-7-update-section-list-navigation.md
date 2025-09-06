# Implementation 4-7: Update Section/List Selection Navigation

## Technical Scope

Update navigation logic for vocabulary list and section selection to use React Router. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

- Navigation in `VocabularyListSelector`, `SectionSelect`, and `SectionConfirm` components is updated to use React Router's `useNavigate` instead of state changes.
- Callback props for navigation are replaced with direct navigation calls.
- All navigation is now route-based, not state-based.
- JSDoc comments are added for documentation.
- Unit test files should be created or updated to match the new implementation.

## Architecture Integration

- Navigation logic is integrated into all relevant Mandarin subpages in `/pages`.
- Navigation uses React Router (`useNavigate`).

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
- [Story 4-7: Update Section/List Selection Navigation (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-7-update-section-list-navigation.md)
