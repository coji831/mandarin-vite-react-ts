# Implementation 21-5: Audio Sync

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-5-audio-sync.md`

## Technical Scope

Add per-sentence TTS audio playback with dual-flow fallback, AudioControlBar, and useSentenceAudio hook.

**Files:**

- `apps/frontend/src/features/readers/hooks/useSentenceAudio.ts`
- `apps/frontend/src/features/readers/components/AudioControlBar/`
- `apps/frontend/src/features/readers/components/ReadingView/` (audio integration)

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
  // Pre-fetch audio URLs from Passage content JSON
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
    audioUrls, // Pre-fetched
  };
}
```

### Audio Flow

1. Audio URLs loaded from Passage content JSON (pre-fetched, not fetched per-sentence)
2. User taps play → audio starts from current sentence
3. Auto-advance: plays sentences sequentially, stops after last
4. Tap any sentence to replay its audio
5. If pre-generated audio unavailable → on-demand TTS generation
6. If on-demand fails → browser SpeechSynthesis fallback
7. Audio pauses when WordPopover is open
8. Page Visibility API: auto-pause when tab is backgrounded

## Architecture Integration

```
[Story 21.5: Audio Sync]
├── useSentenceAudio hook → manages playback state
├── AudioControlBar component → play/pause, speed, progress
└── ReadingView integration → sentence highlighting, tap-to-replay

Uses existing: AudioService, useAudioPlayback hook
```

## Technical Challenges & Solutions

```
Problem: TTS latency for batch generation would block passage loading.
Solution: Parallel TTS requests (one per sentence). 5s timeout per sentence.
         Cache partial results and retry failed.

Problem: Some sentences may fail TTS generation.
Solution: Two-flow fallback: (1) pre-generated, (2) per-sentence on-demand,
         (3) synthetic browser SpeechSynthesis. User can retry failed sentences.
```
