# Story 18.4: Stroke Order Reference & Animations

**Last Updated:** June 19, 2026

## Description

**As a** new learner,
**I want to** reference the 8 basic strokes and 4 stroke order rules, and watch animated stroke order demonstrations for any character,
**So that** I can learn proper handwriting technique.

## Business Value

Stroke order knowledge enables learners to write characters correctly, look up unknown characters by radical/stroke count, and understand character decomposition. The 8 basic strokes (点横竖撇捺提折钩) are the atomic building blocks of all Chinese characters — mastering them first makes all future handwriting easier. Hanzi Writer provides interactive SVG animations without backend dependency. The "95% rule" (once you know these 4 rules, you can guess stroke order for most characters) reduces the cognitive load of memorizing each character individually.

## Acceptance Criteria

- [x] Stroke Reference tab renders 8 basic strokes grid: 点(diǎn), 横(héng), 竖(shù), 撇(piě), 捺(nà), 提(tí), 折(zhé), 钩(gōu) with glyph, pinyin name, and English meaning (verify: all 8 strokes visible)
- [x] 4 stroke order rules render with visual character examples: Top→Bottom (三), Left→Right (川), Outside→Inside (日), Close frame last (回) (verify: all 4 rules with examples present)
- [x] Stroke Animations tab renders character search input field (verify: text input renders, accepts hanzi)
- [x] Typing a character and pressing search renders Hanzi Writer SVG animation (verify: type "水" → animation plays)
- [x] Animation controls: Play, Pause, Step Forward, Step Back, Speed Slider (verify: all controls function)
- [x] Speed slider ranges from 0.5x to 3x with default 1x (verify: slider renders, speed changes take effect)
- [x] Stroke breakdown shows individual strokes of current character (verify: 水 shows ㇀ ㇇ ㇒ ㇏ components)
- [x] Suggested characters row: 一丨人大口口水火木日月 — quick-select buttons (verify: 10 buttons present, clicking loads that character's animation)
- [x] All data loaded from `public/data/foundations/strokes.json` (verify: network tab shows JSON load)
- [ ] (Deferred to Story 18.5 — stub in place with console.log)
- [x] Hanzi Writer library lazy-loaded (only loaded when user visits Animations tab, not on initial page load) (verify: network tab shows hanzi-writer.js loads on tab switch)
- [x] Mobile responsive: stroke grid wraps to 4 columns, animation canvas scales to viewport width (verify: mobile emulation shows responsive layout)

## Business Rules

1. 8 basic strokes are: 点(dot), 横(horizontal), 竖(vertical), 撇(left-falling), 捺(right-falling), 提(rise), 折(bend), 勾(hook)
2. 4 stroke order rules are: Top→Bottom, Left→Right, Outside→Inside, Close frame last
3. Hanzi Writer handles 9000+ characters — no need to maintain a stroke data file
4. Suggested characters are the 10 most common/illustrative for beginners
5. Stroke animations are SVG-based (no video or GIF fallback needed)

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Story 18.5: Character Detail Hub (Downstream — stroke animations embedded in Hub)
- Story 18.1: Foundations Page Structure (Dependency — provides the StrokeAnimTab mount point)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD

## Implementation Notes

- Created `public/data/foundations/strokes.json` — 8 basic strokes, 4 stroke order rules, 10 suggested characters
- Created `StrokeReferenceTab` with `BasicStrokesGrid` (8-stroke grid with per-stroke cards) and `StrokeRulesList` (4 rules with examples)
- Created `StrokeAnimationTab` with `CharacterSearchBar`, `AnimationPanel`, `SuggestionPanel` — controlled component pattern
- Installed `hanzi-writer@3.7.3` — character stroke order SVG animation library
- Custom `charDataLoader` using `fetch()` with CDN fallback for character stroke data
- Playback controls: Play, Pause, Step Forward, Step Back, Speed Slider (0.5x-3x)
- Stroke breakdown with clickable SVG path thumbnails to jump to a specific stroke
- Dynamic stroke order rule detection from character median data
- Pages layer is pure layout orchestration (modulith pattern) — all logic in `features/foundations/hooks/` and `features/foundations/components/`
- Hanzi Writer lazy-loaded via dynamic `import()` in useEffect
- Character Detail Hub click stubbed with console.log (Story 18.5)
