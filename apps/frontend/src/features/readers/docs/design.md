---
purpose: Design spec for graded readers — passage library, sentence-by-sentence reading, per-sentence audio, progress autosave
status: active
last-verified: 2026-08-03
type: design
---

# Feature: Readers — Design Spec

**Last Updated:** 2026-08-03
**Status:** Delivered (Epic 21 — Graded Readers MVP) · Phase D1 audio migrated to the shared `AudioManager`

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

| Component         | Source                           | Notes                                                                                                                                                                              |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ReaderLibrary`   | `components/ReaderLibrary.tsx`   | HSK filter pills + passage card grid (3/2/1-col responsive); loading/error/empty/filtered-empty states                                                                             |
| `PassageCard`     | `components/PassageCard.tsx`     | HSK badge, title, known-word ratio, bookmark toggle, completion checkmark                                                                                                          |
| `ReadingView`     | `components/ReadingView.tsx`     | Sentence-by-sentence layout; integrates `AudioControlBar` + `SentenceDisplay`; drives `useAutoSaveProgress`                                                                        |
| `SentenceDisplay` | `components/SentenceDisplay.tsx` | Per-sentence row (highlighted text + pinyin); per-sentence 🔊 button routes `play(index, "single")` through the shared AudioManager; active highlight from the shared `audioStore` |
| `WordPopover`     | `components/WordPopover.tsx`     | Inline word lookup card (glyph, pinyin, meaning) → opens LexicalHub; audio pauses while open (popover pause/resume parity)                                                         |
| `AudioControlBar` | `components/AudioControlBar/`    | Play/pause, speed (0.75x/1x/1.25x), progress indicator; reads the SHARED presentational `audioStore` snapshot directly                                                             |

## Audio Flow (shared AudioManager + Behavior Contract)

TTS is **on-demand**, not batch pre-generated (Tier-1 GCS batch pre-gen is NOT implemented). Audio runs on the app-wide **shared `AudioManager`** (`shared/audio/`) as a pure transport playing the readers-owned **`AudioBehavior` contract** built by `buildPassageAudioBehavior` (`features/readers/audio/PassageAudioBehavior.ts`), driven through `useAudioManager` (`shared/hooks/`) and mirrored into the shared presentational `shared/store/audioStore.ts` snapshot (`status`/`currentIndex`/`rate`/`error`/`hasCompleted`).

1. **Behavior** — `buildPassageAudioBehavior({ passageId, sentences })` (readers-owned; `shared/audio` stays feature-free) produces a `sequence` `AudioBehavior` whose `sources` are one `PlayableItem` per sentence (ordered candidates per item). It wraps `passageService.fetchPassageAudio(passageId)` (`POST /v1/readers/passages/:id/audio`, service layer — no `apiClient` in features).
   - **Shared fetch path (guests + users):** the endpoint is `optionalAuth` — guests POST and get real signed URLs exactly like users (no guest short-circuit). `sources` is a lazy async producer that fetches the `SentenceAudioMap` ONCE per passage (in-flight deduped) — `source:"gcs"|"ondemand"` with a URL → candidates `[url, tts]`; `source:"failed"`/missing/empty URL → candidates `[]` (manager silent-skips, never a spinner); fetch failure → every sentence `[]` (silent skip). GCS cold-cache is the cost protector.
2. **Playback** — `ReadersPage` builds the behavior via `buildPassageAudioBehavior` and passes it to `useAudioManager({ behavior })`; the hook resolves `behavior.sources` and loads the items. ▶ / per-sentence single-mode: `play(index, "sequence")` for global ▶ (auto-advance → `completed` event), `play(index, "single")` for the per-sentence 🔊 (no auto-advance). The old `pendingIndex`/`pendingSingleIndex` store signals are gone.
3. **Fallback (candidate loop)** — the manager walks each item's candidates: `{kind:"url"}` plays via the shared `AudioEngine`; a URL-play media error calls `behavior.onUrlFailed` (→ `"fallback"`) and the manager advances to the next candidate — browser **SpeechSynthesis** (`BrowserTTS`, `shared/audio/`) for user sentences, then continues. `{kind:"tts"}` uses `BrowserTTS` directly; where TTS is unavailable (e.g. Android WebView) the manager emits `skipped` and continues — never a spinner. Autoplay-blocked converges on `status:"blocked"` → "tap to play" affordance.
4. **Completion** — the manager's `completed` event (mirrored as `hasCompleted`) replaces the old one-shot `hasJustCompleted`; `ReadersPage` calls `markCompleted` (idempotent).

## Stores

| Store          | Source                       | Purpose                                                                                                                                                        |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioStore`   | `shared/store/audioStore.ts` | SHARED presentational audio snapshot: `status`, `currentIndex`, `rate`, `error`, `hasCompleted` (mirrored from the shared `AudioManager` by `useAudioManager`) |
| `readingStore` | `stores/readingStore.ts`     | Reading progress: `currentSentence`, `completedPassages`, `bookmarkedPassages`, `saveProgress`, `restoreSession`, `toggleBookmark`, `fetchBookmarks` (Zustand) |

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
  ├── buildPassageAudioBehavior → useAudioManager({ behavior }) → shared AudioManager (pure transport)
  │     └── behavior.sources (guests + users share ONE path):
  │         passageService.fetchPassageAudio(id) → POST /v1/readers/passages/:id/audio (optionalAuth)
  │         (one fetch per passage; per-sentence [url, tts] candidates or [] silent-skip)
  ├── shared AudioManager (SequencePlaybackStrategy) → shared audioStore snapshot
  │     (AudioEngine URL playback · BrowserTTS candidate · completed event → markCompleted)
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
