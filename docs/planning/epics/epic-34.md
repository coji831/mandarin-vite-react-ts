---
purpose: "FSRS Deep Modeling: `srs-core` + Fitting"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 34 — FSRS Deep Modeling: `srs-core` + Fitting _(T2.1 + T2.2)_ _(Tier 2)_

**Goal:** Stand up the shared FSRS engine (`@mandarin/srs-core`, pinned ts-fsrs v5.4.1) with FE+BE parity, then add per-user parameter fitting — replacing interval-doubling with FSRS-6.

**Boundary — IN:**

- **M1 (T2.1):** `packages/srs-core` wrapping pinned `ts-fsrs` v5.4.1 (FSRS-6, MIT); consumed by FE guest store + BE; 4-state vocabulary (T14); `UserSrsParams` (`fsrsVersion`, `requestRetention` 0.85–0.90 — T13); **T16 parity test** (exact-equality on fixed deterministic fixtures, server-anchored `now`, CI on every bump).
- **M2 (T2.2):** per-user FSRS parameter fitting (monthly or when review count doubles), reusing ts-fsrs + Rust optimizer binding (no from-scratch fitter); harvests `review_rating` events (38) before TTL.

**Boundary — NON-GOALS (OUT):** IRT/HLR adaptive difficulty (T2.3) → not v1; leech modeling beyond v0 rule (T2.4) → not v1; FSRS-7 thin fork → only if product-required (T11); AI-side fine-tuning → 35.

**Rough AC (5):**

1. Pkg: `srs-core` pins ts-fsrs v5.4.1; exposes `repeat/next/get_retrievability/rollback`; consumed by FE + BE.
2. Pkg: T16 parity — identical fixtures produce identical output on FE + BE (CI on every `srs-core` bump).
3. BE: `UserSrsParams` (`fsrsVersion`, `requestRetention`) persisted + read on schedule.
4. BE: FSRS scheduling replaces interval-doubling on `SrsCardState` (4-state); lapses tracked (T19).
5. BE: fitting job consumes `review_rating` events (38) + runs the optimizer binding; params persisted per user.

**UI scope:** `UI: none` (engine + params; no user-facing surface v1).

**Dependencies:** needs 28 (SrsCardState schema + write path), 38 (`review_rating` events for fitting).

**Close criteria:** package BR/impl + parity-test artifact; Tier 1 + Tier 2 (full suite incl. the CI parity gate); verification artifact with bit-identical parity evidence.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
