# Story 12.5: Turn-Based Navigation and Highlighting in Conversation UI

## Story Summary

**Goal:**
Allow learners to step through a conversation turn by turn, with clear highlighting of the current turn, to support focused practice and comprehension.

**Status:** Completed

**Last Update:** 2025-11-16

## Background

The current UI displays all turns at once, with limited or no highlighting of the current turn. Learners benefit from being able to focus on one exchange at a time and navigate easily.

## Acceptance Criteria

- [x] Conversation UI highlights the current turn with a clear visual indicator.
- [x] User can advance to next/previous turn (buttons or keyboard shortcuts).
- [x] UI updates to show which turn is active; optionally auto-advance after playback.
- [x] Accessibility is verified (keyboard navigation, ARIA labels).
- [x] Unit/component tests cover navigation and highlighting.

## Implementation & PR Reference

- Navigation controls (buttons, keyboard) added to ConversationBox.
- Current turn highlighted in ConversationTurns with .current class and aria-current.
- Accessibility verified (keyboard, ARIA).
- Unit/component tests added and passing.
- See implementation: [story-12-5-turn-navigation.md](../../../issue-implementation/epic-12-conversation-ui-enhancements/story-12-5-turn-navigation.md)

## Risks & Mitigations

- Risk: Navigation is confusing or inaccessible — Mitigation: Use standard patterns and conduct user testing.

## Implementation Notes

- Follow code conventions and solid principles.
- Use design system components for navigation controls.
