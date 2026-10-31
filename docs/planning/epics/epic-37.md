---
purpose: "HSK Exam-Prep Mode"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 37 — HSK Exam-Prep Mode _(N3)_ _(product lane)_

**Goal:** Ship HSK exam-prep on HSK levels (independent of the learning road — L7), split by exam parts, after the HSK 2025-rebase data lands.

**Boundary — IN:** HSK-prep mode (mock exams split by listening / reading / writing(+speaking where applicable) — each part independently repeatable, P9); score prediction + thin LLM summary; free for guests (deterministic content — P11 N/A), persisted scores for users; builds on the 27-M2 rebase data.

**Boundary — NON-GOALS (OUT):** HSK "Bands 1–9" structure → deferred; learning-road phase coupling → none (L7); Pro gating → free-for-now (O1).

**Rough AC (4):**

1. Data: HSK-prep consumes the rebased syllabus (L1–6 300/500/…/5400; char 3,088) from 27-M2 — no stale 2021-draft labels.
2. BE: mock exams by exam part with deterministic scoring; scores persisted for users, session-local for guests.
3. FE: HSK-prep mode UI (part picker, timed mock, results + score prediction); story/e2e.
4. BE: LLM summary (thin; Guardian-validated if generated) under daily cap; guest = deterministic only (no generated cost).

**UI scope:** `UI: HSK exam-prep mode (part picker, timed mock, results + score prediction) — design spec TBD`.

**Dependencies:** needs 27-M2 (rebase) only.

**Close criteria:** BR/impl + Storybook-first prep UI; Tier 1 + Tier 2; verification artifact confirming rebase-consistency (no stale labels).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
