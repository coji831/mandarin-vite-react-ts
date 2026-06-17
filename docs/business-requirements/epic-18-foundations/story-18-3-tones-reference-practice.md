# Story 18.3: Tones Reference & Practice

**Last Updated:** June 17, 2026

## Description

**As a** new learner,
**I want to** study tone contours, practice tone pair drills, and learn tone change rules (3rd tone sandhi, 一/不),
**So that** I can distinguish and produce the four tones correctly.

## Business Value

Tone distinction is the hardest skill for Mandarin beginners. The reference section provides visual tone contours (showing pitch shape) with audio examples — appealing to both visual and auditory learners. Tone pair drills address the most common failure point (hearing tones in multi-syllable words). Tone change rules (3rd sandhi, 一, 不) are essential for natural speech and must be learned early before bad habits form.

## Acceptance Criteria

- [ ] Tone reference section renders 4 tone cards with pitch contour visualization (verify: each card shows a visual pitch line: high level, rising, dip-rising, falling)
- [ ] Each tone card plays native pronunciation on click via AudioService (verify: click 1st tone → hear "mā", click 2nd → "má", etc.)
- [ ] Tone pair drills section shows common 2-syllable combinations with TTS playback (verify: 你好 plays as "ní hǎo", not "nǐ hǎo" — sandhi applied)
- [ ] Tone change rules section renders 3 rule cards: 3rd tone sandhi, 一 tone changes, 不 tone changes with examples (verify: all 3 rules visible with example characters and pinyin)
- [ ] 3rd tone sandhi rule card explains Rule: 3rd+3rd → 2nd+3rd, examples: 你好, 很好 (verify: text and audio examples present)
- [ ] 一 tone change rule card explains Rule: yī → yí before 4th tone, examples: 一个, 一起 (verify: text and audio examples present)
- [ ] 不 tone change rule card explains Rule: bù → bú before 4th tone, examples: 不是, 不对 (verify: text and audio examples present)
- [ ] All data loaded from `public/data/foundations/tones.json` (verify: network tab shows JSON load)
- [ ] Audio playback shows loading state while TTS generates (verify: click play → spinner → audio)
- [ ] Mobile responsive: tone cards stack vertically on viewports <640px (verify: mobile emulation shows stacked layout)

## Business Rules

1. Four tones are: 1st (high level ˉ), 2nd (rising ˊ), 3rd (dip-rising ˇ), 4th (falling ˋ), plus neutral (·)
2. Tone change rules are:
   - 3rd+3rd → 2nd+3rd (你好 → ní hǎo)
   - 一 (yī) → yí before 4th tone (一个 → yí gè)
   - 不 (bù) → bú before 4th tone (不是 → bú shì)
3. Spoken pinyin in tone pair drills uses spokenPinyinOverride values (sandhi applied)
4. Dictionary pinyin is shown alongside spoken pinyin for educational comparison

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Story 18.2: Pinyin System Guide (Prerequisite — learner should know pinyin before tones)
- Story 18.6: Audio-to-Type Quiz (Downstream — quiz includes tone selection)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
