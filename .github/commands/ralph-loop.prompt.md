---
name: ralph-loop
description: "Invoke a bounded SOLAR-Ralph autonomous loop. Takes one step, verifies, updates the ledger, and repeats until the completion promise is met or max iterations is reached. Use for unattended story or bug-fix execution."
model: "GPT-5 mini (copilot)"
---

[TASK]: ${input:task:Describe the task to complete autonomously}
[MAX_ITERATIONS]: ${input:maxIterations:Maximum loop iterations before escalation (default: 5)}
[COMPLETION_PROMISE]: WORK_PACKAGE_COMPLETE

## Specification-First Check

Before starting the loop, check `.ai_ledger.md` Current Objective for a `VerificationTarget:` field.

- **If present**: Read the JSON file at that path. All loop iterations must drive toward the `successCriteria` defined there. The loop exits only when every criterion's `verificationCommand` produces output matching `expectedOutput`. Use this file as the authoritative definition of done — do not accept partial completion.
- **If absent**: Proceed with the standard loop contract below.

## Loop Contract

You are running a bounded SOLAR-Ralph autonomous loop. Follow this cycle until the completion promise is satisfied or max iterations is reached:

1. **Set Session-Type** — Before anything else, write `Session-Type: loop` in the `.ai_ledger.md` Current Objective section. This tells the Stop hook to enforce continuation.
2. **Plan** — Take one meaningful step toward the task. Keep scope to the smallest verifiable unit.
3. **Implement** — Make only the change needed for this step. Do not batch multiple steps.
4. **Verify** — Run the narrowest relevant check (targeted test, `tsc --noEmit`, lint) against the changed files only.
5. **Update Ledger** — Record the step outcome and any blockers in `.ai_ledger.md`.
6. **Check Promise** — If the work is fully complete and verification passes, write the completion promise and set `Session-Type: chat` to release the Stop hook.
7. **Continue or Escalate** — If not done and iterations remain, proceed to the next step. If blocked without a new hypothesis, escalate instead of retrying the same action.

## Completion Promises

Write exactly one of these to `.ai_ledger.md` when the loop exits:

- `<promise>WORK_PACKAGE_COMPLETE</promise>` — All acceptance criteria met and verification passes.
- `<promise>WORK_PACKAGE_BLOCKED</promise>` — Blocked with no new approach available.
- `<promise>ESCALATION_REQUIRED</promise>` — A policy, product, or external-system decision is needed.

## Guardrails (Cost Minimization)

- Use the narrowest verification scope at each iteration — avoid full `npm test` when a targeted run suffices.
- Delegate design or architecture decisions to the Design Planning Architect before implementing.
- Do not restart the loop if the same failure repeats without a new hypothesis — write `WORK_PACKAGE_BLOCKED` and escalate.
- Commit verified work incrementally so progress is not lost across restarts.
- Default to 5 iterations maximum unless the user specifies otherwise.
