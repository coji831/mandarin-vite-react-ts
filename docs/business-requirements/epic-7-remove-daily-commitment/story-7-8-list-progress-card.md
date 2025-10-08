# Story 7.8: Show per-list progress on ListSelect page cards

## Description

**As a** learner,
**I want to** see my progress (e.g., % mastered, count learned, visual indicator) for each vocabulary list directly on its card in the ListSelect page,
**So that** I can quickly choose which list to study next and track my mastery at a glance.

## Business Value

Improves motivation and navigation by surfacing progress status before list selection, helping users focus on incomplete lists and celebrate mastery.

## Acceptance Criteria

- [ ] Each vocab list card in ListSelect page displays progress (e.g., mastered count, percent, or visual indicator).
- [ ] Progress updates in real time as words are learned.
- [ ] UI is accessible and visually clear; tested for edge cases (empty, full, partial progress).

## Business Rules

1. Progress must be calculated from `ListProgress.progress[wordId]` for each list.
2. Cards should show both numeric and visual progress indicators.
3. Cards for lists with no progress should show a clear 'not started' state.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Completed
