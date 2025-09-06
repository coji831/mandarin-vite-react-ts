# Implementation 4-6: Update Basic Navigation Logic

## Technical Scope

Update basic navigation logic to use React Router's navigation instead of state changes. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

- All navigation logic (next/previous buttons, redirects) is updated to use React Router's `useNavigate` instead of state changes.
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
- [Story 4-6: Update Basic Navigation Logic (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-6-update-basic-navigation-logic.md)

# Implementation 4-6: Update Basic Navigation Logic

## Technical Scope

Update basic navigation logic to use React Router's navigation instead of state changes. Move all old Mandarin feature components into the `/pages` directory and convert them into standalone subpages of the `/mandarin` routes, following the new nested routing structure.

## Implementation Details

- All navigation logic (next/previous buttons, redirects) is updated to use React Router's `useNavigate` instead of state changes.
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
- [Story 4-6: Update Basic Navigation Logic (Business Requirements)](../../business-requirements/epic-4-routing-improvements-template/story-4-6-update-basic-navigation-logic.md)

// After
function handleNextClick() {
navigate("/mandarin/daily-commitment");
}

```

Key updates:

- Import and use `useNavigate` hook
- Replace callback props with direct navigation
- Update any components that trigger navigation

## Estimated Time

- Development: 1.5 hours
- Testing: 1 hour
- Documentation: 30 minutes
- Total: 3 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.3: Convert Basic Pages
- Epic #3: State Management Refactor (for context)
```
