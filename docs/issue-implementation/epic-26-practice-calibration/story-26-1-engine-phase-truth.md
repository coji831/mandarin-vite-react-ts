---
purpose: Phase registry and card rebuilt — PHASE_CONFIGS[3], a distinct tier-2 phase 4, up-to-phase aggregation, and one labelled CTA per assessment, with the hook's first 14 tests
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-1: Engine Truth — Phase Configs, Aggregation, and the Practice Card

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-1-engine-phase-truth.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `b61158ff` (feat(epic-26): story-26-1 quiz engine tells the truth about phases)

## Implementation Summary

Three defects in the Practices card had one shared cause: nothing tested the phase data. The commit fixes
the registry, the aggregation and the card, and adds the hook's **first** tests (14) plus 4 component
tests, so the defects cannot return unnoticed.

- **`PHASE_CONFIGS[3]`** now exists and holds the two reading/grammar formats (`cloze`,
  `sentence-building`) whose ids story 26-6 would register. Without it "a Phase-3 quiz" was not a thing
  the code could express.
- **Phase 4 is no longer a copy of Phase 2.** Both Phase-4 entries carry `tier: 2`; `getQuizzesUpToPhase()`
  normalises `tier: quiz.tier ?? 1` onto every flattened entry, so a Phase-4 payload differs from a
  Phase-2 payload by data, not by a hardcoded comparison. `quizLabel()` appends `(tier 2)`.
- **Aggregation is up-to-phase, not current-phase.** `getQuizzesUpToPhase(currentPhase)` filters
  `phase <= currentPhase` and flat-maps in phase order then config order, so a passed phase keeps its
  assessments as optional practice (BM-1 L6: signals, not walls).
- **One labelled CTA per assessment.** The card maps the list to a `<li>` per assessment with a
  `Button variant="secondary"` whose `aria-label` is `Take ${label}`; the "always `quizzes[0]`" behaviour
  is gone, and the card owns no primary (a Browse page keeps its own).
- **Timeline state is text.** `PhaseTimelineState` (`passed` / `current` / `unpassed` / `later`) is
  rendered as words joined by `·`, the icon is `aria-hidden` decoration only, a passed phase keeps its
  current marker when it is the current phase, and nothing is described as locked.

This commit also contains the epic's design spec (`apps/frontend/src/features/quiz/docs/design.md`
§26.0–§26.7), which is the surface contract every later story builds against.

## Technical Scope

Fix the phase registry, the aggregation helper and the Practice card; add the hook's missing tests and the
card's stories.

**Files:**

- `apps/frontend/src/features/quiz/engine/PhaseStrategyRegistry.ts` — update: `PhaseQuizConfig.tier?: number`,
  `PHASE_CONFIGS[3]`, `tier: 2` on both Phase-4 entries, new `PhaseQuizEntry` and
  `getQuizzesUpToPhase()`. `getPhaseConfig` / `getPhaseQuizzes` unchanged in behaviour.
- `apps/frontend/src/features/quiz/hooks/useQuizCard.ts` — update: reads `getQuizzesUpToPhase`, exports
  `PhaseTimelineState` / `TIMELINE_STATE_LABELS`, `QUIZ_LABELS` grows to 7 ids, `quizLabel(type, tier)`
  exported.
- `apps/frontend/src/features/quiz/components/QuizCard.tsx` — update: rebuilt as three parts
  (`QuizCard`, `QuizCardAssessments`, `QuizCardTimeline`), one CTA per assessment, text states, no lock.
- `apps/frontend/src/features/quiz/components/QuizCard.css` — **NEW**: the card's structural rules only.
- `apps/frontend/src/features/quiz/components/QuizCard.stories.tsx` — **NEW**: 6 states (`Default`,
  `CurrentPhasePassed`, `AggregatedPhases`, `NoAssessments`, `TierTwo`, `Edge`).
- `apps/frontend/src/features/quiz/components/__tests__/QuizCard.test.tsx` — update: 4 tests.
- `apps/frontend/src/features/quiz/hooks/__tests__/useQuizCard.test.tsx` — **NEW**: 14 tests.
- `apps/frontend/src/features/quiz/index.ts` — update: barrel exports `getQuizzesUpToPhase`,
  `PhaseQuizEntry`, `quizLabel` and the timeline types.
- `apps/frontend/src/features/quiz/docs/design.md` — **NEW (in this commit)**: §26.0 Step-0 revalidation,
  §26.1 per-epic spec, §26.2 completion-slot contract, §26.3 per-format surfaces, §26.4 data notes,
  §26.5 story slicing, §26.6 token budget, §26.7 signed-off decisions.

## Implementation Details

### The aggregation helper

