# Story 4.3: Convert Basic Pages

## Description

**As a** developer,
**I want to** convert the vocabulary list and daily commitment subpages from state-based components to dedicated route components,
**So that** code organization is improved and direct navigation is enabled.

## Business Value

Improves maintainability and enables direct URL access to basic Mandarin subpages.

## Acceptance Criteria

- [x] Create `VocabularyListPage.tsx` component
- [x] Create `DailyCommitmentPage.tsx` component
- [x] Move rendering logic from conditional statements in `Mandarin.tsx` to these components
- [x] Ensure both components use the `useMandarin` hook for state access
- [x] Connect components to their respective routes in the router configuration
- [x] Document components with JSDoc comments
- [ ] Create unit tests for both page components
- [x] Verify functionality works identically after refactoring

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. Each basic page must be a dedicated route component.

## Related Issues

- #4.1 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure.md) (Dependency)
- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Dependency)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Completed
- **PR**: [Add PR number if available]
- **Merge Date**: [Add date if available]
- **Key Commit**: [Add commit hash if available] (Basic pages refactor)

## User Journey [Optional]

As a user, I can visit `/mandarin/vocabulary-list` and `/mandarin/daily-commitment` directly and see the correct subpage rendered.
