# Story 4.8: Update Flashcard Navigation with Parameters

## Description

**As a** developer,
**I want to** update navigation to flashcard pages to use route parameters for dynamic data,
**So that** users can access specific flashcard sections directly via URL and navigation is more robust.

## Business Value

Enables direct URL access to specific flashcard sections and improves maintainability.

## Acceptance Criteria

- [ ] Update navigation to flashcard page to include section ID parameter
- [ ] Replace `setCurrentPage` calls with parameterized `navigate` calls
- [ ] Ensure sections are correctly loaded based on route parameters
- [ ] Update any components that navigate to or from the flashcard page
- [ ] Document all navigation changes
- [ ] Create unit tests for updated navigation logic
- [ ] Test direct URL access to different flashcard sections
- [ ] Verify flashcard navigation works identically after refactoring

## Business Rules

1. All old Mandarin feature components must be moved into the `/pages` directory and converted into standalone subpages of the `/mandarin` routes, following the new nested routing structure.
2. Flashcard navigation must use route parameters for section selection.

## Related Issues

- #4.1 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure.md) (Dependency)
- #4.2 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component.md) (Dependency)
- #4.5 / [**Convert Flashcard Page with Parameters**](./story-4-5-convert-flashcard-page.md) (Dependency)
- Epic #4: Routing Improvements

## Implementation Status

- **Status**: Planned
- **PR**: [Add PR number if available]
- **Merge Date**: [Add date if available]
- **Key Commit**: [Add commit hash if available] (Flashcard navigation refactor)

## User Journey [Optional]

As a user, I can navigate to `/mandarin/flashcards/:sectionId` and see the correct flashcard section rendered, with browser navigation working as expected.

## Dependencies

- Story #4.6: Update Basic Navigation Logic
- Story #4.7: Update Section/List Selection Navigation
- Epic #3: State Management Refactor (for context)
