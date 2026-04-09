---
name: story-execution
description: "Use when executing a story end to end through plan, implement, test, docs, review, ledger updates, and bounded recursive repair."
argument-hint: "Story path or story identifier"
user-invocable: true
---

# Story Execution

## When to Use

- Story implementation from existing business requirements and implementation docs
- Bounded SOLAR loops for a single story

## Procedure

1. Read the story BR, implementation doc, `.github/copilot-instructions.md`, and `AGENTS.md`.
2. Decompose the story into work packages and record them in `.github/.ai_ledger.md`.
3. Delegate frontend, backend, testing, review, or docs work as needed.
4. Run focused verification after each meaningful step.
5. Close only when the ledger contains a non-pending completion promise.

## Output

- Work packages
- Delegations
- Verification state
- Completion or escalation decision
