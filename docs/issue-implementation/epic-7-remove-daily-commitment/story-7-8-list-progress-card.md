# Story 7.12 Implementation: Show per-list progress on ListSelect page cards

## Technical Rationale

Show progress for each vocabulary list on its card in ListSelect page.

## Implementation Steps

1. Calculate progress from ListProgress.progress[wordId]
2. Render numeric and visual indicators on each card
3. Handle edge cases (empty, full, partial progress)

## Key Decisions

- Show both numeric and visual indicators

## Risks & Mitigations

- Risk: Incorrect progress display — Mitigation: test all progress states

## Status

- **Status:** Planned
- **Last Update:** 2025-10-07

## Related Business Requirement

- [Story 7.12 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-8-list-progress-card.md)
