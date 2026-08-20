# Story 7.2: Add flashcards route and ensure FlashCardPage receives listId

## Description

**As a** developer,
**I want to** add a route `/mandarin/flashcards/:listId` and ensure `FlashCardPage` receives `listId` from the router,
**So that** pages can be deep-linked per vocabulary list.

## Business Value

Deep links support sharing, bookmarking, and direct navigation to a list's deck.

## Acceptance Criteria

- [ ] Route `/mandarin/flashcards/:listId` exists and is wired in `MandarinRoutes`.
- [ ] `FlashCardPage` receives `listId` param and uses it to load the list.
- [ ] Unit/integration test covers route navigation.

## Business Rules

1. If `listId` is invalid, FlashCardPage should show an error state or redirect to list index.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
