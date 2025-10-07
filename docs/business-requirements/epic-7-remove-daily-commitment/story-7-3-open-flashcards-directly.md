# Story 7.3: Open flashcards directly after list selection

## Description

**As a** learner,
**I want to** select a vocabulary list and immediately start studying,
**So that** I don't have to set a daily commitment first.

## Business Value

Reduces friction and improves the learning flow by streamlining navigation.

## Acceptance Criteria

- [ ] Selecting a list navigates to `/mandarin/flashcards/:listId`.
- [ ] FlashCardPage loads the list and shows a loading state if needed.
- [ ] No daily-commitment UI appears during the flow.

## Business Rules

1. Navigation should be atomic and preserve back-button behavior.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
