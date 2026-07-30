# Story 21.17: Tone Sandhi Practice Quiz

**Last Update:** July 30, 2026

## Description

**As a** learner,
**I want to** practice tone sandhi rules in context through interactive drills,
**So that** I can internalize how tones change in natural speech (3-3 → 2-3, 不 before 4th, 一 tone shifts).

## Business Value

Tone sandhi is one of the most challenging aspects of spoken Chinese for learners, yet the platform has no dedicated practice for it. The Audio-to-Type quiz (Story 21.16) adds passive sandhi-aware scoring, but learners need active practice to internalize the rules. This story creates a SandhiDrill micro-quiz: rule explanation cards teach each sandhi rule with examples, followed by a 10-question drill where learners compare dictionary vs. spoken pinyin. Results are stored as a new `QuizAttempt.quizType = "sandhi-drill"`, enabling future analytics on sandhi mastery. Estimated effort is ~2-3 days.

## Acceptance Criteria

- [x] Backend `SandhiDrillService` generates sandhi drill questions from the database word bank
- [x] Questions cover: (a) 3-3 → 2-3 (e.g., 你好 nǐ hǎo → ní hǎo), (b) 不 before 4th tone (bù → bú), (c) 一 before 4th tone (yī → yí), (d) 一 before non-4th tone (yī → yì)
- [x] API endpoint `GET /v1/quiz/sandhi-drill/questions?count=10` returns `DrillQuestion[]` with 4 multiple-choice options
- [x] Results posted to existing `POST /v1/quiz/attempts` with `quizType: "sandhi-drill"` (no Prisma changes needed)
- [x] `@mandarin/shared-utils` extended with bu/yi sandhi rules in `isSandhiAcceptable()` + new `applyToneMark()` helper
- [x] Unit tests for `SandhiDrillService` (question generation, scoring) and `toneSandhiUtils` (bu/yi rules, applyToneMark)
- [x] 0 TypeScript errors across all changed files
- [x] All backend conventions followed (error message format, service layer pattern, DI via constructor)
- [x] SandhiDrill section created in TonesTab with rule explanation cards and 10-question drill
- [x] ~~Storybook stories created covering rules intro, drill active, results, loading, and error states~~ **N/A** — feature components don't get Storybook stories per project convention
- [x] Unit tests for SandhiDrill component (11 tests) and sandhiDrillService (6 tests)
- [x] MSW handlers created for sandhi-drill questions endpoint
- [x] 0 lint errors across all changed files

## Business Rules

1. **Drill Widget Pattern (NOT strategy registry)** — The SandhiDrill does NOT register in the quiz strategy registry. It's a standalone service with its own controller and route, following the "Drill Widget" pattern. The backend is the source of truth for question generation.
2. **Backend Sources Questions from DB** — `SandhiDrillService` queries `Word` + `WordCharacter` + `Character` + `CharacterReading` tables to find real 2-character words matching sandhi patterns. Questions are distributed proportionally across all 4 rules.
3. **Drill Questions** — Each question presents a word or 2-character phrase. The learner sees the characters and must select the correct spoken pinyin from 4 shuffled options (sandhi form + dictionary form + 2 distractors).
4. **QuizAttempt Reuse** — Results are stored via the existing `POST /v1/quiz/attempts` endpoint with `quizType: "sandhi-drill"`. The `quizType` field is `String` (not enum), so no Prisma migration is needed. Rule-specific breakdowns are stored in the existing `metadata` JSON field.
5. **Passing Threshold** — A score of ≥70% on the sandhi drill is required to pass. Below that, the learner is encouraged to review the rule cards and retry. This threshold is defined as a local constant in the frontend SandhiDrill component.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.16: Audio-to-Type Neutral Tone & Sandhi Extension** ([BR](story-21-16-audio-to-type-neutral-tone-sandhi.md)) (dependency — sandhi-aware scoring logic and QuizAttempt metadata extension)
- Epic 18: Character Foundations (coordination — SandhiDrill lives in TonesTab within features/foundations/)

## Implementation Status

- **Status**: Implemented
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD

### Completed (Backend)

- [x] Extended `packages/shared-utils/src/sandhi/toneSandhiUtils.ts` with bu-before-4th, yi-before-4th, yi-before-non4th rules + `applyToneMark()` helper
- [x] Added 14 new tests to `toneSandhiUtils.test.ts` covering all 3 new rules + `applyToneMark()`
- [x] Created `apps/backend/src/modules/quiz/strategies/SandhiDrillService.ts` — question generation engine querying Word + CharacterReading tables
- [x] Created `apps/backend/src/modules/quiz/strategies/__tests__/SandhiDrillService.test.ts` — 8 tests covering generate, clamp, scoring
- [x] Created `apps/backend/src/modules/quiz/api/SandhiDrillController.ts` — GET endpoint with validation + error handling
- [x] Added route `GET /v1/quiz/sandhi-drill/questions` to `quizRoutes.ts`
- [x] 0 TypeScript errors, all tests pass (31 shared-utils + 8 SandhiDrillService + all existing quiz tests)

### Completed (Frontend)

- [x] Created `apps/frontend/src/features/foundations/services/sandhiDrillService.ts` — service layer with `getSandhiDrillQuestions()`, `calculateScore()`, `submitSandhiDrillAttempt()`
- [x] Created `apps/frontend/src/features/foundations/components/tones/SandhiDrill.tsx` — main drill widget with rules intro, active drill, results, loading, and error states
- [x] Created `apps/frontend/src/features/foundations/components/tones/SandhiDrill.css` — styles using CSS variables from globals.css
- [x] ~~Created Storybook stories covering all 6 visual states~~ **Removed** — feature components don't get Storybook stories per project convention
- [x] Created component tests (11 tests) and service tests (6 tests)
- [x] Created MSW handlers for quiz endpoints in `src/mocks/handlers/quiz-handlers.ts`
- [x] Added `quizSandhiDrill` route constant to shared-constants
- [x] Updated barrel exports (components/index.ts, foundations/index.ts)
- [x] Embedded SandhiDrill in TonesTab below ToneChangeRules
