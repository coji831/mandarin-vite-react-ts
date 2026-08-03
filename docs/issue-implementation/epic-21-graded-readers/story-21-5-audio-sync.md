# Implementation 21-5: Audio Sync

> **Historical snapshot** — the per-sentence audio hooks this story shipped
> (`usePassageAudio`, `useSentenceAudio`, `useAudioEngine`, `useBrowserTTS`,
> `useAudioAutoAdvance`) were superseded by the shared `AudioManager` +
> `AudioBehavior` consolidation (TTS detachment). See `shared/audio/` and the
> readers-owned `PassageAudioBehavior`. Kept for reference.
>
> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-5-audio-sync.md`

## Technical Scope

Add per-sentence TTS audio playback with dual-flow fallback, AudioControlBar, and decomposed audio hooks.

**Files created (23):**

### Backend

- `apps/backend/src/modules/readers/services/ReadersAudioService.ts` — GCS lookup → TTS orchestration
- `apps/backend/src/modules/readers/types/readers-audio.ts` — Audio response types
- `apps/backend/src/modules/readers/api/__tests__/ReadersAudioController.test.ts` — 4 controller tests
- `apps/backend/src/modules/readers/services/__tests__/ReadersAudioService.test.ts` — 5 service tests
- `apps/backend/src/modules/readers/services/__tests__/ReadersService.test.ts` — 4 service tests

### Frontend — hooks (decomposed per SRP)

- `apps/frontend/src/features/readers/hooks/useAudioEngine.ts` — Core HTMLAudioElement lifecycle
- `apps/frontend/src/features/readers/hooks/useBrowserTTS.ts` — SpeechSynthesisUtterance wrapper
- `apps/frontend/src/features/readers/hooks/useAudioAutoAdvance.ts` — Sequential playback + cancellation
- `apps/frontend/src/features/readers/hooks/useSentenceAudio.ts` — Composition hook (popover + visibility)
- `apps/frontend/src/features/readers/hooks/usePassageAudio.ts` — Audio URL fetch hook
- `apps/frontend/src/features/readers/hooks/index.ts` — Hook barrel
- `apps/frontend/src/features/readers/hooks/__tests__/useSentenceAudio.test.ts` — 10 hook tests
- `apps/frontend/src/features/readers/hooks/__tests__/usePassageAudio.test.ts` — 5 hook tests

### Frontend — components

- `apps/frontend/src/features/readers/components/AudioControlBar/AudioControlBar.tsx` — Transport + speed controls
- `apps/frontend/src/features/readers/components/AudioControlBar/AudioControlBar.css`
- `apps/frontend/src/features/readers/components/AudioControlBar/__tests__/AudioControlBar.test.tsx` — 12 component tests

### Frontend — types, services, stores

- `apps/frontend/src/features/readers/types/audio.ts` — Audio type definitions
- `apps/frontend/src/features/readers/types/api.ts` — API response types
- `apps/frontend/src/features/readers/constants/audio.ts` — Playback constants
- `apps/frontend/src/features/readers/services/passageService.ts` — `fetchPassageAudio()`
- `apps/frontend/src/features/readers/stores/readingStore.ts` — `currentAudioIndex` + `pendingPlayIndex`
- `apps/frontend/src/features/readers/services/__tests__/passageService.test.ts` — Service tests

### Storybook

- `apps/frontend/.storybook/msw-handlers.ts` — Audio API handlers
- `apps/frontend/.storybook/decorators/withReadingStore.tsx` — Audio index override
- `apps/frontend/src/pages/learn/readers/ReadersPageFull.stories.tsx` — 4 audio story variants

## Implementation Details

### GCS Path Format

```
tts/{passageHash}/{sentenceIndex}.mp3
```

- `passageHash` = SHA256 of passage content → deterministic folder name
- `sentenceIndex` = 0-based index of sentence in passage
- Deterministic paths ensure no collisions and enable caching

### AudioControlBar

- Play/pause button
- Speed control: 0.75x, 1x, 1.25x
- Progress indicator (current sentence / total sentences)
- Visually integrated with ReadingView

### useSentenceAudio Hook

```typescript
function useSentenceAudio(sentences: Sentence[]) {
  // Fetch audio URLs via POST /v1/readers/passages/:id/audio (fetchPassageAudio → audioStore)
  // Manage playback state (playing, paused, stopped)
  // Handle auto-advance to next sentence
  // Handle fallback logic
  return {
    currentIndex,
    isPlaying,
    play,
    pause,
    replay,
    setSpeed,
    audioUrls, // From fetchPassageAudio (also written to audioStore)
  };
}
```

### Audio Flow

1. Audio URLs fetched via `POST /v1/readers/passages/:id/audio` (`fetchPassageAudio` → `audioStore`) — not embedded in passage content JSON
2. User taps play → audio starts from current sentence
3. Auto-advance: plays sentences sequentially, stops after last
4. Tap any sentence to replay its audio
5. If GCS cached audio unavailable → on-demand TTS generation (Tier-2)
6. If on-demand fails (e.g., 401 for guests) → browser SpeechSynthesis fallback (Tier-3)
7. Audio pauses when WordPopover is open
8. Page Visibility API: auto-pause when tab is backgrounded

## Architecture Integration

```
[Story 21.5: Audio Sync]
├── useSentenceAudio hook → manages playback state
├── AudioControlBar component → play/pause, speed, progress
└── ReadingView integration → sentence highlighting, tap-to-replay

