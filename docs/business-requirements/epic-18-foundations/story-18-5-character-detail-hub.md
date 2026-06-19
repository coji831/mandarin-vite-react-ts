# Story 18.5: Character Detail Hub (Phase 1 Minimal)

**Last Updated:** June 19, 2026

## Description

**As a** learner,
**I want to** tap any character to see a minimal slide-up overlay with pinyin, audio, and stroke animation,
**So that** I can learn character details without navigating away from my current context.

## Business Value

The Character Detail Hub is the central information access pattern for the entire learning platform. Phase 1 builds the minimal variant — character hero, pinyin, audio, stroke animation, save to review. This establishes the overlay pattern that future phases extend with radicals (Phase 2), mnemonics (Phase 2+), examples (Phase 3+), and more. By building it as a shared component now, all future content epics get the Hub for free. The slide-up overlay pattern (no route change) means learners never lose their place.

## Acceptance Criteria

- [x] Hub slides up from bottom of viewport as a centered panel (~700px wide on desktop) with dimmed backdrop (verify: slide-up animation plays, backdrop dims to ~50% opacity)
- [x] Hub closes on Esc key press or tapping the dimmed backdrop (verify: both dismiss methods work)
- [x] Hub is stateless — no URL change, no browser back-button interaction (verify: URL unchanged after open/close)
- [x] Character hero section displays large character (64-72px font), pinyin below, and audio play button next to pinyin (verify: character renders at correct size, pinyin visible, 🔊 button plays TTS audio)
- [x] Stroke animation section displays inline Hanzi Writer animation of the character with play/pause/step/speed controls (verify: animation renders and controls function)
- [x] Save to Review button adds character to SRS queue (verify: button renders, click triggers API call)
- [x] Mark Learned button marks character as known (verify: button renders, click triggers API call)
- [x] Hub is a React portal overlay (rendered in document.body, not nested in component tree) (verify: DOM inspector shows portal at document.body level)
- [x] Hub state managed via lightweight zustand store: `hubStore` with { isOpen, character, position } (verify: store updates correctly)
- [x] Hub progressively reveals sections based on phase: Phase 1 shows minimal variant only (verify: Phase 1 user sees no radical/mnemonic/example sections)
- [x] Animation trigger: Hub opens with a scale-up animation from the tap/click position (verify: visual inspection of open animation)
- [x] Mobile responsive: panel uses full width on viewports <640px, slides up from bottom edge (verify: mobile emulation shows full-width panel)

## Business Rules

1. Hub is a shared component — not tied to any single feature. Location: `src/shared/components/CharacterDetailHub/`
2. Phase-gated sections: Phase 1 = minimal (char, pinyin, audio, stroke, save). Future phases add more sections.
3. Hub is stateless — no route change on open/close. Caller determines what to show.
4. State managed by zustand store (hubStore) — not Context (unnecessary re-renders for sibling components)
5. "Save to Review" calls CharacterProgress backend API (uses existing `useProgress` pattern)
6. "Mark Learned" sets CharacterProgress confidence to a high value (e.g., 0.9)

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Story 18.4: Stroke Order Reference & Animations (Integration — Hub opens from stroke anim tab)
- Story 18.1: Foundations Page Structure (Dependency — provides routing infrastructure)
- Future: Epic 19 Radicals (Hub adds radical decomposition section)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: June 19, 2026
- **Key Commit**: `b07cee5`

## Implementation Notes

- Hub built as a feature under `features/character-hub/` with controlled components
- Cross-cutting state via `shared/store/hubStore.ts` (zustand)
- Cross-cutting hooks: `shared/hooks/useCharacterHub.ts` (trigger), `shared/hooks/useReview.ts` (SRS), `shared/hooks/useAudioPlayback.ts` (audio)
- Stroke animation uses `useHanziWriter` from `features/foundations/hooks` (approved cross-feature exception)
- Phase 1 minimal: character hero card with hanzi-writer, playback controls, audio, Save to Review
- Mounted in `AppLayout.tsx` as React Portal → document.body
- Trigger: `useCharacterHub().openHub(char, pinyin)` from any feature
