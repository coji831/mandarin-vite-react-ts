---
purpose: "Suggestions Recommender v0"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 32 — Suggestions Recommender v0 _(E.3)_ _(Tier 1)_

**Goal:** Ship the rule/score recommender — weak-item signals, 3 surfaces, "why" transparency — FSRS-free, with the FSRS-weighted version explicitly deferred.

**Boundary — IN:** `modules/recommendations/` rule/score-first (score = w1·urgency + w2·weakness + w3·recency + w4·phaseFit; no LLM ranking, no CF); weak-item rule = ≥3 lapses/30d OR (relearning AND accuracy < 0.7 last 5) via the **T19 signal** (live `QuizAttemptAnswer` + `review_rating(source)` pre-FSRS; `SrsCardState.lapses` post-28); surfaces dashboard / in-review / post-quiz, 1–3, dismissible, "why"; LLM rationale only (rule-default + validated polish); Redis-cached; guests session-scoped, generation under demo quota (L5).

**Boundary — NON-GOALS (OUT):** FSRS-weighted recommender → after T2.1 (34); daily plan + Made-for-You → 33 (E.4); nudges/A-B → 33/40; ML bandit / collaborative filtering → not v1.

**Rough AC (4):**

1. BE: `GET /v1/recommendations/weak` returns 1–3 scored items with "why" (rule/score — no LLM ranking); Redis-cached.
2. BE: weak-item rule matches T19 (≥3 lapses/30d OR relearning + acc<0.7) — unit test on fixtures.
3. FE: suggestions render on all 3 surfaces, dismissible, guest-session-scoped (no server rows).
4. BE: guest suggestion generation under demo quota (L5); users free within daily cap.

**UI scope:** `UI: suggestions cards on 3 surfaces (dashboard / in-review / post-quiz) with dismiss + why — design spec TBD`.

**Dependencies:** needs 26 (quiz-failure signals), 28 (`SrsCardState`/lapses T19), 29 (flags/S11/quota). Parallel: 30/31.

**Close criteria:** BR/impl + Storybook-first suggestion surfaces; Tier 1 + Tier 2; verification artifact with weak-item-rule fixture evidence.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
