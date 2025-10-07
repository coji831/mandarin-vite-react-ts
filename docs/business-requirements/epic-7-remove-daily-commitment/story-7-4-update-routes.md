# Story 7.4: Update MandarinRoutes to remove old routes and add new

## Description

**As a** developer,
**I want to** update the router so `/mandarin/flashcards/:listId` exists and old commit/section routes are removed,
**So that** navigation reflects the new list-first flow.

## Business Value

Keeping routes minimal reduces code surface area and prevents confusion for users and maintainers.

## Acceptance Criteria

- [ ] `MandarinRoutes` includes `/mandarin/flashcards/:listId`.
- [ ] Old routes (daily commitment / section select) are archived or removed behind a feature flag.

## Business Rules

1. Route changes must be backward compatible during the migration window via feature flags or adapters.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
