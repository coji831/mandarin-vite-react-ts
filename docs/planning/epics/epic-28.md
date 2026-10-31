---
purpose: "Review & SRS Integrity + Comprehension"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 28 — Review & SRS Integrity + Comprehension _(Phase B, part 2 + Phase D)_

**Goal:** Wire the review engine correctly (quiz-failure→review, item-type unification, interleaving, guest session-local review), resolve P0-2 via the `SrsCardState`/`CharacterMastery` migration, and make comprehension (Q8) + the P3→4 gate reachable.

**Boundary — IN:**

- **M1 — review calibration + SRS data integrity:** quiz-failure→review (additive `failedItemType`/`failedItemId` on `QuizAttemptAnswer`; `recordRating` source widened to `quiz_failure`; controller-orchestrated); review item-type vocabulary unification (char/char-radical/character/character-radical fracture → canonical backend itemTypes — fixes 2/4 empty queues); interleaved mixed-type review sessions; guest session-local review (IndexedDB guest queue + client-side engine parity v0 — T15/T16, zero server rows).
- **M1 — P0-2:** `ReviewItem → SrsCardState` 4-state migration (display columns dropped, 4-state FSRS enum T14); `CharacterMastery` writer-only projection; `LearnerState` consolidation (dead columns dropped); `review_rating → ActivityEvent` same-tx (coordinates with 38); **reserved pgvector `vector` column (empty, FV14 hedge)**.
- **M2 — comprehension:** Q8 comprehension quiz strategy (≥1 typed answer per P2) + P3→4 gate made reachable (D9) + gate UI.

**Boundary — NON-GOALS (OUT):** ts-fsrs engine swap + T16 parity test → epic-34 (28 ships schema/enum only — avoids double-build); full `ActivityEvent` table + retention → epic-38; FSRS fitting → 34; `srs-core` package → 34.

**Rough AC (6):**

1. BE: failed quiz answers create review items with `source:"quiz_failure"` + `failedItemType`/`failedItemId` populated (integration test).
2. FE e2e: all 4 real review item types yield non-empty sessions; interleaved session renders mixed types.
3. BE: guest review is session-local — no server SRS row written for guests; guest-queue parity fixture (T16) committed.
4. BE: `SrsCardState` migration applied (4-state), `CharacterMastery` write path ships same-tx with the review write; no gate reads a writer-less projection (§19 invariant).
5. FE/BE: Q8 renders with ≥1 typed answer; P3→4 gate reachable end-to-end (pass P3 comprehension → P4).
6. Regression: existing quiz/review flows pass the full suite after the additive migration (M0/M1).

**UI scope:** `UI: Q8 comprehension surface + P3→4 gate-reachability UI + interleaved review-session UI + guest review lane (session-local) — design spec TBD`.

**Dependencies:** needs 26 (M1 quiz engine + quiz-failure source), 27 (M1 phase/gate data; M2 for P3→4), P0-2. **Lands after Epic 24 (serial)** — the `SrsCardState` additive schema/enum + reserved pgvector is **absorbed into Epic 24** (24-11, additive-only), so 28's residual = review-behavior calibration + data-integrity net-new + comprehension (destructive `ReviewItem` cleanup post-34). Coordinates with 38 (event taxonomy rides the migration). Parallel: 39.

**Close criteria:** backend-heavy epic with one UI slice; story docs + impls; Tier 1 + Tier 2 (full suite, backend type-check, story tests, design audit); verification artifact incl. the migration truth-check + P0-2 closure record.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
