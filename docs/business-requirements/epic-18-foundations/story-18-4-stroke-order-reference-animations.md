# Story 18.4: Stroke Order Reference & Animations

**Last Updated:** June 17, 2026

## Description

**As a** new learner,
**I want to** reference the 8 basic strokes and 4 stroke order rules, and watch animated stroke order demonstrations for any character,
**So that** I can learn proper handwriting technique.

## Business Value

Stroke order knowledge enables learners to write characters correctly, look up unknown characters by radical/stroke count, and understand character decomposition. The 8 basic strokes (点横竖撇捺提折钩) are the atomic building blocks of all Chinese characters — mastering them first makes all future handwriting easier. Hanzi Writer provides interactive SVG animations without backend dependency. The "95% rule" (once you know these 4 rules, you can guess stroke order for most characters) reduces the cognitive load of memorizing each character individually.

## Acceptance Criteria

- [ ] Stroke Reference tab renders 8 basic strokes grid: 点(diǎn), 横(héng), 竖(shù), 撇(piě), 捺(nà), 提(tí), 折(zhé), 钩(gōu) with glyph, pinyin name, and English meaning (verify: all 8 strokes visible)
- [ ] 4 stroke order rules render with visual character examples: Top→Bottom (三), Left→Right (川), Outside→Inside (日), Close frame last (回) (verify: all 4 rules with examples present)
- [ ] Stroke Animations tab renders character search input field (verify: text input renders, accepts hanzi)
- [ ] Typing a character and pressing search renders Hanzi Writer SVG animation (verify: type "水" → animation plays)
- [ ] Animation controls: Play, Pause, Step Forward, Step Back, Speed Slider (verify: all controls function)
- [ ] Speed slider ranges from 0.5x to 3x with default 1x (verify: slider renders, speed changes take effect)
- [ ] Stroke breakdown shows individual strokes of current character (verify: 水 shows ㇀ ㇇ ㇒ ㇏ components)
- [ ] Suggested characters row: 一丨人大口口水火木日月 — quick-select buttons (verify: 10 buttons present, clicking loads that character's animation)
- [ ] All data loaded from `public/data/foundations/strokes.json` (verify: network tab shows JSON load)
- [ ] Clicking the animated character opens the Character Detail Hub (verify: click character → Hub slides up)
- [ ] Hanzi Writer library lazy-loaded (only loaded when user visits Animations tab, not on initial page load) (verify: network tab shows hanzi-writer.js loads on tab switch)
- [ ] Mobile responsive: stroke grid wraps to 4 columns, animation canvas scales to viewport width (verify: mobile emulation shows responsive layout)

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

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
