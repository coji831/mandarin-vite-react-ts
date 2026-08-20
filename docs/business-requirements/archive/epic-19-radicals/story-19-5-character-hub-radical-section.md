# Story 19.5: Character Hub Radical Section

## Description

**As a** learner,
**I want to** see the radical breakdown of any character in the Character Detail Hub,
**So that** I can understand character composition from any context.

## Business Value

The Character Detail Hub is the central reference point for character information across the entire app. Adding a radical decomposition section ensures that whenever a learner opens the Hub — from vocabulary, stroke animations, review, or reading — they instantly see which radicals compose the character. This creates a consistent "radicals-first" learning experience throughout PinyinPal.

## Acceptance Criteria

- [x] Character Detail Hub shows a "Radical Decomposition" section when character data has radical info (verify: Hub → radical section renders for characters with known radicals)
- [x] Section displays the character's radical(s) with glyph, name, meaning (verify: radical info renders correctly)
- [x] Each displayed radical is clickable → opens that radical's detail card from radicals feature (verify: tap radical → navigates to radical detail)
- [x] Section is phase-gated: visible for Phase 2+ users (verify: Phase 2 user sees section, Phase 1 user does not)
- [x] Section gracefully hides (doesn't render empty container) when radical data is unavailable for a character (verify: rare/unknown character → no empty section shown)

## Business Rules

1. Section phase-gated — renders only when PhaseGate.currentPhase >= 2
2. Uses radical-character-mapping.json (or character JSON data with radical fields) to determine decomposition
3. No empty container rendered when radical data is unavailable for a character

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.3 / **Backend RadicalProgress + SRS Review Integration** ([story-19-3-backend-radical-progress.md](story-19-3-backend-radical-progress.md)) (Depends on — for progress data, can be designed in parallel)

## Implementation Status

- **Status**: ✅ Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: 0cb2879
