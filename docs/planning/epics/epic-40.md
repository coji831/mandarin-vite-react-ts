---
purpose: "Data-Driven Learning Road: `LearnerProfile` + "Next for You""
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 40 — Data-Driven Learning Road: `LearnerProfile` + "Next for You" _(L3/L4)_

**Goal:** Replace hard phase walls with soft readiness — `LearnerProfile` projection + rule/score "Next for you" sequencing + readiness UI — reusing epic-32's recommender infra.

**Boundary — IN:** `LearnerProfile` projection (known-set/coverage/weakness/readiness — extends T6/`LearnerState`); "Next for you" sequencing engine (rule/score-first priority scoring; roadmap theory = scoring layer, not a lock — L3/L6; cold-start defaults to the roadmap sequence); reuses `modules/recommendations` (epic-32 infra); soft-readiness implementation (**L2/L8** — `PhaseGate` lock removed for registered users; gates → readiness recommendations; P1 90/10 kept as "foundations ready" signal; skip/qualification quizzes dropped); readiness UI (dashboard signals + recommendations rail). FSRS-weighted sequencing after T2.1 (34) — v1 is rule/score.

**Boundary — NON-GOALS (OUT):** pricing/monetization (V10) → deferred; funnel capture (G7) → deferred (O3); ML-bandit nudges → not v1; autonomous study-plan agent → satellite.

**Rough AC (5):**

1. BE: `LearnerProfile` projection computed (known-set/coverage/weakness/readiness) from `ActivityEvent` + `SrsCardState` + `CharacterMastery`; endpoint contract.
2. BE: "Next for you" returns a scored, ordered sequence (rule/score, FSRS-free v1); cold-start defaults to the roadmap sequence; cached.
3. FE: Dashboard shows readiness signals + "Next for you" rail (replaces hard phase walls); story/e2e.
4. FE: no hard `PhaseGate` lock for registered users (gates = recommendations); P1 "foundations ready" flag surfaces.
5. FE: recommendation/daily-plan surfaces reuse epic-32 infra (no duplicated suggestion logic).

**UI scope:** `UI: "Next for you" rail + readiness signals on Dashboard + soft-readiness recommendations UI — design spec TBD`.

**Dependencies:** needs 28 (SrsCardState/CharacterMastery/LearnerState), 38 (`ActivityEvent` known-set/coverage), 27 (phase metadata + readiness data), 32 (recommendations infra). FSRS-weighted after 34 (optional).

**Close criteria:** BR/impl + Storybook-first readiness UI; Tier 1 + Tier 2 (story tests, design audit, frontend-audit); verification artifact confirming the gate→recommendation behavior change.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
