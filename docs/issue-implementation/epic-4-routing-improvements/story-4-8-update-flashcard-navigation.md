# Implementation 4-8: Update Flashcard Navigation with Parameters

## Technical Scope

Update navigation to flashcard pages to use route parameters for dynamic data. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Status

- **Status**: Completed
- **PR**: story-4-8-update-flashcard-navigation
- **Merge Date**: September 6, 2025
- **Key Commit**: (Flashcard navigation refactor)

## Implementation Details

- Navigation to the flashcard page is updated to include the section ID as a route parameter.
- All navigation is now route-based, not state-based.
- Components that navigate to or from the flashcard page use React Router's `useNavigate` and `useParams`.
- The `FlashCard` component is fully migrated: all navigation (next/prev, sidebar, return to section) is context- and router-based, with no legacy state-driven navigation remaining.
- File-level comments in both `FlashCard.tsx` and `FlashCardPage.tsx` have been updated to clarify the new logic and context usage, following project conventions.
- JSDoc comments are added for documentation.
- Unit test files should be created or updated to match the new implementation.

## Architecture Integration

- Navigation logic is integrated into all relevant Mandarin subpages in `/pages`.
- Navigation uses React Router (`useNavigate`).
- Route parameters are extracted in the flashcard component.

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
- [Story 4-8: Update Flashcard Navigation with Parameters (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-8-update-flashcard-navigation.md)
