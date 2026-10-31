---
purpose: "Practice Calibration: Engine Fixes + Guest Lane + Phase-B Formats"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 26 — Practice Calibration: Engine Fixes + Guest Lane + Phase-B Formats _(Phase B, part 1)_

> **As shipped 2026-10-31 (branch `epic-26-practice-calibration`, PR #62). A26's premise was two-thirds
> stale.** The audit named three defects at `/practices/quiz` — rail open, completion CTA outside a completion
> slot, and a `window.location.href` escape hatch. Measured against the code at epic open, the **rail collapse
> and the escape hatch no longer existed**: both landed with PR #61, which is where the archetype-driven
> mode-aware chrome began enforcing the Focus law. What remained unbuilt, and what this epic actually
> rebuilt, was the **completion slot**. The per-surface Step 0 revalidation verdict is in
> `apps/frontend/src/features/quiz/docs/design.md` §26.0.
>
> The body below is the original plan and stands, with these as-shipped deltas:
>
> - **M1** — `PHASE_CONFIGS[3]` added (cloze + sentence-building); Phase 4 distinguished by a `tier: 2`
>   field rather than removed, so its payload is no longer a duplicate of Phase 2's; `useQuizCard`
>   aggregates every quiz for `phase <= currentPhase` through `getQuizzesUpToPhase()`, so a passed phase
>   keeps its assessments as optional practice; `QuizCard` offers one labelled CTA per assessment and
>   states the timeline in text. `MULTIPLE_CHOICE_STRATEGIES` was replaced by an exhaustive
>   `QUESTION_VIEWS: Record<StrategyType, ComponentType>` dispatch map, which is what makes the format set
>   closed.
> - **M2** — all four formats ship, Q10 as a distinct Phase-1 format (written sandhi, no audio); the
>   registered strategy set goes 5 → 9 on the backend and 3 → 7 on the frontend. Persistence needed **no
>   migration**: the formats encode onto the existing answer columns. The curated banks are a **selection
>   layer** — 40 pinned anchors seeded into the anchor row's `metadata.quizFormats[]`, no new table — and
>   dictation is character-level (word-level needs a `Word.metadata` column, deferred).
> - **AC2** — a guest attempt still writes **zero** server rows; the guest's score is computed locally,
>   which fixed a live defect where the server stub made a 9/10 guest read `0/0 (0%) - not passed`.
> - **Carried forward** — a per-format category breakdown (the existing `CategoryBreakdown` models only
>   `pinyin`/`tones`/`pairs`/`rules`, so it is gated to the formats it understands), and a runtime
>   counterpart for `QuizAttemptType`.

**Goal:** Make the Practices lane correct, guest-accessible, and 10-format complete — fixing `PHASE_CONFIGS[3]`/aggregation, shipping the guest practice lane with value-moment CTAs, and adding Q6/Q7/Q9/Q10 on curated content.

**Boundary — IN:**

- **M1 — engine + guest lane:** `PHASE_CONFIGS[3]` added; key-4 dedupe (duplicate-of-2 removed); `useQuizCard` aggregates quizzes for `p ≤ currentPhase` (not current-only); `QuizCard` no longer mislabels the lowest-phase quiz as current; `MULTIPLE_CHOICE_STRATEGIES`/`QUIZ_LABELS` coverage for the format set; guest practice lane (session-local, per L1), guest CTA/copy + post-quiz "register to lift the demo quota" value-moment (client UX only; server enforcement in 29).
- **M2 — Phase-B format expansion:** Q6 cloze, Q7 sentence-building, Q9 listening-dictation, Q10 tone-judgment (separate Phase-1 format — P3) on curated content banks derived from the word + graded-reader corpus (P5); Q8 comprehension **authoring rule codified** (≥1 typed answer — P2), applied when Q8 ships in epic-28.

**Boundary — NON-GOALS (OUT):** quiz-failure→review wiring, interleaving, guest session-local review → epic-28; Q8 comprehension format + P3→4 gate → epic-28; demo-quota server counters → 29; `srs-core`/ts-fsrs → 34.

**Rough AC (6):**

1. FE contract: Practices renders quizzes for all phases ≤ current (`PHASE_CONFIGS[3]` present; no duplicate key-4).
2. FE e2e: guest completes a Phase-1 quiz; results are session-local; register CTA appears at a value moment per L1 — no server row written for the guest attempt.
3. FE story/component: each new format (Q6/Q7/Q9/Q10) renders and scores on the curated bank; Q10 is a distinct Phase-1 format (not a sub-mode of `audio-to-tone`).
4. BE contract: quiz submit/complete accepts the 4 new `StrategyType`s and persists `QuizAttempt`/`QuizAttemptAnswer` for registered users.
5. Content: curated banks pass seed verification + manifest counts; Q8 typed-answer authoring rule documented (P2).
6. Regression: existing quiz flows pass the full suite after engine fixes.

**UI scope:** `UI: guest practice lane + post-quiz value-moment CTA + 4 new quiz-format surfaces (Q6 cloze, Q7 sentence-building, Q9 listening-dictation, Q10 tone-judgment) — design spec TBD`.

**Dependencies:** needs 25. **Lands after Epic 24 (serial)** — 24-13 ports the correct backend quiz engine shape (M1 backend); the FE quiz-engine fixes stay in this epic (C-declared by 24-13). Parallel: 27, 38, 39.

**Close criteria:** story docs + impls; Storybook-first UI design per protocol (stories for each new format); Tier 1 + Tier 2 (story tests, design audit, frontend-audit); verification artifact. **Recommended split:** promote M2 (formats) to its own epic if it grows — it is self-contained (strategies + curated banks + stories).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
