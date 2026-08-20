# Story 21.5: Audio Sync

## Description

**As a** learner,
**I want to** hear each sentence read aloud via TTS with fallback support,
**So that** I can practice listening and pronunciation simultaneously.

## Business Value

Audio sync turns reading into a multi-sensory learning experience. Learners can hear correct pronunciation while reading, improving listening comprehension and reinforcing tone accuracy. The dual-flow fallback ensures reliability even when TTS generation fails for some sentences.

## Acceptance Criteria

- [x] Per-sentence TTS playback using existing AudioService
- [x] Audio playback highlights the current sentence (CSS class toggle)
- [x] Auto-advance mode: plays sentences sequentially, stops after last
- [x] Tap any sentence to replay its audio
- [x] Audio pauses when WordPopover is open
- [x] AudioControlBar with: play/pause, speed control (0.75x, 1x, 1.25x), progress indicator
- [x] Audio URLs are pre-fetched (loaded from Passage content JSON, not fetched per-sentence)
- [x] Audio auto-pauses when browser tab is backgrounded (Page Visibility API)

## Business Rules

1. **Batch TTS pre-generation** — All sentences are queued for TTS when a passage is first requested. Parallel generation reduces latency.
2. **Two-flow fallback**: (1) Pre-generated audio from GCS, (2) Per-sentence on-demand if some pre-generation failed. The backend orchestrates GCS lookup → on-demand TTS via `ReadersAudioService`, returning `{ url, source }` per sentence. The frontend only handles `source: "failed"` → browser SpeechSynthesis as last resort.
3. **Per-sentence retry** — Failed sentences show a retry icon. User can retry individual sentences without regenerating the entire passage.
4. **Naming convention** — GCS path: `tts/{passageHash}/{sentenceIndex}.mp3`. Passage content hash = folder name. Sentence index = file name. Deterministic paths, no collisions.
5. **Audio is standalone** — Uses existing AudioService + useAudioPlayback hook. No new audio infrastructure needed.
6. **Non-blocking** — Audio plays without blocking the reading UI.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.4: Reading UI + LexicalHub Phase 1** ([BR](story-21-4-reading-ui-lexical-hub.md)) (dependency — reading UI must exist)

## Implementation Status

- **Status**: Completed
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `6878493f`
