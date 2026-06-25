# Story 18.2: Pinyin System Guide

**Last Updated:** June 17, 2026

## Description

**As a** new learner,
**I want to** explore an interactive pinyin chart with clickable initials and finals, hear their pronunciation via TTS, and see tone-colored pinyin,
**So that** I can learn correct pronunciation and understand how syllables are constructed.

## Business Value

Pinyin is the phonetic foundation of Mandarin learning. The interactive chart approach — click an initial, click a final, hear the combination — is more engaging than static tables. Tone-colored pinyin (ˉred ˊorange ˇgreen ˋblue ·gray) builds tone awareness from day one, which is the most common pain point for beginners. Reusing the existing AudioService means no new TTS integration work.

## Acceptance Criteria

- [x] Initials grid renders 21 clickable cells: b p m f d t n l g k h j q x zh ch sh r z c s (verify: all 21 present, each clickable)
- [x] Finals grid renders 38 clickable cells: a o e i u ü ai ei ui ao ou iu ie üe er an en in un ün ang eng ing ong (verify: all 38 present, each clickable — reduced from 39 in spec, actual pinyin inventory has 38 finals)
- [x] Clicking an initial plays its pronunciation via AudioService (verify: click "b" → hear /b/ sound)
- [x] Selecting an initial + a final shows a combination row with all 5 tones (verify: b + a → ba row shows: bā bá bǎ bà ba)
- [x] Clicking a tone cell plays that specific pronunciation (verify: click bā → hear first tone "bā")
- [x] Tone-colored display follows scheme: ˉ red (#FF4444), ˊ orange (#FF8C00), ˇ green (#4CAF50), ˋ blue (#2196F3), · gray (#9E9E9E) (verify: visual inspection)
- [x] Initials and finals data loaded from `public/data/foundations/pinyin.json` (verify: network tab shows JSON load)
- [x] ~~Audio preloading: first 10 common combinations preloaded on tab mount~~ **Removed** — preloading played audio on mount (bad UX). Click-triggered playback shows "generating..." text instead. See Deviations section.
- [x] Audio loading states: shown while TTS generates audio (verify: click cell → "generating..." text → audio plays)
- [x] Mobile responsive: grids wrap on smaller viewports (verify: mobile emulation shows wrapped layout)

## Business Rules

1. 21 initials are: b p m f d t n l g k h j q x zh ch sh r z c s (standard pinyin inventory)
2. 39 finals include simple vowels, compound finals, and nasal finals
3. Tone colors are: 1st=red, 2nd=orange, 3rd=green, 4th=blue, neutral=gray
4. TTS audio uses existing AudioService with fallback to browser SpeechSynthesis
5. Pinyin/tone combination data is static JSON — no backend call needed

## Deviations from Original Specification

- **Audio preloading removed**: The original AC specified preloading first 10 common combinations on tab mount. During implementation, this caused unwanted audio playback on tab open (calling `playWordAudio` plays the audio, not just caches it). The preload was removed. Click-triggered audio playback now shows "generating..." text while TTS fetches audio.
- **usePinyinAudio hook removed**: The original implementation plan specified a dedicated `usePinyinAudio` wrapper hook. During review cycles, this was simplified — `useAudioPlayback` (moved to `shared/hooks/`) is used directly in `PinyinTab.tsx`, with `getPinyinAudioText()` from `pinyinAudioMap.ts` mapping pinyin to Chinese characters for correct TTS.
- **Pinyin-to-character audio mapping**: The TTS backend expects Chinese characters (e.g., "八"), not pinyin text (e.g., "bā"). A `pinyinAudioMap.json` (1,125 entries) was created at `public/data/foundations/pinyin-audio-map.json` to map each tone-marked pinyin syllable to a common Chinese character with that pronunciation. `getPinyinAudioText()` looks up the mapping before sending to TTS.
- **Finals count: 38 instead of 39**: The original spec listed 39 finals, but the standard pinyin inventory has 38. The implementation uses the correct count.

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Story 18.1: Foundations Page Structure (Dependency — provides the PinyinTab mount point)
- Story 18.3: Tones Reference & Practice (Sibling — builds on pinyin knowledge)
- Story 18.6: Audio-to-Type Quiz (Downstream — quiz uses pinyin knowledge)

## Implementation Status

- **Status**: Completed
- **PR**: TBD (branch: epic-18-foundations)
- **Merge Date**: TBD
- **Key Commit**: c094047
- **Last Update**: June 18, 2026
