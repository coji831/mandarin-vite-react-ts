# Story 18.6: Audio-to-Type Quiz (Phase 1 Gate)

**Last Updated:** June 17, 2026

## Description

**As a** learner,
**I want to** take an audio-to-type quiz that tests pinyin typing and tone selection,
**So that** I can demonstrate Phase 1 mastery and unlock Phase 2 content.

## Business Value

The Phase 1 gate quiz ensures learners have achieved ≥90% accuracy on pinyin and tones before progressing to character-based content (Phase 2+). This prevents the knowledge cascade failure where weak pinyin skills make radical/character learning ineffective. The quiz covers 4 categories (Pinyin, Tones, Pairs, Rules) and provides targeted feedback so learners know exactly what to practice. Backend persistence via QuizAttempt + PhaseGate means progress is saved cross-device and the system can track qualification attempts for analytics.

## Acceptance Criteria

- [ ] Quiz presents 20 randomized questions: play audio → type pinyin in text input → select tone marker (1-4 buttons + neutral) (verify: quiz flow works end-to-end)
- [ ] Audio plays via AudioService on each question load, with replay button (verify: 🔊 button replays audio)
- [ ] Pinyin input is a text field accepting standard pinyin characters (with tone mark support) (verify: type "mā" or "ma1" both accepted)
- [ ] Tone selector shows 5 buttons: ˉ1st, ˊ2nd, ˇ3rd, ˋ4th, ·0 — with tone colors matching the pinyin tone scheme (verify: all 5 buttons present, colored correctly)
- [ ] Instant feedback after each answer: correct/incorrect badge, correct pinyin+tone revealed on wrong answer, "Play again" button (verify: wrong answer shows correct answer and replay works)
- [ ] Progress bar updates after each answer showing current score vs 90% pass target (verify: bar fills proportionally, target line visible at 90%)
- [ ] Score ≥90% (18/20) → pass screen with celebration state, "Continue to Phase 2" CTA, category breakdown chart (verify: pass flow renders correctly)
- [ ] Score <90% → fail screen with retry button, category breakdown showing weak areas (verify: fail flow renders, retry starts new quiz)
- [ ] Category breakdown shows 4 categories: Pinyin recognition, Tone identification, Tone pairs, Tone change rules with percentage scores (verify: all 4 categories with scores render)
- [ ] Quiz results persisted via backend: POST to /api/v1/progression/quiz-attempts (verify: network tab shows API call)
- [ ] On pass (≥90%): PhaseGate updated via PUT /api/v1/progression/phase-gate to currentPhase=2 (verify: phase gate API called with correct data)
- [ ] Questions are randomized each attempt (verify: two attempts show different question order)
- [ ] Backend QuizAttempt stores totalScore, maxScore, passed, quizType (verify: database shows correct record)
- [ ] Backend PhaseGate stores currentPhase, phase1Passed, gateCriteria (verify: database shows phase1Passed=true after passing)
- [ ] Quiz is accessible from /practices/quiz?type=audio-to-type route (verify: navigate to route → quiz loads)
- [ ] Mobile responsive: quiz layout adapts to viewport ≥320px, tone buttons wrap to 2 rows on small screens (verify: mobile emulation shows usable layout)

## Business Rules

1. Quiz consists of 20 randomly selected questions from a pool of pinyin/tones combinations
2. Pass threshold: ≥90% (18/20 correct)
3. Quiz type identifier: "audio-to-type"
4. Questions cover 4 categories: pinyin recognition, tone identification, tone pairs, tone change rules
5. Backend QuizAttempt records: userId, quizType, totalScore, maxScore, passed, createdAt
6. Backend PhaseGate updates on pass: currentPhase=2, phase1Passed=true, gateCriteria="quiz"
7. Learners can retry unlimited times until they pass
8. Past attempts are viewable via GET /api/v1/progression/quiz-attempts

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Epic 18 Impl: `docs/issue-implementation/epic-18-foundations/README.md` (Backend progression module)
- Story 18.2: Pinyin System Guide (Prerequisite — quiz content knowledge)
- Story 18.3: Tones Reference & Practice (Prerequisite — quiz content knowledge)
- Story 18.1: Foundations Page Structure (Dependency — quiz page routing)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
