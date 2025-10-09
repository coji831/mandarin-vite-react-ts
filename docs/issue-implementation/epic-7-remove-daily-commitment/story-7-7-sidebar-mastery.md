# Story 7.11 Implementation: Sidebar & index UI show full list and mastery states

## Technical Rationale

Sidebar and index UI show full vocabulary list and mastery states for selected list.

## Implementation Steps

1. Render sidebar/index for selected listId
2. Highlight mastered words
3. Implement focus on sidebar item click

## Key Decisions

- Use progress[wordId] for mastery state

## Risks & Mitigations

- Risk: UI bugs — Mitigation: accessibility and edge case testing

## Status

**Status:** Completed
**Last Update:** 2025-10-08

## Related Business Requirement

- [Story 7.11 BR](../../business-requirements/epic-7-remove-daily-commitment/story-7-7-sidebar-mastery.md)
