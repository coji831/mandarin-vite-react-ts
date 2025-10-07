# Story 7.7: Sidebar & index UI show full list and mastery states

## Description

**As a** learner,
**I want to** see the full vocabulary list and mastery states in the sidebar and index,
**So that** I can quickly view progress and jump to items.

## Business Value

Improves navigation and provides clear visual cues for progress and mastery.

## Acceptance Criteria

- [ ] Sidebar shows the full list for the selected `listId` and highlights mastered words.
- [ ] Clicking a sidebar item focuses the flashcard deck on that word.

## Business Rules

1. Mastery state should be derived from `ListProgress.progress[wordId]`.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