```typescript
export interface PhaseQuizEntry extends PhaseQuizConfig {
  phase: number;
  tier: number;
}

export function getQuizzesUpToPhase(currentPhase: number): PhaseQuizEntry[] {
  return [1, 2, 3, 4]
    .filter((phase) => phase <= currentPhase)
    .flatMap((phase) =>
      getPhaseQuizzes(phase).map((quiz) => ({ ...quiz, phase, tier: quiz.tier ?? 1 })),
    );
}
```

Phase order then config order is the product order; `tier` is normalised here so no consumer has to know
that "absent means 1". A guest with no gate resolves to phase 1 at the hook boundary
(`phaseGate?.currentPhase ?? 1`), so their card lists phase 1 rather than nothing.

### The timeline state, as data

```typescript
const state: PhaseTimelineState = isCurrent
  ? "current"
  : isPassed
    ? "passed"
    : p < currentPhase
      ? "unpassed"
      : "later";
```

The precedence is deliberate: **current outranks passed**, so "Phase 1 — passed — current" is expressible
and the current marker does not disappear the moment a phase is passed. `isLocked` survives on the entry as
`p > currentPhase` for sequencing copy, and the card maps it to the word "later" — never to a padlock.

### One CTA per assessment

```typescript
{quizzes.map((quiz) => (
  <li key={`${quiz.type}-${quiz.tier}`} ...>
    <span className="font-sm text-secondary">{quiz.label}</span>
    <Button variant="secondary" size="sm" aria-label={`Take ${quiz.label}`}
      onClick={() => takeQuiz(quiz.type)}>Take</Button>
  </li>
))}
```

The key carries the tier because Phase 4 re-runs two Phase-2 ids — keying on `type` alone would collide.

## Architecture Integration

```
PracticesPage
   └─ QuizCard (presentational: no hooks)
        ▲ props from useQuizCard
        │
     useQuizCard ── usePhaseGate().phaseGate.currentPhase
        └─ getQuizzesUpToPhase ── PHASE_CONFIGS [1..4]
                                   └─ phase 4: tier 2 (distinct payload)
```

The card calls no hook, so it can be rendered from any phase payload in Storybook; the hook owns the only
reads (`usePhaseGate` + the registry) and the only navigation (`takeQuiz` → `withSearchParams(practices_quiz,
{ type })`).

## Technical Challenges & Solutions

```
Problem:  Phase 4 could be made "distinct" by giving it different ids, which would have been a content
          decision disguised as a bug fix — and would have broken the product meaning of "Phase 4
          re-runs the Phase-2 formats harder".
Solution: a `tier` discriminator on the config plus a normalised `tier` on every flattened entry, so the
          payloads differ by data (phase 4 = same ids at tier 2) and the label says so ("IME Simulator
          (tier 2)"). The test asserts inequality of the two payloads rather than equality to a literal,
          so re-tuning the tier scheme does not require rewriting the assertion.
```

```
Problem:  The hook had zero tests, so "current-only aggregation" was invisible. A test that asserted the
          card's rendered text would have passed before the fix too (both lists render labels).
Solution: the tests target the registry and the hook (`getQuizzesUpToPhase`, `quizLabel`, timeline state)
          where the defect was, with the component tests covering only what the component owns: one CTA per
          assessment, text states, no lock affordance, shared `Icon` not emoji.
```

## Testing Implementation

| Suite                            | Command                                                   | Result                      |
| -------------------------------- | --------------------------------------------------------- | --------------------------- |
| Hook + card (targeted)           | `npx vitest run src/features/quiz --project='!storybook'` | 14 hook tests; 4 card tests |
| Frontend full suite (epic close) | `npm run test:full --workspace=@mandarin/frontend`        | 167 files / 1245 tests pass |
| Storybook (epic close)           | `npx vitest run --project storybook`                      | 70 files / 421 tests pass   |

Edge cases covered by test: a guest with no gate; a phase-3 learner (non-empty list); a phase-1 learner
(no phase-2+ entries); a passed phase that is still current; every timeline entry having a text state; a
tier-2 re-run being labelled; a card with no assessments rendering no list.

### Doc Truth-Check

- [x] No endpoint is documented in this story — it is a frontend registry/card change.
- [x] Component and module names verified against `apps/frontend/src/features/quiz/**` on disk.
- [x] Data source: `PHASE_CONFIGS` is a module constant in the frontend; numeric quiz config
      (`passThreshold`, `questionCount`, `timeLimitMinutes`) still comes from the backend at runtime and
      is not restated here.
- [x] Relative links resolve (`npm run check:doc-links` — no epic-26 file in the failure list).
- [x] `last-verified` / Last Update = 2026-10-31.
