---
purpose: "Guardian Content + Agent Contract"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 33 — Guardian Content + Agent Contract _(E.4 + E.5)_ _(Tier 1)_

**Goal:** Ship the deterministic Content-Guardian content lane + daily plan (E.4) and the stable agent contract with machine tokens (E.5) — the end of the Tier-1 critical path.

**Boundary — IN:**

- **M1 (E.4):** `POST /v1/assistant/generate/content` with deterministic Content-Guardian (vocab whitelist ⊆ studied-set, content_id existence, grammar constraints, sanitize); rule-scheduler daily plan + thin cached LLM summary; Made-for-You lesson builder (N2); nudges (rule + A/B, quiet-hours, opt-in).
- **M2 (E.5):** agent contract — `GET /v1/review/due`, `GET /v1/progress`, `GET /v1/recommendations/weak` (proposed) + **machine-token infra (G6)** — token store, scoping, rate limits; REST, not MCP (V8).

**Boundary — NON-GOALS (OUT):** autonomous/LangGraph agent → satellite (`agents-pinyinpal`; PinyinPal keeps the E.4/E.5 contract + Guardian); ML-bandit nudges → not v1; RAG embeddings → satellite.

**Rough AC (5):**

1. BE: Guardian rejects out-of-whitelist vocab + non-existent content_id (integration test); generated content sanitized.
2. BE: daily plan = rule scheduler + thin LLM summary (no autonomous agent); cached; per-user daily cap.
3. BE: Made-for-You builder generates Guardian-validated content (guest under demo quota, users free).
4. BE: the 3 agent-contract endpoints work under machine-token auth (scoped + rate-limited); REST contract tests.
5. FE: daily-plan strip + Made-for-You surface render (story).

**UI scope:** `UI: daily-plan strip + Made-for-You lesson surface — design spec TBD` (E.5 = none — API + token).

**Dependencies:** needs 32 (suggestions infra + daily-plan), 30 (retrieval/PhaseScope), 29, 28 (studied-set/SRS). M2 additionally needs 28 (stable SRS) + 32 (weak recs).

**Close criteria:** BR/impl + Storybook-first daily-plan/Made-for-You UI; Tier 1 + Tier 2; verification artifact incl. Guardian rejection tests + machine-token contract evidence. **Recommended split:** promote M2 (agent contract) to its own epic if it grows — it is self-contained (3 GETs + token infra).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
