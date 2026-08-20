# Story 4.1: Create Nested Route Structure

## Description

**As a** developer,
**I want to** create a nested routing structure for the Mandarin feature to replace the current state-based navigation approach,
**So that** users can navigate directly to subpages, browser history works, and the application structure is more intuitive.

## Business Value

Enables direct URL navigation, improves browser history support, and makes the application structure more maintainable and user-friendly.

## Acceptance Criteria

- [x] Create a new router configuration file `MandarinRoutes.tsx` in `src/features/mandarin/router/`
- [x] Define routes for each subpage of the Mandarin feature
- [x] Update the main router to include these nested routes
- [x] Add appropriate route parameters for list IDs and section IDs
- [x] Ensure all routes are properly typed
- [ ] Nested route structure is created for the Mandarin feature
- [ ] Routes are defined for all subpages
- [ ] Route parameters are used where appropriate
- [ ] Main router is updated to include the Mandarin routes
- [ ] Routes are properly typed
- [ ] Documentation is updated to reflect the new route structure
- [ ] Unit tests are created for the router
- [ ] All routes are accessible directly via URLs

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. All navigation must use React Router, not state variables.
3. Route parameters must be used for dynamic subpages.

## Related Issues

- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Next step)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Completed
- **PR**: [Add PR number if available]
- **Merge Date**: [Add date if available]
- **Key Commit**: [Add commit hash if available] (Initial nested routing implementation)

## User Journey [Optional]

As a user, I can navigate directly to `/mandarin/vocabulary-list`, `/mandarin/daily-commitment`, `/mandarin/section-confirm`, `/mandarin/section-select`, and `/mandarin/flashcards/:sectionId` and see the correct subpage rendered, with browser navigation working as expected.

## Dependencies

- Epic #3: State Management Refactor (should be completed first)
