# Story 21.17: Tone Sandhi Practice Quiz

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** practice tone sandhi rules in context through interactive drills,
**So that** I can internalize how tones change in natural speech (3-3 → 2-3, 不 before 4th, 一 tone shifts).

## Business Value

Tone sandhi is one of the most challenging aspects of spoken Chinese for learners, yet the platform has no dedicated practice for it. The Audio-to-Type quiz (Story 21.16) adds passive sandhi-aware scoring, but learners need active practice to internalize the rules. This story creates a SandhiDrill micro-quiz: rule explanation cards teach each sandhi rule with examples, followed by a 10-question drill where learners compare dictionary vs. spoken pinyin. Results are stored as a new `QuizAttempt.quizType = "sandhi-drill"`, enabling future analytics on sandhi mastery. Estimated effort is ~2-3 days.

## Acceptance Criteria

- [ ] SandhiDrill section created in the TonesTab with rule explanation cards for each sandhi rule
- [ ] Rule cards cover: (a) 3-3 → 2-3 (e.g., 你好 nǐ hǎo → ní hǎo), (b) 不 before 4th tone (bù → bú), (c) 一 before 4th tone (yī → yí), (d) 一 before non-4th tone (yī → yì)
- [ ] 10-question drill where learner sees a word/phrase and selects the correct spoken pinyin (comparing dictionary vs. sandhi form)
- [ ] Results stored as `QuizAttempt.quizType = "sandhi-drill"` with score, rule-specific breakdown, and completion status
- [ ] New quiz strategy implemented following the existing strategy pattern
- [ ] Storybook stories created covering rule cards, drill questions, and results states
- [ ] Unit tests for sandhi drill scoring and question generation
- [ ] MSW handlers created for the sandhi-drill endpoint
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Strategy Pattern** — The SandhiDrill follows the existing quiz strategy pattern (defined in quiz architecture). A new `SandhiDrillStrategy` class implements the standard strategy interface: `generateQuestions()`, `scoreAnswer()`, `getResults()`.
2. **Rule Cards** — Each rule card shows: rule name (e.g., "Third Tone Sandhi"), the rule formula (e.g., "3-3 → 2-3"), 2-3 example word pairs with audio, and a brief mnemonic. Cards are laid out in a 2×2 grid (desktop).
3. **Drill Questions** — Each question presents a word or 2-character phrase. The learner sees the characters and must select the correct spoken pinyin from 4 options (mix of dictionary forms, sandhi forms, and distractors). Audio playback is included for each question.
4. **QuizAttempt Extension** — `QuizAttempt.quizType` enum extended with `"sandhi-drill"`. The metadata JSON stores rule-specific breakdown: `{ ruleScores: { "3-3-sandhi": { correct: 3, total: 4 }, "bu-before-4th": { correct: 2, total: 2 }, ... } }`.
5. **Passing Threshold** — A score of ≥70% on the sandhi drill is required to pass. Below that, the learner is encouraged to review the rule cards and retry. This threshold is defined in the gate thresholds config file.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.3: Passage Generation Backend** ([BR](story-21-3-passage-generation.md)) (dependency — ToneSandhiService for generating sandhi rules)
- **Story 21.16: Audio-to-Type Neutral Tone & Sandhi Extension** ([BR](story-21-16-audio-to-type-neutral-tone-sandhi.md)) (dependency — sandhi-aware scoring logic and QuizAttempt metadata extension)
- Epic 18: Character Foundations (coordination — SandhiDrill lives in TonesTab within features/foundations/)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
