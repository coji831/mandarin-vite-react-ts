# Session Resumption Protocol

**Path:** `.github/solar-system/protocols/session-resumption.md`
**SOLAR Version:** v4 Phase 3
**Date:** 2026-04-04

---

## Purpose

Defines the session resumption protocol: which files to read on loop session restart, in what order, and what constitutes a "clean restart" vs "mid-task resumption". References the checkpoint file written by the governor at each pipeline stage boundary.

---

## Resumption Triggers

Session resumption is required when:

1. A SOLAR loop session is interrupted before the active work package reaches `WORK_PACKAGE_COMPLETE`.
2. A governor session starts and finds `Completion Promise: pending` in the ledger (loop re-entry).
3. A governor session starts and finds an `Active Sub-tasks:` entry with non-complete sub-tasks.
4. A checkpoint file exists at `/memories/session/checkpoint.md` from a prior session.

---

## File Read Order on Loop Restart

The governor MUST read the following files in this order on a loop session restart:

1. `.github/.ai_ledger.md` — current pipeline stage, blockers, active work package, handoff payload.
2. `.github/AGENTS.md` — pipeline contracts and delegation matrix (always-injected; explicit re-read only if context has decayed).
3. `.github/instructions/solar.instructions.md` — inquiry gate, handoff schema reference, team coordination guidance.
4. `/memories/session/checkpoint.md` — last checkpoint written by the governor (if file exists).
5. Story or epic BR doc referenced in the ledger Current Objective (if applicable).

Do NOT read files beyond this minimum list unless a specific stage requires it (respect the tiered-context gate in the governor's `<approach>` block).

---

## Clean Restart vs Mid-Task Resumption

### Clean Restart

Conditions for a clean restart:

- Ledger `Completion Promise` is NOT pending.
- No `Active Sub-tasks:` entries are in a non-complete state.
- No `Verification Failures` entries are unresolved.
- Checkpoint file either does not exist or is from a prior completed work package.

Action: Start a new work package from scratch. Write a fresh ledger Current Objective.

### Mid-Task Resumption

Conditions for mid-task resumption:

- Ledger `Completion Promise: pending` is present.
- OR one or more `Active Sub-tasks:` entries show status `in-progress` or `blocked`.
- OR `Verification Failures` entries reference an unresolved failure.
- OR checkpoint file references a pipeline stage that does not match ledger `Pipeline Stage: CLOSED`.

Action: Resume from the last recorded pipeline stage. Do NOT restart the pipeline from stage 1. Validate the ledger state before delegating — check that all prior stage outputs are still valid.

---

## Checkpoint File Format

Checkpoint is written by the governor to `/memories/session/checkpoint.md` at each pipeline stage boundary.

```markdown
# Session Checkpoint

Date: <YYYY-MM-DD>
Pipeline: <pipeline name>
Pipeline Stage: <N - stage name>
Active Work Package: <WP-id or description>
Last Completed Stage: <N-1 - stage name | none>
Next Required Agent: <agent name>
Handoff Payload Summary: <one-line summary of current Handoff Payload field or 'none'>
Ledger State: <brief summary: blockers, notes, or 'clean'>
```

The governor overwrites this file at each stage transition. Only the most recent checkpoint is retained per session.

---

## Session Memory Tier vs Ledger

Session Memory (`/memories/session/`) is the correct tier for:

- Governor checkpoint state
- Pre-compaction snapshots (written by `pre-compact.cjs`)
- Intermediate reasoning notes that do not belong in the durable ledger

The ledger (`.github/.ai_ledger.md`) is the correct tier for:

- Active work queue, blockers, verification failures
- Pipeline stage and session type
- Handoff Payload (outbound) and Active Sub-tasks
- Completion promises and stage outcomes

Do NOT write pipeline state that belongs in the ledger to session memory, or vice versa. Duplication causes inconsistency during mid-task resumption.

---

## Recovery from Missing Checkpoint

If checkpoint file is missing but ledger shows `Completion Promise: pending`:

1. Treat as mid-task resumption.
2. Re-read the ledger `Pipeline Stage:` field to determine where to resume.
3. Re-read the last `Stage Outcomes:` entry (if present in ledger) to confirm what has already completed.
4. Write a fresh checkpoint to `/memories/session/checkpoint.md` before delegating the next stage.

---

## Stale Checkpoint Detection

A checkpoint is stale if its `Pipeline:` and `Pipeline Stage:` do not match the current ledger. When a stale checkpoint is detected:

1. Log a note in the ledger `Active Blockers` section: "Stale checkpoint detected — checkpoint.md from prior session; proceeding from ledger state."
2. Overwrite checkpoint with current ledger state.
3. Continue from ledger state.
