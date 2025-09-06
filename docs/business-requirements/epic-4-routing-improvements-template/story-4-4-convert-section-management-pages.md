# Story 4.4: Convert Section Management Pages

## Description

**As a** developer,
**I want to** convert the section confirmation and section selection subpages from state-based components to dedicated route components,
**So that** code organization is improved and direct navigation is enabled for more complex section management flows.

## Business Value

Improves maintainability and enables direct URL access to section management subpages.

## Acceptance Criteria

- [ ] Create `SectionConfirmPage.tsx` component
- [ ] Create `SectionSelectPage.tsx` component
- [ ] Move rendering logic from conditional statements in `Mandarin.tsx` to these components
- [ ] Ensure both components use the `useMandarin` hook for state access
- [ ] Connect components to their respective routes in the router configuration
- [ ] Document components with JSDoc comments
- [ ] Create unit tests for both page components
- [ ] Verify functionality works identically after refactoring

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. Each section management page must be a dedicated route component.

## Related Issues

- #4.1 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure.md) (Dependency)
- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Dependency)
- #4.3 / [**Convert Basic Pages**](./story-4-3-convert-basic-pages.md) (Dependency)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Completed
- **PR**: [Add PR number]
- **Merge Date**: [Add date]
- **Key Commit**: [Add commit hash] (Section management pages refactor)

## User Journey [Optional]

As a user, I can visit `/mandarin/section-confirm` and `/mandarin/section-select` directly and see the correct subpage rendered.
