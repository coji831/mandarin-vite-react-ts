# Story 12.5: Turn-Based Navigation and Highlighting in Conversation UI

## Story Summary

**Goal:**
Allow learners to step through a conversation turn by turn, with clear highlighting of the current turn, to support focused practice and comprehension.

**Status:** Draft

**Last Update:** 2025-11-14

## Background

The current UI displays all turns at once, with limited or no highlighting of the current turn. Learners benefit from being able to focus on one exchange at a time and navigate easily.

## Acceptance Criteria

- [ ] Conversation UI highlights the current turn with a clear visual indicator.
- [ ] User can advance to next/previous turn (buttons or keyboard shortcuts).
- [ ] UI updates to show which turn is active; optionally auto-advance after playback.
- [ ] Accessibility is verified (keyboard navigation, ARIA labels).
- [ ] Unit/component tests cover navigation and highlighting.

## Implementation Approach

- Add navigation controls (buttons, keyboard shortcuts) to the conversation UI.
- Highlight the current turn visually.
- Ensure accessibility and add tests for navigation/highlighting.

## Risks & Mitigations

- Risk: Navigation is confusing or inaccessible — Mitigation: Use standard patterns and conduct user testing.

## Implementation Notes

- Follow code conventions and solid principles.
- Use design system components for navigation controls.
