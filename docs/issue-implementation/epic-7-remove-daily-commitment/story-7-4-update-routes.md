# Story 7.8 Implementation: Update MandarinRoutes to remove old routes and add new

## Technical Rationale

Update router to add `/mandarin/flashcards/:listId` and remove legacy commitment/section routes.

## Implementation Steps

1. Add new route to router
2. Archive/remove old routes
3. Implement feature flag for migration window

## Key Decisions

- Use feature flag for backward compatibility

## Risks & Mitigations

- Risk: Broken navigation — Mitigation: test all routes

## Status

- **Status:** Completed
- **Last Update:** 2025-10-07

## Related Business Requirement

- [Story 7.8 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-4-update-routes.md)
