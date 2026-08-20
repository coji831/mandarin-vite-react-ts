# Story 4.5: Convert Flashcard Page with Parameters

## Description

**As a** developer,
**I want to** convert the flashcard subpage to a dedicated route component that uses route parameters for dynamic data,
**So that** users can access specific flashcard sections directly via URL.

## Business Value

Enables direct URL access to specific flashcard sections and improves maintainability.

## Acceptance Criteria

- [x] Create `FlashCardPage.tsx` component
- [x] Implement route parameter handling for `sectionId`
- [x] Move rendering logic from conditional statements in `Mandarin.tsx` to this component
- [x] Ensure the component uses the `useMandarin` hook for state access
- [x] Use `useParams` hook to extract and validate the `sectionId` parameter
- [x] Connect component to its route in the router configuration
- [x] Document component with JSDoc comments
- [x] Create unit tests for the page component
- [x] Verify functionality works identically after refactoring
- [x] Test direct URL access with different section IDs

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. The flashcard page must use route parameters for section selection.

## Related Issues

- #4.1 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure.md) (Dependency)
- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Dependency)
- #4.5 / [**Convert Flashcard Page with Parameters**](./story-4-5-convert-flashcard-page.md)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Completed
- **PR**: [Add PR number if available]
- **Merge Date**: [Add date if available]
- **Key Commit**: [Add commit hash if available] (Flashcard page refactor)

## User Journey [Optional]

As a user, I can visit `/mandarin/flashcards/:sectionId` directly and see the correct flashcard section rendered.

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Story #4.4: Convert Section Management Pages
- Epic #3: State Management Refactor (for context)
