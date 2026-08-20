# Story 4.7: Update Section/List Selection Navigation

## Description

**As a** developer,
**I want to** update navigation logic for vocabulary list and section selection to use React Router,
**So that** state and history are maintained correctly and navigation is more robust.

## Business Value

Ensures that selection-based navigation is reliable, maintainable, and supports browser history.

## Acceptance Criteria

- [x] Update navigation in `VocabularyListSelector` component
- [x] Update navigation in `SectionSelect` component
- [x] Update navigation in `SectionConfirm` component
- [x] Replace all relevant `setCurrentPage` calls with `navigate` calls
- [x] Ensure state updates (like `setSelectedList`) still occur before navigation
- [x] Document all navigation changes
- [x] Create unit tests for updated navigation logic
- [x] Verify all selection-based navigation works identically after refactoring

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
- **Key Commit**: [Add commit hash if available] (Section/list navigation refactor)

## User Journey [Optional]

As a user, I can select a vocabulary list or section and be navigated to the correct subpage, with browser navigation working as expected.

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Story #4.4: Convert Section Management Pages
- Story #4.6: Update Basic Navigation Logic
- Epic #3: State Management Refactor (for context)
