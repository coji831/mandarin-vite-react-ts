---
name: memory-curation
description: "Use when deciding whether information belongs in repo memory, session memory, the AI ledger, or permanent documentation."
argument-hint: "Fact or note to classify"
user-invocable: true
---

# Memory Curation

## When to Use

- Classifying new facts discovered during work
- Cleaning up drift between instructions and docs
- Deciding what should persist across sessions
- Writing back a verified fact discovered during a task

## Procedure

1. Put active execution state in `.github/.ai_ledger.md`.
2. Put concise verified operational facts in `.github/instructions/*.instructions.md` (scoped by `applyTo` pattern).
3. Put enduring guidance and rationale in `docs/`.
4. Avoid duplicating the same long-form content across all three layers.

## Write-Back Rule (Ask to Remember)

When you verify a **new fact** during normal work — a real command, a naming pattern, an API contract, a folder path — write it back to the relevant instruction file immediately. Do not wait for the next setup scan.

- Choose the instruction file whose `applyTo` scope covers the fact's domain:
  - Architecture / commands → `architecture.instructions.md`
  - Frontend patterns → `frontend.instructions.md`
  - Backend patterns → `backend.instructions.md`
  - Auth / secrets → `security.instructions.md`
  - Test commands → `verification.instructions.md`
  - Naming / commit rules → `conventions.instructions.md`
  - Workflow steps → `workflow.instructions.md`
- Replace the matching `[FILL IN]` or `[SCAN-INCOMPLETE]` placeholder with the verified value.
- If no placeholder exists, append the fact as a new bullet under the relevant section heading.
- Never overwrite a fact that contradicts your new finding — flag it with `// CONFLICT:` instead.
- Keep entries to one bullet per fact. No prose.

## Output

- Chosen storage location
- Reason for that choice
- Instruction file updated (if write-back occurred)
- Follow-up cleanup needed
