# Epic 21: Graded Readers — Implementation

**BR Reference:** `docs/business-requirements/epic-21-graded-readers/README.md`

**Status:** Planned

**Last Update:** June 16, 2026

---

## Architecture Decisions

| Decision               | Choice                                                          | Rationale                                                          |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Passage generation** | Gemini API — prompt with HSK constraint + 95/5 rule             | Dynamic content per user's level. No fixed dataset.                |
| **HSK level unlock**   | Backend check: ≥90% of HSK N words known → unlock HSK N readers | Uses existing HSK word lists from `packages/shared-constants/`.    |
| **Content storage**    | Database (generated on demand, cached for reuse)                | Avoids regenerating same passage for different users.              |
| **Inline popover**     | React portal near tapped element → compact Hub → full Hub       | Two-step: quick lookup → full detail. Preserves reading flow.      |
| **Audio**              | Reuse existing AudioService for sentence-level TTS              | Already implemented. Per-sentence playback.                        |
| **Phonetic Clusters**  | Static JSON in `public/data/phonetic-clusters/`                 | Fixed dataset — characters grouped by shared phonetic. No backend. |

---

## Stories

### Story 20.1: Passage Generation Backend

**Files:** `apps/backend/src/modules/readers/`

**AC:** Gemini API integration for HSK-level constrained passage generation. 95/5 rule enforcement (prompt specifies known + target HSK levels). Content caching (DB). HSK unlock check endpoint: `GET /api/readers/unlock-status` returns available levels.

### Story 20.2: Reading UI

**Files:** `ReaderLibrary.tsx`, `ReadingView.tsx`

**AC:** Library view with passage cards (HSK badge, 95% ratio, reading time). Reading view with sentence-by-sentence layout, pinyin below. Inline popover on tap → compact Hub → "Open full panel" → full Character Hub. Sentence highlight follows audio.

### Story 20.3: Audio Sync

**Files:** `ReadingView.tsx` (audio integration)

**AC:** Per-sentence TTS playback. Highlight follows audio. Auto-play mode. Tap sentence to replay. Audio pauses on word lookup popover.

### Story 20.4: Reading Progress

**Files:** `readingProgressStore.ts`, backend progress API

**AC:** Track completed passages. Auto-save position on exit. Bookmark passages. Backend sync via `POST /api/progress/event { type: "reading", ... }`.

### Story 20.5: Phonetic Clusters

**Files:** `PhoneticClustersTab.tsx`, `public/data/phonetic-clusters/clusters.json`

**AC:** Characters grouped by shared phonetic element (e.g., 青 family). Each group shows phonetic pattern + pronunciation changes. Clickable nodes → Hub. Filter by HSK level. Static data — no backend needed.

---

## Risks

| Risk                                          | Mitigation                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Gemini generates inconsistent passage quality | Auto-regenerate on low quality. Cache successful passages.                                  |
| 95/5 rule hard to enforce via prompting       | Include known vocabulary list in prompt explicitly. Validate output against HSK word lists. |
| Large number of passages cached               | Implement DB cleanup for low-access passages. Page limit per user.                          |
