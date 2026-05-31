# Lifecycle Coordination Protocol

**Path:** `.github/solar-system/protocols/lifecycle-coordination.md`
**SOLAR Version:** v4 Phase 3
**Date:** 2026-04-04

---

## Purpose

Defines how SOLAR-Ralph agents coordinate across pipeline stages using hooks, ledger state, and typed handoff payloads. Covers phase gating rules, parallel and sequential team coordination patterns, `SubagentStart`/`SubagentStop` hook usage policy, and ledger stage advancement criteria.

---

## Phase Gating Rules

A pipeline stage may advance only when the following conditions are all met:

1. **Structural check passes** — the delegated agent's output contains all required sections for its role (see `AGENTS.md` Verification Contract).
2. **Logic-path check passes** — stated conclusions follow from evidence; circular or unsupported reasoning triggers re-delegation.
3. **Scope check passes** — the agent stayed within its assigned scope (e.g., Bug Investigation must not have implemented a fix).
4. **Gaming check passes** — no test modifications without a corresponding source fix.
5. **Handoff payload present** — for S7-aware pipelines, the agent's output includes a typed handoff payload conforming to the applicable schema in `.github/solar-system/schemas/`.

The governor writes the outbound handoff payload into the `Handoff Payload:` section of `.ai_ledger.md` before delegating to the next stage. The `SubagentStart` hook reads this field and injects it as `additionalContext` at delegation time.

---

## Sequential Team Coordination Pattern

Used for standard pipelines (Bug Fix, Feature):

```
Governor writes Handoff Payload  -->  SubagentStart injects context  -->  Specialist executes
Specialist stops  -->  SubagentStop validates output  -->  Governor reads result  -->  Advance stage
```

Ledger stage field is updated by the governor after each stage clears all checks.

---

## Parallel Team Coordination Pattern

Used when independent sub-tasks can be executed concurrently:

1. Governor writes a separate `Active Sub-tasks:` entry for each parallel sub-task in the ledger.
2. Each sub-task entry includes: task ID, assigned agent, and current status (`pending | in-progress | complete | blocked`).
3. Governor delegates sub-tasks using concurrent `agent` tool calls where the platform supports it.
4. Each sub-task produces a typed handoff payload; governor collects all payloads before advancing the pipeline stage.
5. If any sub-task is blocked, governor records the blocker in the `Active Blockers` ledger section and decides whether to proceed with completed sub-tasks or hold.

**Constraint:** Parallel subagents must operate on independent file paths to avoid write conflicts. If two sub-tasks require editing the same file, they must be executed sequentially (see Worktree Isolation Decision below).

---

## SubagentStart Hook Usage Policy

- **Trigger:** Fires automatically before any subagent starts (VS Code Copilot native).
- **What it does:** Reads the `Handoff Payload:` section from `.ai_ledger.md` and injects its content as `additionalContext` for the subagent.
- **Guarded by:** `handoffs.typedPayloadsEnabled` in `solar.config.json`. When `false`, hook outputs `continue: true` with no injection.
- **Governor responsibility:** Write the relevant handoff payload into the ledger before invoking the subagent tool. The hook reads what the governor wrote.

---

## SubagentStop Hook Usage Policy

- **Trigger:** Fires automatically when a subagent is about to stop (VS Code Copilot native).
- **What it does:** Validates that the subagent's response contains minimum required handoff fields (`workPackage`, `status`, `completedBy`). Blocks the subagent stop and returns a correction instruction if fields are missing.
- **Guarded by:** `handoffs.typedPayloadsEnabled` in `solar.config.json`. When `false`, hook always allows stop.
- **Infinite loop prevention:** Hook reads `stop_hook_active` from input; if `true`, allows stop unconditionally to prevent deadlock.
- **Tolerance for old ledger format:** If the subagent response is not parseable or is empty (e.g., non-handoff output from a knowledge query), the hook allows stop. Only structured implementation and test outputs are blocked on missing fields.

---

## Ledger Stage Advancement Criteria

The governor updates `.ai_ledger.md` `Pipeline Stage:` only when:

- All 5 step supervision checks pass (structural, logic-path, scope, gaming, handoff payload).
- The current stage's typed handoff payload is recorded in the ledger (or acknowledged as not applicable for knowledge/planning stages).
- Any verification failures from the current stage have been resolved or escalated.

After writing the new `Pipeline Stage:` value, the governor also:

- Clears the `Handoff Payload:` section (replace with `(none)` or overwrite with next stage's outbound payload).
- Updates the relevant `Active Sub-tasks:` entry if applicable.

---

## Governor Checkpoint Write Protocol

At each pipeline stage boundary, the governor writes a checkpoint to `/memories/session/checkpoint.md`:

```markdown
# Session Checkpoint

Date: <YYYY-MM-DD>
Pipeline: <pipeline name>
Pipeline Stage: <N — stage name>
Active Work Package: <WP-id or description>
Last Completed Stage: <N-1 — stage name>
Next Required Agent: <agent name>
Ledger State: <brief summary of blockers or completion notes>
```

This checkpoint enables clean session resumption if the conversation is interrupted before the pipeline completes (see `session-resumption.md`).

---

## Worktree Isolation Decision

**Open Decision OD-7 — Resolved: Option B — Defer**

Parallel filesystem-isolated execution via `git worktree` is **deferred** in SOLAR-Ralph v4.

**Rationale:** Native parallel subagent execution is now supported and covers the large majority of SOLAR pipeline sub-tasks where agents operate on independent file paths. Write conflicts are rare in structured pipelines because the delegation matrix assigns distinct file domains to distinct specialists. Worktree management adds significant governor complexity (create, switch, merge, teardown terminal sequences) without proportionate benefit.

**Trigger condition for revisiting:** If an observed write conflict occurs during a parallel subagent run — specifically when two specialists are simultaneously delegated tasks that require editing the same file path — record the incident in `.github/solar-system/.learnings/ERRORS.md` and open a feature request in `FEATURE_REQUESTS.md` to implement worktree isolation.

**Current parallel safety rule:** The governor MUST NOT delegate two parallel sub-tasks that target the same file path. Before issuing concurrent `agent` calls, verify each sub-task's target files are disjoint.
