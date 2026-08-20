# Story 21.7: Reading Progress

**Last Updated:** July 30, 2026

## Description

**As a** learner,
**I want to** track which passages I've completed, bookmark my position, and auto-save my reading progress,
**So that** I can resume reading later.

## Business Value

Progress tracking turns reading from a one-time activity into an ongoing learning journey. Learners can pick up where they left off, track completion, and bookmark passages for later. This increases engagement and retention by providing continuity across reading sessions.

## Acceptance Criteria

- [x] **AC #1 — Auto-save on sentence change**: Reading position auto-saves when advancing or rewinding sentences (debounced 2s via Zustand → backend `PUT`)
- [x] **AC #2 — Auto-save on page unload**: Reading position saves on `beforeunload` and component unmount to prevent data loss on unexpected tab close
- [x] **AC #3 — Mark passage completed**: Reading a passage's final sentence auto-marks it as completed via `POST /v1/readers/sessions/:passageId/complete`
- [x] **AC #4 — Bookmark toggle on PassageCard**: Each passage card in library view shows a bookmark/unbookmark toggle. Toggling adds or removes the bookmark immediately (optimistic update), then syncs to backend
- [x] **AC #5 — Bookmark indicator**: Bookmarked passages show a filled bookmark icon in library view. Completed passages show a checkmark indicator
- [x] **AC #6 — Guest ephemeral state**: Unauthenticated users see read-only UI. Session state, completion, and bookmarks are ephemeral (in-memory only, lost on tab close)
- [x] **AC #7 — Bookmark listing**: Authenticated users see all bookmarked passages via `GET /v1/readers/bookmarks` — used to populate the library filter "Bookmarked"
- [x] **AC #8 — Restore on reopen**: When a user re-opens a previously read passage, the reading position is restored and the view scrolls/jumps to the saved sentence

## Business Rules

1. **Auto-save strategy** — Zustand store updates immediately (local). Backend sync is debounced at 2s on sentence change. `beforeunload` and component unmount trigger a final synchronous save. One silent retry on failure, then log and continue — never block reading.
2. **Passage-level granularity** — A passage is either completed or not completed. Auto-saved `currentSentence` enables resume. No sub-passage granularity.
3. **Guest tracking** — Guests have ephemeral in-memory state only. No database writes. State is lost on tab close. All session/bookmark endpoints return 401 for unauthenticated requests.
4. **Bookmark uniqueness** — One bookmark per user per passage. Toggle on/off via PassageCard. Deletion uses `DELETE /v1/readers/bookmarks/by-passage/:passageId` (by passage ID, not bookmark ID). The client only tracks passage IDs.
5. **No progress API for guests** — All session/bookmark endpoints require authentication. Guests see read-only interface: no bookmark toggle, no save.
6. **API endpoints** — `GET/PUT /v1/readers/sessions/:passageId` (get/update position), `POST /v1/readers/sessions/:passageId/complete` (mark completed), `GET /v1/readers/bookmarks` (list bookmarked passage IDs), `POST /v1/readers/bookmarks` (add bookmark, body `{ passageId }`), `DELETE /v1/readers/bookmarks/by-passage/:passageId` (remove by passage), `GET /v1/readers/bookmarks/by-passage/:passageId` (check if a single passage is bookmarked). All require authentication.

## Related Issues

- **Epic 21: Graded Readers** ([BR](../README.md)) — epic parent
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) — dependency: reading UI must exist before progress tracking can be integrated
- **Story 21.5: Audio Sync** ([BR](story-21-5-audio-sync.md)) — dependency: sentence-level audio navigation interacts with position tracking

## Implementation Status

- **Status**: Completed
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `b0dc2945`
