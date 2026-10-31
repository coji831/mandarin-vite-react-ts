---
purpose: "Assistant Conversation (Text SSE)"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 31 — Assistant Conversation (Text SSE) _(E.2)_ _(Tier 1)_

**Goal:** Ship the streaming conversation surface — auth + guest demo-quota (1 session ≤ 5 turns/day), read-only `Retriever` tools, and land the RAG-1/FV14 decision point before close.

**Boundary — IN:** SSE conversation (NestJS `@Sse`); Redis short-TTL conv memory (`assistant:conv:<user>:<session>`, no `AssistantConversation` model v1); auth-only + guest under demo quota (**P10/P16 re-framed** — no longer hidden); read-only tools reusing the `Retriever` interface (injection-safe, no write surface); per-turn token budget ~1024; **RAG-1 instrumentation + FV14 decision** (hit-rate/redirect-share from 29's `AICallLog` + 38's conversation capture) — decision recorded in the close artifact.

**Boundary — NON-GOALS (OUT):** voice/video/avatar → not v1; autonomous agent → satellite (`agents-pinyinpal`); RAG embeddings build → satellite (decision made here, build there if fired).

**Rough AC (5):**

1. BE: SSE streams tokens; session memory TTL'd in Redis; reconnect-safe client (`sseClient.ts`).
2. BE: guests capped at 1 session ≤ 5 turns/day (server-enforced quota — integration test); registered users free within daily cap.
3. BE: read-only tools call only `Retriever`-based reads; no write surface exposed to the model (prompt-injection test).
4. FE: conversation panel renders streaming turns + guest turn counter; story/e2e.
5. BE: RAG-1 trigger computed from outcome linkage + conversation capture; fire-vs-hold recorded (FV14) in the close artifact.

**UI scope:** `UI: conversation chat panel (SSE streaming, text) + guest turn counter/demo-quota notice — design spec TBD`.

**Dependencies:** needs 30 (Retriever reuse), 29 (outcome linkage + quota), 38 (conversation-sample capture, T20 leg 1). Lands on NestJS.

**Close criteria:** BR/impl + Storybook-first chat UI; Tier 1 + Tier 2; verification artifact recording the **RAG-1/FV14 decision** (explicitly an AC — cannot close without it).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
