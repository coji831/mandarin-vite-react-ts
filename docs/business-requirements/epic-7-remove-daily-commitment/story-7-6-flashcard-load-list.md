# Story 7.6: FlashCardPage: load list by listId and render deck

## Description

**As a** learner,
**I want to** have the FlashCard page load words for the chosen list in CSV order and update per-word progress,
**So that** my study session reflects the list's intended ordering and progress is persisted.

## Business Value

Correct ordering and reliable progress updates improve learning effectiveness and UX trust.

## Acceptance Criteria

- [ ] FlashCardPage loads words from the manifest or CSV by `listId` in the expected order.
- [ ] Per-word progress updates persisted to `ListProgress.progress[wordId]`.
- [ ] Visual mastery indicators update immediately after progress changes.

## Business Rules

1. List ordering must follow CSV order unless a manifest override is present.

## Related Issues

- #7 / [**Epic 7: Remove Daily-Commit Flow**](./README.md) (parent)

## Implementation Status

- **Status**: Planned
- **PR**:
- **Merge Date**:
- **Key Commit**:
