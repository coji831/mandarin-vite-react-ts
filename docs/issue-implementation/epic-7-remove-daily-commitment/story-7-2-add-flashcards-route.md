# Story 7.7 Implementation: Add flashcards route and ensure FlashCardPage receives listId

## Technical Rationale

Add `/mandarin/flashcards/:listId` route and ensure FlashCardPage receives listId for deep-linking.

## Implementation Steps

1. Add new route to router
2. Pass listId param to FlashCardPage
3. Write navigation and error handling logic
4. Add unit/integration tests for route

## Key Decisions

- Route param is required for FlashCardPage

## Risks & Mitigations

- Risk: Invalid listId navigation — Mitigation: error state/redirect

## Status

- **Status:** Planned
- **Last Update:** 2025-10-07

## Related Business Requirement

- [Story 7.7 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-2-add-flashcards-route.md)
