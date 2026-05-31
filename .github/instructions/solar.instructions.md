---
applyTo: "[FILL IN — e.g., apps/frontend/** or src/client/**]"
---

# SOLAR-Ralph Copilot Instructions

This file contains all SOLAR-specific Copilot instructions, workflows, and overlays. Project-specific instructions should remain in `.github/copilot-instructions.md`.

---

## 🤖 SOLAR-Ralph Operating Overlay

When work is executed through the repo's SOLAR-Ralph files, treat the user's project workflow as the governing delivery path and the SOLAR files as the execution overlay.

**Core SOLAR Files:**

- Orchestration contract: `.github/AGENTS.md`
- Restart-safe ledger: `.github/.ai_ledger.md`
- Lifecycle hooks: `.github/hooks/hooks.json`
- Path-specific instructions: `.github/instructions/solar.instructions.md`
- Operator guides: `.github/guides/solar-ralph-workflow.md`, `.github/guides/agent-operations-guide.md`, `.github/guides/memory-governance-guide.md`

**Working Rules:**

- Keep active execution state in `.github/.ai_ledger.md`
- Keep concise persistent facts in `.github/instructions/*.instructions.md` (scoped by `applyTo` glob patterns)
- Keep durable guidance in `docs/`
- Use bounded recursive repair loops with explicit completion promises instead of open-ended retry
- Route frontend, backend, security, review, and documentation work through their matching specialist roles when the SOLAR overlay is active

---

## 📝 Format Safety Rules

**Scope:** All SOLAR agents writing or modifying files in the target repository (project source files, docs, configs). Full rules in `.github/solar-system/patterns/output-position-contract.md`.

### Core Rules

1. **Read before writing** — Read full existing files before modifying; identify section headers and confirm exact placement before writing
2. **Correct section placement** — Place content only in the matching section header (exact match); never place in approximate or nearby sections
3. **Use templates** — Always search `docs/templates/` for matching document template before creating new files
4. **Never invent structure** — If target section or template cannot be determined with confidence, STOP and ask; do not write to approximate location

**Enforcement:** Implementation agents carry `<output_contract>` blocks referencing this contract. Review auditors check output-position compliance as part of review step.

---

## 🧪 Task-Level Development Workflow

Follow this sequence for every task (feature, bug fix, or enhancement):

1. **Review** — Confirm AC clarity; resolve ambiguities before coding
2. **Plan** — Identify impacted areas; check architecture docs for conflicts
3. **Implement** — Keep scope bound to AC; defer extras to a follow-up task
4. **Test** — Cover happy path + at least one edge case; isolate unit tests for new logic
5. **Run Locally** — Verify manually; capture any AC discrepancies
6. **Docs** — Record decisions, data shape changes, performance notes
7. **Pre-Commit Gate** — Tests pass; type check & lint clean
8. **Commit** — `<type>(<scope>): <summary>`; include doc updates in same commit

**If blocked:** Pause and record the blocker with a concrete escalation reason in `.github/.ai_ledger.md`.

---

## 🛠️ SOLAR Setup & Bootstrap

**Bootstrap Mode Override:**

- Use only for setup and recovery operations
- Bypasses all SOLAR governance hooks temporarily
- Activated automatically by the `Solar Bootstrap` agent
- Manual activation: `/solar-enter-bootstrap` (emergency only)
- Manual deactivation: `/solar-exit-bootstrap`

**Installation Modes:**

- **Minimal install:** Installs only core framework files (agents, hooks, skills, prompts, guides)
- **Enhanced install:** Runs full setup wizard and scaffolds project files (ledger, instructions, memory)

**Setup Commands:**

- `/solar-setup-quick` — Tier 1: Standard scan + config + scaffold + activate (recommended for most users)
- `/solar-setup-full` — Tier 2: Greedy scan + domain-adaptive agents, instructions, and workflow files
- `/solar-setup-scan-repo` — Manual: Auto-detect project stack and paths only
- `/solar-setup-apply-config` — Manual: Apply config from profile to core files, agents, and skills
- `/solar-setup-instructions` — Advanced: Scaffold domain instruction templates on demand

**Activation:**
All governance and memory files are created only after setup is complete. SOLAR remains disabled until `solar.active: true` is set in `.github/solar.config.json` (automatically set by `/solar-setup-quick`).

---

## 📁 SOLAR-Ralph Key Files

**Workflow & Operations:**

- SOLAR Workflow Guide: `.github/guides/solar-ralph-workflow.md`
- Agent Operations Guide: `.github/guides/agent-operations-guide.md`
- Memory Governance Guide: `.github/guides/memory-governance-guide.md`

**Knowledge Base:**

- Full documentation: `docs/knowledge-base/`
- Implementation guideline: `SOLAR-Ralph-implementation-guideline.md`
- Framework reference: `docs/solar-ralph-reference.md`

---

For complete details, see the SOLAR-Ralph implementation guideline and knowledge base in `docs/knowledge-base/`.

---

## 🧠 Self-Improvement Write-Back Rules

SOLAR maintains three persistent learning files under `.github/solar-system/.learnings/`.
Agents and the governor must follow these rules for writing to each file.

### When to Write to ERRORS.md

