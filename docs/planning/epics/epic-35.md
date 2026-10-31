---
purpose: "Eval Harness & Fine-Tuning"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 35 — Eval Harness & Fine-Tuning _(T2.5 + T2.6)_ _(Tier 2)_

**Goal:** Stand up the evaluation substrate (in-repo TS) + judge/runner (Python `evals-pinyinpal`) and run the fine-tuning harvests before TTL expiry.

**Boundary — IN:** in-repo TS substrate (golden-set fixtures, eval-capture plumbing, `AICallLog`/`ActivityEvent` harvest points) + satellite `evals-pinyinpal` (Python judge + runner + CI `eval.yml`) — **no second TS harness**; T2.6 fine-tuning harvest **two-track** (review_rating before `ActivityEvent` TTL T12 **+** AI prompts/responses before `AICallLog` TTL, gated on OB6 retention — open Q4). Minimal eval already rode 29/33.

**Boundary — NON-GOALS (OUT):** judge/runner live in the satellite (no in-repo Python harness); autonomous agents → satellite; from-scratch fitter (reuse ts-fsrs Rust binding).

**Rough AC (4):**

1. Substrate: golden-set fixtures + eval-capture plumbing in-repo (TS); 38's sample capture + 29's outcome linkage feed the harness.
2. Satellite: `evals-pinyinpal` judge + runner + `eval.yml` green on the committed fixtures (CI).
3. Data: fine-tuning harvest runs before TTL for both tracks (review_rating + AICallLog), retention-respecting (no-PII).
4. Metrics: drift/cost metrics (from 29/39) reported per eval run.

**UI scope:** `UI: none` (substrate + satellite).

**Dependencies:** needs 29/30–33 (stable AI contracts), 38 (conversation capture), 34 (optional). Satellite = parallel track.

**Close criteria:** substrate BR/impl + satellite CI evidence; Tier 1 + Tier 2 (backend type-check, full suite); verification artifact recording the two-track harvest run.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
