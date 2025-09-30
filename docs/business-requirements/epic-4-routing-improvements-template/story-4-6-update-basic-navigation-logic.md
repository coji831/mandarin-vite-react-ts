# Story 4.6: Update Basic Navigation Logic

## Description

**As a** developer,
**I want to** update basic navigation logic to use React Router's navigation instead of state changes,
**So that** browser history is supported and direct URL access is enabled.

## Business Value

Enables proper browser navigation and improves maintainability by using standard routing patterns.

## Acceptance Criteria

- [x] Identify all basic navigation points in the application
- [x] Replace `setCurrentPage` calls with `navigate` calls from React Router
- [x] Update component props that pass navigation callbacks
- [x] Document all navigation changes
- [x] Create unit tests for updated navigation logic
- [x] Verify all basic navigation works identically after refactoring

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. All navigation must use React Router, not state variables.

## Related Issues

- #4.1 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure.md) (Dependency)
- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Dependency)
- #4.3 / [**Convert Basic Pages**](./story-4-3-convert-basic-pages.md) (Dependency)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Completed
- **PR**: [Add PR number if available]
- **Merge Date**: [Add date if available]
- **Key Commit**: [Add commit hash if available] (Navigation logic refactor)

## User Journey [Optional]

As a user, I can use next/previous navigation and browser back/forward buttons, and the app always shows the correct Mandarin subpage.

## Dependencies

- Epic #4: Routing Improvements
