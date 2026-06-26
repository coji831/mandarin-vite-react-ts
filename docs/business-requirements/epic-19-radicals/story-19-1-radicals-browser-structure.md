# Story 19.1: Radicals Browser Structure

## Description

**As a** learner,
**I want to** browse radicals in an interactive grid with search, stroke count filter, and a "Show top 20 only" toggle,
**So that** I can discover and explore radicals systematically.

## Business Value

The radicals browser is the foundational UI for the entire radicals experience. Without a well-designed browsing interface, learners cannot discover radicals, access detail cards, or navigate to radical trees. This story delivers the primary entry point for radical learning — a fast, filterable grid that makes radical discovery intuitive and efficient. The grid replaces the existing `/learn/radicals` placeholder with real content, unlocking the Phase 2 learn tab.

## Acceptance Criteria

- [x] Radicals page accessible at `/learn/radicals` with filterable grid view (verify: navigate to route, grid renders)
- [x] Content loaded from `content/radicals/*.json` files via content registry in `content/manifest.json` (verify: radical data loads, console shows parsed entries)
- [x] Grid displays radical glyph, pinyin name, English meaning, and stroke count per card (verify: each card has all 4 fields)
- [x] Stroke count filter allows filtering by stroke count (1-17+ strokes) (verify: filter dropdown renders, selection filters grid)
- [x] Search input filters radicals by pinyin, meaning, or glyph (verify: type "water" → shows 氵-related radicals)
- [x] "Show top 20 only" toggle switches between full dataset and recommended subset (verify: toggle renders, toggling changes visible count)
- [x] Top 20 radicals display a visual ★ badge indicator (verify: ★ visible on recommended radicals)
- [x] Phase-gated TabBar shows radicals tab active for Phase 2+ users (verify: Phase 2 user sees tabs, Phase 1 user sees lock icon)
- [x] Grid loads in <500ms on first visit (verify: network tab timing)
- [x] Mobile responsive: grid renders correctly on viewports ≥320px (verify: mobile emulation, cards stack in 2 columns)
- [x] Sort options: by stroke count asc/desc, by kangxi index, alphabetically by meaning (verify: sort selector, grid reorders)

## Business Rules

1. Content loaded from `content/radicals/*.json` files — individual files per radical, discovered via `content/manifest.json` radicals entry
2. "Show top 20 only" toggles between all available radicals and those with `is_recommended: true`
3. Top 20 radicals display a ★ badge based on the `is_recommended` field in the JSON data

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.2 / **Radical Detail Card** ([story-19-2-radical-detail-card.md](story-19-2-radical-detail-card.md)) (Dependent — builds on grid interaction)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: 327fa7e
