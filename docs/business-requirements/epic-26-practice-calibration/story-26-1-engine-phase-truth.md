---
purpose: Phase registry truth — PHASE_CONFIGS[3], a distinct tier-2 phase 4, phase aggregation up to the current phase, and one labelled CTA per assessment
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.1: Engine Truth — Phase Configs, Aggregation, and the Practice Card

**Last Updated:** October 31, 2026

## Description

**As a** learner on any phase,
**I want** every assessment at or below my phase listed once, with a CTA that starts the one I chose,
**So that** practice matches the progress I actually made.

## Business Value

The Practices card is the only place a learner chooses what to practise. Three defects made that
choice wrong, and none of them was visible in the session itself:

- **Phase 3 had no configuration.** `PHASE_CONFIGS` held entries for 1, 2 and 4. The phase labelled
  "The Network — Reading & Grammar" therefore offered nothing, which is why the roadmap's Phase-3 pilot
  read as a label rather than a feature.
- **Phase 4 was a copy of Phase 2.** Its two `quizzes` entries were byte-identical to Phase 2's, so a
  Phase-4 learner's payload could not be told apart from a Phase-2 learner's, and nothing distinguished
  a re-run at a harder tier from a duplicate.
- **Aggregation was current-phase-only.** `useQuizCard` read `getPhaseQuizzes(currentPhase)`, so the
  moment a learner passed Phase 1, that phase's two assessments disappeared from the card. Under BM-1
  L6 a passed phase is "signals, not walls", which means its practice stays available.

The card also offered **one** CTA for a phase holding two or more assessments, always `quizzes[0]`, so
every other format in that phase was unreachable from the UI it was listed on. And the timeline marked
state with an `aria-hidden` icon, so "current" and "passed" had no text alternative.

## Acceptance Criteria

- [x] `PHASE_CONFIGS` has an entry for every phase from 1 to 4, and Phase 3 lists the two reading/grammar
      formats (`cloze`, `sentence-building`). _Verified: `PHASE_CONFIGS[3]` in
      `engine/PhaseStrategyRegistry.ts`; `useQuizCard.test.tsx` "configures every phase from 1 to 4"._
- [x] Phase 4's payload is distinct from Phase 2's: both entries carry a `tier` discriminator
      (`tier: 2`) and the flattened `PhaseQuizEntry` carries a numeric `tier` on every entry. _Verified:
      `PhaseQuizConfig.tier?: number` and `getQuizzesUpToPhase()`'s `tier: quiz.tier ?? 1`; tests "gives
      phase 4 a payload distinct from phase 2" and "carries the owning phase and a numeric tier on every
      entry"; `quizLabel()` marks a tier-2 entry as `(tier 2)`, pinned by "marks a tier-2 re-run so phase 4
      is not mistaken for phase 2"._
- [x] Practices lists every assessment for phases `<= currentPhase`, in phase order then config order,
      and never one above the current phase. _Verified: `getQuizzesUpToPhase(currentPhase)` filters
      `phase <= currentPhase` and flat-maps in phase order; tests "accumulates earlier phases instead of
      replacing them", "returns only phase 1 assessments for a phase 1 learner", "never returns a quiz from
      a phase above the current one", "gives a phase 3 learner the reading formats rather than an empty
      list", and `useQuizCard` "keeps a passed phase's assessment available as optional practice"._
- [x] The card renders one labelled CTA per assessment, whose accessible name says which assessment it
      starts. _Verified: `QuizCardAssessments` maps `quizzes` to a `<li>` per entry with a Button whose
      `aria-label` is `Take ${quiz.label}`; `QuizCard.test.tsx` "offers one labelled CTA per assessment"._
- [x] The timeline states every phase's state as text ("passed" / "current" / "not passed" / "later"),
      keeps a current marker on the current phase after it was passed, and never claims a lock. _Verified:
      `PhaseTimelineState` + `TIMELINE_STATE_LABELS` in `hooks/useQuizCard.ts`, `STATE_WORDS` in
      `QuizCard.tsx`; tests "states every timeline phase as text, never as an unlabelled icon" and "keeps a
      current marker on the current phase after it was passed"; card tests "never claims a lock on an
      unreached phase" and "uses the shared Icon rather than emoji for the markers"._
- [x] `QUIZ_LABELS` names all seven FE format ids instead of falling through to the raw id. _Verified:
      `QUIZ_LABELS` in `hooks/useQuizCard.ts` holds seven entries including the four Phase-B ids;
      `useQuizCard.test.tsx` "names every registered format instead of falling through to its id"._
- [x] A guest with no gate defaults to Phase 1 rather than to an empty card. _Verified: `useQuizCard`
      reads `phaseGate?.currentPhase ?? 1`; test "defaults a guest (no gate) to phase 1"._

## Business Rules

1. **Sequencing, never a lock.** A phase above the learner's is "later in the sequence"; nothing in the
   card may render a padlock or claim the learner is blocked (BM-1 L6, A25).
2. **A passed phase stays practiceable.** Passing a phase removes nothing from the card.
3. **One CTA per assessment.** The card never chooses an assessment on the learner's behalf by position.
4. **State is text.** Every timeline state carries a word; an icon may accompany it, never replace it.
5. **The card owns no primary.** Its CTAs are `secondary`, so a Browse page keeps its single primary for
   its own job.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.2: Completion Slot** _(link to [`story-26-2-completion-slot-position-locked-cta.md`](story-26-2-completion-slot-position-locked-cta.md))_ (Successor — consumes the aggregated list and the labels)
- **Epic 25: Secure Guest Identity & Route Gating** _(link to [`../epic-25-secure-guest-identity-and-route-gating/README.md`](../epic-25-secure-guest-identity-and-route-gating/README.md))_ (Predecessor — removed the phase walls this card must not re-add)
- **Epic 28: Review & SRS Integrity + Comprehension** (Successor — Q8 comprehension joins the Phase-3/4 formats)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `b61158ff` (feat(epic-26): story-26-1 quiz engine tells the truth about phases)
