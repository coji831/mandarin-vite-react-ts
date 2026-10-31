---
purpose: "Assistant Explain + Deterministic Retrieval Seam"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 30 — Assistant Explain + Deterministic Retrieval Seam _(E.1)_ _(Tier 1)_

**Goal:** Ship Assistant Slot 1 (Explain) on a first-class deterministic retrieval module — cache-first, phase-scoped, no embeddings.

**Boundary — IN:** first-class `modules/retrieval` (**C14**) — `Retriever` interface + `DeterministicRetriever` (content_id → glyph → pinyin → fuzzy/NFKC → BM25) + `PhaseScope` filter + low-confidence candidate fallback; E.1 Explain slot (curated→cache→shared-DB→generate chain; per-turn token budget ~512; per-user daily cap; `POST /v1/assistant/feedback` "report a mistake"); Explain UI surface; golden-set authoring rides 29 (S15). Guest = reads-only, cache/DB-first, no generation (S11), any generated segment under demo quota (L5).

**Boundary — NON-GOALS (OUT):** conversation SSE → 31; RAG vector/embeddings → satellite (PinyinPal reserves the pgvector column only); suggestions → 32; Guardian content/daily-plan → 33; autonomous agent → satellite.

**Rough AC (5):**

1. BE: `modules/retrieval` exposes the `Retriever` interface with `DeterministicRetriever` + `PhaseScope` filter; E.1 consumes it (contract test; a future hybrid = new impl, not a rewrite).
2. BE: Explain returns cached/curated content first (no Gemini call) for known items; generation only on cache miss; phase-scoped (decline + redirect on locked content).
3. BE: per-turn token budget (~512) + per-user daily cap enforced; feedback endpoint accepts and stores.
4. FE: Explain slot renders in lesson/card (embedded, level-scaled) — story coverage.
5. Guest contract: Explain = reads-only cache-first; any generated segment quota-gated (S11/L5).

**UI scope:** `UI: Explain assistant slot (embedded, level-scaled, cache-first) + report-a-mistake affordance — design spec TBD`.

**Dependencies:** needs 29 (E.0), 26 (practice engine), 27 (phase/content metadata for `PhaseScope`), 28 (studied-set coaching).

**Close criteria:** BR/impl + Storybook-first Explain UI; Tier 1 + Tier 2 (story tests, design audit, backend type-check); verification artifact incl. the retrieval contract test.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
