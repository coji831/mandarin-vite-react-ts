# Context Tiers Model

SOLAR-Ralph v4 defines four context tiers. Every piece of information used by an
agent during a work session belongs to exactly one tier. Tier assignment determines
where data lives, how it is loaded, and when it expires.

---

## Tier 1 — Working Context (Instructions)

**What:** Always-injected scoped instructions from `.github/instructions/*.instructions.md`
**Mechanism:** VS Code Copilot `applyTo` glob patterns — loaded automatically when the
active file matches the pattern.
**Lifetime:** Per-turn, re-injected on every agent call.
**Use for:** Naming conventions, project-specific rules, agent operating overlays,
security requirements, architecture facts that every agent in every session needs.
**Governance rule:** Keep Working Context lean. A 10 KB instruction file injected on every
turn is 10 KB of token budget consumed before the agent produces a single output.
Prefer documented facts in `docs/` over verbose instruction files.

---

## Tier 2 — Session (Ledger)

**What:** `.github/.ai_ledger.md` and `/memories/session/` files.
**Mechanism:** Explicitly read by the governor on session start and after each
pipeline stage transition.
**Lifetime:** Current conversation only. The ledger persists on disk; session memory
(`/memories/session/`) is cleared when the conversation ends.
**Use for:** Active pipeline stage, current objective, handoff payloads, in-progress
todos, blockers, and checkpoint state for restart safety.
**Governance rule:** The ledger is the single source of truth for "what is happening
right now." Every pipeline stage transition must update the ledger. Pre-compaction
snapshots go to `/memories/session/pre-compact-state.md` before context truncation
(see `compaction-policy.md`).

---

## Tier 3 — Memory (Cross-Session)

**What:** `/memories/` (user memory), `/memories/repo/` (repository memory), and
`.github/solar-system/.learnings/` files.
**Mechanism:** Memory files injected via Copilot's `memory` tool; LEARNINGS.md
injected via `SessionStart` hook additional context.
**Lifetime:** Persistent across conversations. Memory files survive session end.
**Use for:** Verified project conventions, past error corrections, agent-observed
patterns that should propagate to future sessions.
**Governance rule:** Write to Memory only when a fact has been validated (not just
observed). Raw observations go to Tier 2 (ledger); only promotion-worthy facts
reach Tier 3. See `solar.instructions.md` self-improvement write-back rules.

---

## Tier 4 — Artifacts (File Handles)

**What:** Large documents, design files, API specs, generated code files, and any
file exceeding `context.artifactSizeThresholdLines` lines.
**Mechanism:** Agent receives a file path reference instead of full content. The
`artifact-handle-pattern.md` defines when to use handles vs. full load.
**Lifetime:** Stable — artifacts live on disk; they are loaded on-demand when
the agent needs to inspect specific content.
**Use for:** Architecture docs (`docs/architecture.md`), large schema files, full
test suites, generated migrations, and any file the agent needs to reference but
not reason over in full.
**Governance rule:** When delegating a task that involves a large artifact, pass
the file path and instruct the specialist to read only the relevant sections.
Do NOT pre-load large files into governor context before delegation.

---

## Tier Assignment Decision Table

| Information Type         | Tier                | Location                                 |
| ------------------------ | ------------------- | ---------------------------------------- |
| Per-project naming rules | 1 — Working Context | `*.instructions.md`                      |
| SOLAR operating rules    | 1 — Working Context | `solar.instructions.md`                  |
| Current pipeline stage   | 2 — Session         | `.ai_ledger.md`                          |
| Active objective         | 2 — Session         | `.ai_ledger.md`                          |
| Handoff payloads         | 2 — Session         | `.ai_ledger.md` / `checkpoint.md`        |
| Pre-compaction snapshot  | 2 — Session         | `/memories/session/pre-compact-state.md` |
| Confirmed conventions    | 3 — Memory          | `.learnings/LEARNINGS.md`                |
| Corrected errors         | 3 — Memory          | `.learnings/ERRORS.md`                   |
| Improvement ideas        | 3 — Memory          | `.learnings/FEATURE_REQUESTS.md`         |
| Large design docs        | 4 — Artifacts       | `docs/architecture.md` (path handle)     |
| Large generated files    | 4 — Artifacts       | (path handle)                            |

---

## Compaction Triggers

When a session accumulates enough Tier 2 (ledger) entries to risk context overflow,
the governor should trigger proactive compaction. See `compaction-policy.md` for
the threshold value and compaction procedure.

The `PreCompact` hook (Phase 4) provides reactive compaction: it fires before VS Code
auto-truncates context, exports the hot ledger state to Tier 2 session memory, and
returns `continue: true` to allow compaction to proceed safely.
