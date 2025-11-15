# Story 12.4: Display and Toggle Pinyin/English in Conversation UI

## Story Summary

**Goal:**
Enable learners to view pinyin and English meaning for each line in a generated conversation, and toggle their visibility, to support understanding and flexible learning.

**Status:** Draft

**Last Update:** 2025-11-14

## Background

Currently, the UI may only display Chinese text by default, with no toggles for pinyin or English. Learners need the ability to see and hide these fields as needed for comprehension and practice.

## Acceptance Criteria

- [ ] UI displays Chinese, pinyin, and English for each turn in a conversation.
- [ ] User can toggle pinyin and English on/off for all turns or per turn.
- [ ] User preferences for toggles persist across sessions (localStorage/context).
- [ ] Accessibility is verified (keyboard, ARIA, color contrast).
- [ ] Unit/component tests cover all display and toggle logic.

## Implementation Approach

- Add toggles to the conversation UI for pinyin and English fields.
- Store user preferences in localStorage or context.
- Ensure all UI changes are accessible and tested.

## Risks & Mitigations

- Risk: UI clutter/confusion — Mitigation: Use clear, intuitive controls and design system components.
- Risk: Accessibility gaps — Mitigation: Conduct accessibility review and testing.

## Implementation Notes

- Follow code conventions and solid principles.
- Use role/text queries in tests for robustness.
