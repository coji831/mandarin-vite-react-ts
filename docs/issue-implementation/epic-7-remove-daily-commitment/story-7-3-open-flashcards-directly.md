# Story 7.6 Implementation: Open flashcards directly after list selection

## Technical Rationale

Update navigation so selecting a vocabulary list immediately opens the flashcard deck for that list.

## Implementation Steps

1. Refactor list selection handler to navigate to `/mandarin/flashcards/:listId`
2. Remove daily commitment UI from flow
3. Add loading state to FlashCardPage

## Key Decisions

- Remove all daily commitment logic

## Risks & Mitigations

- Risk: Navigation bugs — Mitigation: test back-button and edge cases

## Status

- **Status:** Completed
- **Last Update:** 2025-10-07

## Related Business Requirement

- [Story 7.6 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-3-open-flashcards-directly.md)
