# Story 21.18: IME Simulator Phonetic Hints

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** receive phonetic hints when I answer incorrectly in the IME Simulator,
**So that** I can learn from mistakes by seeing the phonetic component relationship, with optional radical hints at a score penalty.

## Business Value

The IME Simulator (Epic 19 feature in `features/radicals/`) currently shows correct/incorrect feedback but does not provide learning support when the user gets an answer wrong. A learner who types the wrong character learns nothing except that they were wrong — a missed pedagogical opportunity. This story adds contextual phonetic hints: when the user answers incorrectly, the sim displays "Hint: This character contains phonetic component [X] (pinyin: [Y])", helping the learner connect the sound to the glyph. A "Show radical hint" toggle is added for when the phonetic hint isn't enough, consuming one hint and reducing the max score by 5%. Score is also broken down by character type (pictograph, phono-semantic, etc.), reinforcing classification awareness. Estimated effort is ~2-3 days.

## Acceptance Criteria

- [ ] IME Simulator shows phonetic hint on wrong answer: "Hint: This character contains phonetic component [X] (pinyin: [Y])"
- [ ] Phonetic component lookup uses the Characters Module API (Story 21.10) for phonetic component data
- [ ] "Show radical hint" toggle available during quiz — consumes one hint, reduces max possible score by 5%
- [ ] Score breakdown by character type shown in quiz results (e.g., "Pictographs: 3/3, Phono-semantic: 5/8, Compound ideographs: 2/2")
- [ ] Classification badges (from Story 21.15) displayed alongside score breakdown
- [ ] Unit tests for hint generation and score penalty logic
- [ ] Storybook stories updated for hint UI states
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Phonetic Hint Generation** — When an answer is incorrect, the sim checks the target character for a phonetic component via the Characters Module API. If found, it displays: "Hint: This character contains phonetic component [glyph] (pinyin: [pinyin], meaning: [meaning]). Try to connect the sound!" If no phonetic component is found (pictographs, simple ideographs), the hint says: "This character doesn't have a phonetic component — try memorizing it by its visual structure."
2. **Radical Hint Toggle** — Below the phonetic hint, a "Show radical hint" link is available. Clicking it displays the character's radical and meaning, deducts one hint from the user's hint pool (max 3 per quiz), and applies a -5% penalty to the max possible score for that question. The penalty is applied to the question, not the overall quiz.
3. **Score by Type** — Quiz results include a classification breakdown table. This uses the same classification data and badge components from Story 21.15. The breakdown shows total correct / total attempted per classification type, helping the learner identify which character types they struggle with.
4. **Hint Pool** — The user starts each IME Simulator quiz with 3 hints. Each hint use (phonetic or radical) consumes one. Hints do not regenerate mid-quiz. Unused hints do not affect the score.
5. **Characters Module Dependency** — This story depends on Story 21.10 (Characters Module) for the phonetic component lookup API. If 21.10 is not yet complete, the hint falls back to the character's radical information available in existing frontend data.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — classification + phoneticComponentId available)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — characters API for phonetic component lookup)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — badge component and classification data)
- Epic 19: Radicals & Character Details (coordination — IME Simulator ownership in features/radicals/)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
