# Inquiry-First Protocol

**Section:** S6 — Inquiry-First Protocol for Software Engineering Agents
**Phase:** 2
**Applies to:** All SOLAR pipelines (enforced in loop mode via Watch Mode hook)

---

## Purpose

Prevent premature implementation. No implementation agent may be delegated to until
the Inquiry Gate in the active ledger is fully checked. This document defines what
"sufficient inquiry" means and what the revert-not-patch rule requires.

---

## Minimum Inquiry Criteria

Before any implementation agent is invoked, the Design Planning Architect (or the
governor in simple tasks) must satisfy all three gate conditions below. Each condition
maps directly to the `Inquiry Gate` section in `.github/.ai_ledger.template.md`.

### Gate Condition 1: Files Examined

**Minimum:** At least `inquiry.minimumFilesExamined` files read (default: 3).

Qualifying files:
- Source files in the affected feature or module
- Existing tests for the affected area
- Architecture or design docs relevant to the change
- API specs or schema files if the change has a data contract

Non-qualifying reads:
- README files read only for orientation
- Config files read only to confirm file existence
- Files read but not listed in the plan output

**Ledger signal:** `[x] Files examined` in the Inquiry Gate section.

---

### Gate Condition 2: Ambiguities Resolved

**Minimum:** Zero open ambiguities that would cause a design branch during
implementation.

Examples of ambiguities that block gate passage:
- Acceptance criteria that map to two different implementation approaches
- Missing API contract details (e.g., expected response shape unknown)
- Unknown authentication or permission boundary
- Design doc conflicts with existing code behaviour

Permitted open items (do not block gate passage):
- UI copy details that do not affect component structure
- Minor naming preferences that can be resolved in code review
- Performance targets that have no architectural implication until measured

**Ledger signal:** `[x] Ambiguities resolved` in the Inquiry Gate section.

---

### Gate Condition 3: Plan Approved

**Minimum:** A written implementation plan is present in the ledger or a linked
`verification-artifacts/target-<slug>.json` file, and the user or governor has
acknowledged it.

Plan must contain:
- List of files to create or modify
- Brief rationale for each structural decision
- Test strategy (which test files are affected)
- Risk or rollback notes if a change is irreversible

**Ledger signal:** `[x] Plan approved` in the Inquiry Gate section.

---

## Revert-Not-Patch Rule

When an implementation agent produces output that does not match the approved plan,
the corrective action is to **revert to the pre-change state and re-plan**, not to
patch forward iteratively from a misaligned implementation.

**Triggers for revert-and-replan (not patch-forward):**
- Agent modified files outside the plan's listed scope
- Agent introduced a structural change (new abstraction, changed data contract)
  not approved in the plan
- Implementation passes tests but diverges from the approved design in a way that
  creates future maintenance risk flagged in the plan's risk notes

**Procedure:**
1. Do not attempt to reconcile the unexpected change via further implementation.
2. Record the divergence under `Verification Failures` in the ledger.
3. Run `git restore <files>` or `git checkout HEAD -- <files>` to revert the
   affected files to their pre-change state.
4. Return to the Design Planning Architect to update the plan, then re-invoke
   the implementation agent with the revised plan.

**Exception:** Minor divergences (variable name changes, trivial formatting) that
do not affect the approved design may be accepted by the governor without
revert-and-replan. Record the acceptance rationale in the ledger.

---

## Watch Mode Integration (Hook Enforcement)

The `pre-tool-use.cjs` hook enforces Watch Mode in loop sessions. When
`hooks.preToolUse.watchModeEnabled: true` and the active `Session-Type` is `loop`,
tool calls matching `hooks.preToolUse.watchModeToolPatterns` will require explicit
user confirmation before executing.

This is a safety backstop — it does not replace the Inquiry Gate. The gate must be
passed in the ledger before any implementation agent is delegated to, regardless of
whether Watch Mode is enabled.

**Watch Mode tool patterns (configured in `solar.config.json`):**
- `run_in_terminal` — arbitrary terminal command execution
- `delete` — file or resource deletion operations
- `bulk_replace` — multi-file replacement operations
- `migrate` — schema or data migration operations

**Watch mode decision:** `permissionDecision: "ask"` — user can confirm or cancel.
This is never `deny` — blocking is reserved for governance failures, not Watch Mode.

---

## Config Reference

| Field | Location | Purpose |
|-------|----------|---------|
| `inquiry.minimumFilesExamined` | `solar.config.json` | Minimum codebase reads before gate passage |
| `hooks.preToolUse.watchModeEnabled` | `solar.config.json` | Enable/disable Watch Mode confirmation gate |
| `hooks.preToolUse.watchModeToolPatterns` | `solar.config.json` | Tool name substrings that trigger Watch Mode |

---

## Related Files

- `.github/.ai_ledger.template.md` — Inquiry Gate section fields
- `.github/solar-system/schemas/designer-output.schema.json` — Output schema the Design Planning Architect must conform to
- `.github/instructions/solar.instructions.md` — Inquiry Gate instruction section