Uses existing: fetchPassageAudio (passageService), audioStore (Zustand), useAudioEngine/useBrowserTTS/useAudioAutoAdvance hooks
```

## Technical Challenges & Solutions

```
Problem: TTS latency on first request would stall the reading flow.
Solution: On-demand (Tier-2) TTS generation per sentence, generated on first
         play rather than pre-generated in batch. Tier-1 GCS batch
         pre-generation is NOT implemented (see epic BR Known Limitations).

Problem: Some sentences may fail TTS generation.
Solution: Three-tier fallback: (1) cached GCS audio, (2) per-sentence on-demand
         TTS, (3) synthetic browser SpeechSynthesis. Backend orchestrates
         (1)→(2); the frontend handles (3) as last resort.

Problem: Audio overlap on tap — tapping a sentence while audio was playing
         caused overlapping playback.
Solution: playSequenceRef cancellation token. On new play request, stop
         current audio immediately via ref sync before starting new sequence.

Problem: Tap-triggered auto-advance — tapping a sentence would start auto-
         advance mode and continue through all sentences.
Solution: autoAdvance parameter on playSentence(index, autoAdvance=true).
         Tap path passes false (single sentence only), Play button passes true.

Problem: Props drilling — audio callbacks (currentAudioIndex, onSentenceTap)
         passed through 3 component levels.
Solution: Moved currentAudioIndex + pendingPlayIndex to readingStore (Zustand).
         SentenceDisplay reads store directly via selector hooks.

Problem: useSentenceAudio violated SRP — managed 7 concerns in one hook.
Solution: Decomposed into 3 focused sub-hooks:
         - useAudioEngine() — core HTMLAudioElement lifecycle
         - useBrowserTTS() — SpeechSynthesis wrapper
         - useAudioAutoAdvance() — sequential playback + cancellation
         - useSentenceAudio() — composes sub-hooks + popover/visibility effects

Problem: SentenceDisplay was coupled to Zustand store directly.
Solution: Converted to props-only interface (currentAudioIndex, onSentenceTap).
         ReadersPage container bridges store values to props.

Problem: isComplete display bug — idle state showed "5/5" instead of "0/5".
Solution: Added hasCompleted prop to separate idle vs completed states.
```

## Implementation Status

- **Status**: Completed
- **PR**: N/A (direct commit — no PR)
- **Commit**: `6878493f`

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
