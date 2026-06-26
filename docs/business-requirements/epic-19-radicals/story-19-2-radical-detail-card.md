# Story 19.2: Radical Detail Card

## Description

**As a** learner,
**I want to** tap a radical to see its detail card showing glyph, meaning, example characters with audio/Hub triggers, and a mnemonic generate button,
**So that** I can study each radical in depth.

## Business Value

The Radical Detail Card provides the deep learning experience for each radical — connecting radicals to real characters learners encounter in HSK vocabulary. By showing example characters with audio and Hub navigation, learners build the mental association between radical components and full characters. The mnemonic button (placeholder for Epic 20) communicates future functionality without blocking current delivery.

## Acceptance Criteria

- [ ] Tapping a radical in the grid opens an expandable detail card below the grid row (verify: tap radical → card slides open below)
- [ ] Detail card shows: radical glyph (large), pinyin, English meaning, stroke count, alternate glyphs (verify: all fields present)
- [ ] Example characters grid shows 6-12 HSK characters containing this radical (verify: grid renders with character glyphs)
- [ ] Each example character is clickable → opens Character Detail Hub (verify: tap character → Hub opens with correct character)
- [ ] Each example character has audio play button → TTS pronunciation (verify: play button → audio plays via AudioService)
- [ ] "See all" expand button shows full list of all HSK characters with this radical (verify: expand → full list renders)
- [ ] Mnemonic "Generate Story" button renders as disabled/placeholder with "Coming in Epic 20" tooltip (verify: button visible but disabled, tooltip shows)
- [ ] Card closes on tap outside or tap close button (verify: both dismiss methods work)
- [ ] Card animates with smooth expand/collapse transition (verify: visual animation plays)

## Business Rules

1. Example characters sourced from the radical's `metadata.hsk_characters` array in the content JSON
2. Mnemonic "Generate Story" button renders as disabled only — no API calls, no backend integration (deferred to Epic 20)
3. Tooltip text: "Coming in Epic 20"

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.1 / **Radicals Browser Structure** ([story-19-1-radicals-browser-structure.md](story-19-1-radicals-browser-structure.md)) (Depends on — grid interaction required)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