Write a new entry to `.github/solar-system/.learnings/ERRORS.md` when:

- A tool call fails and the failure reveals a non-obvious constraint or edge case
- An agent produces output that is incorrect and must be retried with a different approach
- A command or script throws an unexpected error that required debugging to resolve

**Format:**

```
### [DATE] [TOOL NAME] — [SHORT DESCRIPTION]
**Error:** <exact error or behaviour>
**Context:** <what task was in progress>
**Root Cause:** <why it occurred>
**Corrective Action:** <what resolved it>
**Prevention:** <rule to avoid recurrence>
```

**Do NOT write to ERRORS.md for:**

- Expected failures (e.g., a file not found when the intent was to check existence)
- Errors that are already documented in ERRORS.md
- Trivial formatting issues that were immediately corrected

### When to Write to LEARNINGS.md

Write a new entry to `.github/solar-system/.learnings/LEARNINGS.md` when:

- A convention or project-specific rule is confirmed by a successful outcome
- A non-obvious solution is discovered that would have caused confusion for a fresh agent
- An architectural fact is validated that is not obvious from reading the code alone
- A corrective action from ERRORS.md has been validated and generalised into a rule

**Format:**

```
### [DATE] [CATEGORY] — [SHORT TITLE]
**Learning:** <the verified fact or rule>
**Context:** <scope — which files, tasks, or patterns this applies to>
**Source:** <ledger entry or task that confirmed this>
```

**Do NOT write to LEARNINGS.md for:**

- Observations that have not been validated (unconfirmed hypotheses go to the ledger)
- Project-specific implementation details that change frequently
- Learnings that are already covered by an existing instruction file

### When to Write to FEATURE_REQUESTS.md

Write a new entry to `.github/solar-system/.learnings/FEATURE_REQUESTS.md` when:

- A recurring friction point is observed that no existing SOLAR mechanism addresses
- An agent reaches the boundary of what the current governance structure can handle
- A workflow improvement is identified that would reduce token cost or error rate

**Do NOT write to FEATURE_REQUESTS.md for:**

- One-time issues that are project-specific
- Requests that are already tracked in FEATURE_REQUESTS.md

### Compound Review

Run `/solar-compound-review` at the end of a multi-session work package to batch-promote
validated error corrections into LEARNINGS.md and update AGENTS.md governance rules.
Do not write directly to LEARNINGS.md during normal task execution unless the fact is
immediately validated — defer to compound review for pattern promotion.

---

## 🔍 Inquiry Gate

Before any implementation agent is delegated to, the Inquiry Gate in the active
`.github/.ai_ledger.md` must be fully checked. An unchecked gate is a hard block
on implementation delegation — not a warning.

Full criteria are defined in: `.github/solar-system/protocols/inquiry-first.md`

### Gate Conditions Summary

**Files Examined:** At least `inquiry.minimumFilesExamined` files (default: 3) must
have been read as part of codebase research. Only files read for substantive
understanding count — orientation reads of README files do not count.

**Ambiguities Resolved:** All AC ambiguities that would cause a design branch during
implementation must be resolved before the plan is approved. Trivial naming and
style choices do not count as blocking ambiguities.

**Plan Approved:** A written implementation plan (or spec-first VerificationTarget)
must be present in the ledger or linked artifact, and the governor or user must have
explicitly acknowledged it. A plan that has not been acknowledged is not approved.

### Inquiry Gate Enforcement

The Design Planning Architect produces the inquiry checklist as a required output
block. The governor checks the ledger Inquiry Gate section before delegating to
any implementation agent. If any gate condition is unchecked, the governor must
return to the Design Planning Architect to complete the inquiry, not proceed.

### Revert-Not-Patch Rule

When an implementation agent produces output that diverges from the approved plan
in a significant way (new files modified, structural decisions not in the plan,
data contract changes):

1. **Do not patch forward.** Record the divergence in `Verification Failures`.
2. **Revert** the affected files: `git restore <files>` or `git checkout HEAD -- <files>`.
3. **Return to Design Planning Architect** to update the plan before re-delegating.

Minor divergences (cosmetic changes, equivalent naming) may be accepted by the
governor with a rationale note in the ledger. Significant divergences always
trigger revert-and-replan.

---

## 📐 Designer Output Contract (S2)

Before any implementation agent is invoked, the Design Planning Architect must
produce output that conforms to `.github/solar-system/schemas/designer-output.schema.json`.

### Enforcement Rule

The governor must verify that the Design Planning Architect's plan includes all
required schema fields before delegating to any implementation agent. If required
fields are missing, the governor returns to the Design Planning Architect — it does
not proceed with a partial or informal plan.

### Schema Enforcement Policy (OD-2 Option A)

Enforcement is **instruction-level only** — VS Code Copilot does not support
constrained decoding. Route to Security Auditor only when:

- A required field is absent from the plan output, OR
- `solar.config.json` has `hooks.preToolUse.requireDesignBeforeImpl: true` and the
  ledger has no approved design entry, OR
- The change touches a security-sensitive area (auth, cookies, JWT, CORS, secrets,
  permission boundaries)

For standard feature work with a schema-conformant plan, trust the Design Planning
Architect output and proceed to implementation delegation without an additional
Security Auditor review pass.
