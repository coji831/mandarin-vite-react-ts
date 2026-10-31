---
purpose: "AI Gateway, Observability & Cost Governance"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 29 — AI Gateway, Observability & Cost Governance _(E.0)_ _(Tier 1)_

**Goal:** Land the single AI seam — `IAIGateway` + `AICallLog` + prompt/Zod discipline — and enforce the P11-AMEND/L5 demo-quota cost governance that makes guest-facing AI safe.

**Boundary — IN:**

- **M1 — gateway + observability:** `IAIGateway` over `GeminiClient` (task-based routing + provider fallback); `AICallLog` (model/latency/tokens/schemaValid/fallback) with **`usageMetadata` parsing (P7 — hard prereq)**; prompt versioning (`apps/backend/src/prompts/`) + Zod-validated structured outputs applied to the 3 existing seams (mnemonics, quiz-feedback, passage-gen); server-side AI feature-flag store (T18 amendment); S11 guest AI policy codified.
- **M2 — cost governance + eval substrate:** server-side per-guest demo-quota counters (deviceUserId + IP + fingerprint, Redis short-TTL, rolled daily) + global guest-spend circuit breaker; cross-feature per-user daily generation budget via `AICallLog` (5/day precedent P14); **T20/OB6 leg-2** outcome linkage (AI-call→user-outcome: schemaValid/retrieval-hit/low-confidence/redirect) + golden-set authoring (S15/C7) + RAG-1 hit-rate/redirect-share computation **(must land before epic-31)**; `AICallLog` retention/no-PII (window = open Q4).

**Boundary — NON-GOALS (OUT):** E.1–E.5 → 30–33; retrieval seam → 30; conversation SSE → 31; structured-logging spine → 39 (soft dep — 29 needs 39's P1/P2 + its own P7); RAG embeddings → satellite (`rag-mandarin-search`); autonomous agent → satellite.

**Rough AC (6):**

1. BE: all AI generation routes route through `IAIGateway`; a provider-fallback path is integration-tested (mock primary fail → fallback).
2. BE: every AI call writes an `AICallLog` row (model/latency/tokens/schemaValid/fallback; `usageMetadata` parsed — cost computable); no orphan calls.
3. BE: guest AI calls under demo quota — server counters reject over-quota (integration test on the `AICallLog`-backed counter); circuit breaker trips on the global threshold (mock).
4. BE: per-user daily generation budget enforced across mnemonics + quiz-feedback + passage-gen (P14 precedent).
5. BE: `AICallLog` carries outcome linkage + retention/no-PII (24-mo hard-delete or owner-set window); golden-set fixtures committed.
6. Release gates green; cost dashboards feed epic-39 metrics.

**UI scope:** `UI: none` (backend spine). _(29 defines the quota-exhausted error contract; the value-moment CTAs that consume it land with 26/31/36.)_

**Dependencies:** needs 25, 28 (A–D before SRS-touching AI), 39 (P1/P2 structured logs before AICallLog interpretation), and the **D7 shell-swap complete (29 lands on NestJS)**. Parallel: 26/27/38.

**Close criteria:** BR/impl; Tier 1 + Tier 2 (backend type-check, full suite, backend-audit); verification artifact incl. quota-enforcement evidence + circuit-breaker test. **Recommended split:** promote M2 (cost governance) to its own epic if it grows — it is coherent and independently closable.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
