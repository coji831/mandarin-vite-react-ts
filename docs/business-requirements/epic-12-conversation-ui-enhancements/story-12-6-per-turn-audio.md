# Story 12.6: Per-Turn Audio Playback Controls in Conversation UI

## Story Summary

**Goal:**
Enable learners to play, pause, and replay audio for each turn individually in a conversation, supporting repeated listening and practice.

**Status:** Draft

**Last Update:** 2025-11-14

## Background

Currently, audio playback may be global or unavailable per turn, and playback state is not clearly indicated. Learners need granular control to practice each exchange.

- [ ] Each turn in the conversation UI has its own audio play button.
- [ ] User can play, pause, or replay audio for any turn.
- [ ] UI shows which turn is currently playing (playback state visible).
- [ ] Accessibility is verified (ARIA labels, keyboard navigation).
- [ ] OpenAPI/spec and frontend API types are updated to match new audio requirements if needed.
- [ ] Migration notes are added for any breaking changes to UI or API contracts.
- [ ] Unit/component tests cover audio controls and playback state.

## Implementation Approach

- Add per-turn audio playback controls to the conversation UI.
- Show playback state for each turn.
- Ensure accessibility and add tests for audio controls.

## Risks & Mitigations

- Risk: Audio playback is unreliable or confusing — Mitigation: Use robust audio libraries and clear UI feedback.

## Implementation Notes

- Follow code conventions and solid principles.
- Use design system components for audio controls.
