# Epic 4: Mandarin Feature Routing Improvements

> **Template Usage:**
>
> **Format:** `#14 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure-template.md)`
>
> - For **GitHub Issues**: Copy only the issue number (e.g., `#14`)
> - For **Repository**: The entire line maintains working links for documentation

## Epic Summary

**Epic Goal:** Refactor the Mandarin feature to use proper nested routing instead of a single-page state-driven approach, improving navigation, browser history support, and component organization.

**Status:** Planned

**Last Update:** August 16, 2025

## Background

The current Mandarin feature implementation uses a state variable (`currentPage`) to control which subpage is displayed within a single React component (`Mandarin.tsx`). This approach has several limitations:

- Users can't navigate directly to subpages via URLs
- Browser back/forward buttons don't work as expected
- All subpages are under the same `/mandarin` route
- Component organization is less intuitive

This epic will refactor the routing structure to use proper nested routes while leveraging the context-based state management implemented in Epic 3.

## Architecture Decisions

1. **Nested Routes**: Implement proper nested routing for each subpage
2. **URL-based Navigation**: Replace `setCurrentPage` calls with router navigation
3. **Route Parameters**: Use route parameters for selected lists and sections
4. **Browser Navigation Support**: Enable proper back/forward button behavior
5. **Layout Component**: Create a layout component for shared UI elements across routes

## Implementation Details

- Create a dedicated router configuration for the Mandarin feature
- Set up nested routes for each subpage
- Update navigation to use router navigation instead of state changes
- Create a layout component with an outlet for the nested routes
- Update URL paths to include list IDs and section IDs where appropriate
- Ensure the browser's back and forward buttons work correctly

### Key Components Added/Modified

1. **MandarinRoutes**: New router configuration for the Mandarin feature
2. **MandarinLayout**: New layout component for shared UI elements
3. **Individual Subpages**: Convert each subpage from a component to a route
4. **Navigation Logic**: Update all navigation to use router instead of state

## User Stories

This epic consists of the following user stories:

1. #14 / [**Create Nested Route Structure**](./story-4-1-create-nested-route-structure-template.md)

   - As a developer, I want to implement proper nested routing for the Mandarin feature, so that users can navigate directly to subpages and use browser navigation.

2. #15 / [**Create Layout Component with Outlet**](./story-4-2-create-layout-component-template.md)

   - As a developer, I want to create a layout component with an outlet for nested routes, so that shared UI elements are consistent across all subpages.

3. #16 / [**Convert Subpages to Routes**](./story-4-3-convert-subpages-template.md)

   - As a developer, I want to convert each subpage to a proper route, so that they can be accessed directly via URLs.

4. #17 / [**Update Navigation Logic**](./story-4-4-update-navigation-logic-template.md)

   - As a developer, I want to update all navigation to use the router instead of state changes, so that browser history is properly maintained.

## Acceptance Criteria

- [ ] Mandarin feature has proper nested routing structure
- [ ] Each subpage has its own route:
  - [ ] `/mandarin/vocabulary-list`
  - [ ] `/mandarin/daily-commitment`
  - [ ] `/mandarin/section-confirm`
  - [ ] `/mandarin/section-select`
  - [ ] `/mandarin/flashcards`
- [ ] URLs include parameters where appropriate (e.g., `/mandarin/flashcards/:sectionId`)
- [ ] Browser back and forward buttons work correctly
- [ ] Direct navigation to subpages works
- [ ] Navigation within the app uses router navigation, not state changes
- [ ] All existing functionality works identically after refactoring
- [ ] Test coverage is maintained or improved
- [ ] Documentation is updated to reflect the new architecture

## Implementation Plan

1. Create the nested route structure and router configuration
2. Create a layout component with an outlet for nested routes
3. Convert each subpage to a proper route component
4. Update all navigation to use router navigation
5. Add tests for the new routing structure
6. Update documentation

## Dependencies

- Epic 3: State Management Refactor (should be completed first)

## Related Issues

- #2 (Initial implementation of Mandarin feature)
- #10-13 (Epic 3 user stories)

## Notes

- This refactoring should not change any user-facing functionality, only improve navigation
- Care must be taken to ensure route parameters are properly handled
- The context-based state management from Epic 3 should be used for sharing state between routes
