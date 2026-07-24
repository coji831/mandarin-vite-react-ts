# Story 21.7: Reading Progress

## Description

**As a** learner,
**I want to** track which passages I've completed, bookmark my position, and auto-save my reading progress,
**So that** I can resume reading later.

## Business Value

Progress tracking turns reading from a one-time activity into an ongoing learning journey. Learners can pick up where they left off, track completion, and bookmark passages for later. This increases engagement and retention by providing continuity across reading sessions.

## Acceptance Criteria

- [ ] Auto-save reading position on sentence change (debounced 2s via Zustand → backend PUT)
- [ ] Auto-save on page unload (`beforeunload` event)
- [ ] Mark passage completed on final sentence
- [ ] Bookmark/unbookmark toggle on ReaderCard
- [ ] Bookmarked passages show indicator in library view
- [ ] Completed passages show checkmark in library view
- [ ] Guest users have ephemeral state (in-memory only, not synced to backend)

## Business Rules

1. **Auto-save strategy** — Zustand store (immediate) + debounced backend sync (2s). `beforeunload` event for final save.
2. **Passage-level granularity** — Passage is either completed or not completed. Auto-saved sentence position enables resume.
3. **Guest tracking** — Guests have ephemeral in-memory state only. No database writes. State is lost on tab close.
4. **Bookmark uniqueness** — One bookmark per user per passage. Toggle on/off via ReaderCard.
5. **No progress API for guests** — All session/bookmark endpoints require authentication. Guests see read-only interface.
6. **API endpoints** — `GET/PUT /v1/readers/sessions/:passageId` (get/update position), `POST /v1/readers/sessions/:passageId/complete` (mark completed), `GET/POST /v1/readers/bookmarks` (list/add), `DELETE /v1/readers/bookmarks/:id` (remove). All require authentication.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (dependency — reading UI must exist)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
