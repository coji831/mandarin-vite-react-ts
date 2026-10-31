---
purpose: "ActivityEvent Substrate"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 38 — ActivityEvent Substrate _(Phase D substrate)_

**Goal:** Land the append-only event log — the learning-behavior + AI/analytics truth spine — with retention, taxonomy, conversation events, and sample capture.

**Boundary — IN:** `ActivityEvent` (M0/M1) — Zod typed union at a single write path (`ActivityService`); retention/partition (monthly by `createdAt`, 12–24 mo TTL), no-PII (T12); taxonomy (`object.action`, past tense, in `shared-types`) + **P6 conversation events** (`conversation_started`, `conversation_turn`, `topic_coverage`, `vocab_produced`); index set (btree `(type, createdAt)`, GIN optional); **T20 leg-1** conversation-sample capture (low-confidence/redirect tags); `responseMs` (G2); **T18 amendment** (`experimentId`/`variant` payloads); `review_rating` events same-tx with the SrsCardState write (rides the 28 migration); T11/T16 pin + parity fixture.

**Boundary — NON-GOALS (OUT):** `AICallLog` → 29 (deliberately separate); funnels/analytics split → deferred (T18); FSRS/DSR engine → 34; guest server rows without consent → none (T12/Q-C, client-side v1).

**Rough AC (5):**

1. BE: `ActivityEvent` table + typed union migrated (M0/M1 additive); single write path enforced (no feature writes another's events).
2. BE: retention — monthly partition + TTL/archival config; no-PII rule validated (test on event payloads).
3. BE: taxonomy includes the P6 conversation events; sample capture tagged (low-confidence/redirect).
4. BE: `review_rating` events written same-tx with `SrsCardState` (coordination with 28); parity fixture + server-time anchor (T16).
5. BE: T18 amendment — `experimentId`/`variant` accepted on event payloads.

**UI scope:** `UI: none` (backend substrate; guest-consent UX deferred — Q-N).

**Dependencies:** needs 25 (P0-1 before `optionalAuth` reads). Parallel: 26/27. **Must precede 29 (outcome linkage), 31 (conversation capture), 34 (fitting harvest), 35 (fine-tune harvest).** Coordinates with 28 (rides the migration).

**Close criteria:** substrate BR/impl; Tier 1 + Tier 2 (backend type-check, full suite, backend-audit); verification artifact with the migration + parity evidence.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
