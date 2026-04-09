# Compaction Policy

Defines when and how the governor should trigger ledger compaction to prevent context
overflow in long-running loop sessions.

---

## Open Decision Resolution — S3 Compaction Proxy Metric

**Status:** RESOLVED — Phase 1, 2026-04-04
**Decision:** Option B — completed-task count.
**Rationale:** Task count is semantically stable regardless of formatting verbosity.
Line count varies significantly when ledger entries include verbose handoff payloads
or long error descriptions. A task-count threshold provides a consistent trigger
that does not change based on how much detail an agent writes per entry.

**Threshold value:** 10 completed tasks.
**Config field:** `context.ledgerCompactionThreshold` in `solar.config.json` (default: 10).
**Adjustment guidance:** After observing real loop sessions, adjust the threshold via
`solar.config.json` if context pressure appears before 10 tasks (lower the threshold)
or if compaction overhead is too frequent (raise it).

---

## Proactive Compaction (Governor-Triggered)

The governor monitors the ledger's completed-task count. When the count exceeds
`context.ledgerCompactionThreshold`:

1. **Summarize completed tasks:** Replace individual completed task entries in the
   ledger with a one-line summary block:
   ```
   [COMPACTED — N tasks completed as of YYYY-MM-DD]
   Summary: <brief description of what was accomplished>
   ```
2. **Preserve active state:** Never compact the current `Pipeline Stage:`,
   `Completion Promise:`, `Handoff Payload:` (Phase 3+), or `Active Sub-tasks:`
   (Phase 3+) fields.
3. **Write a checkpoint:** Before compacting, write the current in-progress todos
   and pipeline stage to `/memories/session/pre-compact-state.md` as a safety copy.
4. **Update the ledger:** Replace the compacted task list with the summary block.

**Trigger instruction for the governor (in `orchestration-governor.agent.md`, Phase 4):**

> When the count of completed tasks in `.ai_ledger.md` exceeds the value of
> `context.ledgerCompactionThreshold` in `solar.config.json`, compact the ledger
> by summarizing completed tasks before starting the next pipeline stage.

---

## Reactive Compaction (PreCompact Hook)

The `PreCompact` hook (`pre-compact.cjs`, Phase 4) fires automatically when VS Code
Copilot is about to truncate the context window. It:

1. Reads the current ledger pipeline stage and in-progress todos.
2. Writes a snapshot to `/memories/session/pre-compact-state.md`.
3. Returns `{ "continue": true }` to allow VS Code compaction to proceed.

This reactive path ensures that even if the governor did not trigger proactive
compaction at the threshold, critical ledger state is not lost.

**Note:** `PreCompact` uses the common output format only (`continue`, `systemMessage`).
It does NOT use `hookSpecificOutput` — VS Code ignores `hookSpecificOutput` on
`PreCompact` events.

---

## What to Preserve After Compaction

| Field                      | Preserve? | Notes                          |
| -------------------------- | --------- | ------------------------------ |
| `Pipeline Stage:`          | YES       | Always preserve current stage  |
| `Completion Promise:`      | YES       | Always preserve if `pending`   |
| `Session-Type:`            | YES       | Always preserve mode           |
| `Handoff Payload:`         | YES       | Always preserve (Phase 3+)     |
| `Active Sub-tasks:`        | YES       | Always preserve (Phase 3+)     |
| Completed task list        | NO        | Replace with summary block     |
| Old blockers (resolved)    | NO        | Remove resolved blockers       |
| Old pipeline stages (done) | NO        | Replace with compacted summary |

---

## Compaction Is Not Loss

Compaction is a safe operation. The full task history is not permanently deleted —
the governor writes a summary, not a deletion. If the detailed history is needed
for a post-session review, it remains in git history via ledger commits.
