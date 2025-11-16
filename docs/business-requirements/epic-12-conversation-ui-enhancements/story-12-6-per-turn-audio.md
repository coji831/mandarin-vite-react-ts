# Story 12.6: Per-Turn Audio Playback Controls in Conversation UI

## Story Summary

**Goal:**
Enable learners to play, pause, and replay audio for each turn individually in a conversation, supporting repeated listening and practice.

**Status:** Completed

**Last Update:** 2025-11-16

## Background

Currently, audio playback may be global or unavailable per turn, and playback state is not clearly indicated. Learners need granular control to practice each exchange.

- [x] Each turn in the conversation UI has its own audio play button.
- [x] User can play, pause, or replay audio for any turn.
- [x] UI shows which turn is currently playing (playback state visible).
- [x] Accessibility is verified (ARIA labels, keyboard navigation).
- [x] OpenAPI/spec and frontend API types are updated to match new audio requirements if needed.
- [x] Migration notes are added for any breaking changes to UI or API contracts.
- [x] Unit/component tests cover audio controls and playback state.

## Completion Note

All acceptance criteria are met. Per-turn audio controls are implemented, tested, and accessible. See implementation doc and PR for details.

## Risks & Mitigations

- Risk: Audio playback is unreliable or confusing — Mitigation: Use robust audio libraries and clear UI feedback.

## Implementation Notes

- Follow code conventions and solid principles.
- Use design system components for audio controls.
