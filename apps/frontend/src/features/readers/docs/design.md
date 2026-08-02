# Feature: Readers — Design Spec

**Last Updated:** 2026-08-02
**Status:** Delivered (Epic 21 — Graded Readers MVP)

---

## Overview

The readers feature delivers the learner-facing graded reading experience: browse AI-generated passages by HSK level, read sentence-by-sentence with inline word lookup, play per-sentence audio, and auto-save reading progress (position, completion, bookmarks). It is the frontend half of the graded-readers pipeline (backend module `modules/readers/`).

The feature folder is `features/readers/` (not `graded-readers`).

## Layout & Routes

| Route            | Component (page container)            | Purpose                             |
| ---------------- | ------------------------------------- | ----------------------------------- |
| `/learn/readers` | `pages/learn/readers/ReadersPage.tsx` | Library view + reading view routing |

`ReadersPage` is phase-gated (requires Phase 3 via `usePhaseGate`). Guests can browse the 6 demo passages read-only (no generate / sessions / bookmarks).

## Components

| Component         | Source                           | Notes                                                                                                       |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ReaderLibrary`   | `components/ReaderLibrary.tsx`   | HSK filter pills + passage card grid (3/2/1-col responsive); loading/error/empty/filtered-empty states      |
| `PassageCard`     | `components/PassageCard.tsx`     | HSK badge, title, known-word ratio, bookmark toggle, completion checkmark                                   |
| `ReadingView`     | `components/ReadingView.tsx`     | Sentence-by-sentence layout; integrates `AudioControlBar` + `SentenceDisplay`; drives `useAutoSaveProgress` |
| `SentenceDisplay` | `components/SentenceDisplay.tsx` | Per-sentence row (highlighted text + pinyin); per-sentence play button; active highlight from `audioStore`  |
| `WordPopover`     | `components/WordPopover.tsx`     | Inline word lookup card (glyph, pinyin, meaning) → opens LexicalHub; audio pauses while open                |
| `AudioControlBar` | `components/AudioControlBar/`    | Play/pause, speed (0.75x/1x/1.25x), progress indicator; reads `audioStore` directly                         |

## Audio Flow (On-Demand + Fallback)

TTS is **on-demand**, not batch pre-generated (Tier-1 GCS batch pre-gen is NOT implemented):

1. `usePassageAudio` calls `fetchPassageAudio(passageId)` → `POST /v1/readers/passages/:id/audio` and writes the sentence→URL map into `audioStore` (`loadAudioUrls`).
2. `useAudioPlayer` / `AudioControlBar` / `SentenceDisplay` read playback state from `audioStore` (currentIndex, status, speed, pendingIndex/pendingSingleIndex).
3. Fallback: if on-demand URLs are unavailable (e.g., `401` for guests), the reader falls back to **browser SpeechSynthesis** via the `BrowserTTS` class (`shared/lib/browserTTS.ts`), used by `useAudioPlayer` (`features/readers/hooks/useAudioPlayer.ts`) when an on-demand URL is missing or fails. Backend orchestrates GCS → on-demand TTS; the frontend only handles SpeechSynthesis as last resort.

## Stores

| Store          | Source                   | Purpose                                                                                                                                                        |
| -------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioStore`   | `stores/audioStore.ts`   | Audio playback state: `audioUrls`, `currentIndex`, `status`, `speed`, `pendingIndex`/`pendingSingleIndex`                                                      |
| `readingStore` | `stores/readingStore.ts` | Reading progress: `currentSentence`, `completedPassages`, `bookmarkedPassages`, `saveProgress`, `restoreSession`, `toggleBookmark`, `fetchBookmarks` (Zustand) |

## Services

| Service                  | Source                               | Purpose                                                                  |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------ |
| `passageService`         | `services/passageService.ts`         | `fetchPassages()`, `fetchPassage(id)`, `fetchPassageAudio(id)`           |
| `readingProgressService` | `services/readingProgressService.ts` | Sessions (GET/PUT), `completePassage`, bookmarks (list/add/remove/check) |

## Data Flow

```
ReaderLibrary / ReadingView (ReadersPage)
  ├── passageService.fetchPassages()  → GET /v1/readers/passages (optionalAuth; guests see 6 demos)
  ├── passageService.fetchPassage(id) → GET /v1/readers/passages/:id (pre-segmented sentences)
  ├── fetchPassageAudio(id)           → POST /v1/readers/passages/:id/audio → audioStore
  ├── readingProgressService          → GET|PUT /v1/readers/sessions/:passageId
  │                                    POST /v1/readers/sessions/:passageId/complete
  │                                    GET|POST /v1/readers/bookmarks
  │                                    GET|DELETE /v1/readers/bookmarks/by-passage/:passageId
  └── openHub(entityRef)              → shared/hub-entry → LexicalHub (word→character→radical)
```

Reading progress: Zustand (`readingStore`) updates immediately → debounced (2s) backend sync → `beforeunload`/unmount final save. Guest state is ephemeral (in-memory only).

## Dependencies

- `@mandarin/shared-constants` — `ROUTE_PATTERNS.readers*` route patterns
- `shared/hub-entry` — `openHub()` for inline word lookup (LexicalHub)
- `shared/components` — `ErrorScreen`, `LoadingScreen`, `FilterChip`, shared `Button`, etc.
- Phase gate: `usePhaseGate` (readers require Phase 3)
