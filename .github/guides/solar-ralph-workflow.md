# SOLAR-Ralph Workflow Guide

This guide maps the simplified SOLAR-Ralph system onto the repository's existing delivery workflow.

## Objective

Use the SOLAR pillars without replacing the repository's current operating rules. The framework is an execution overlay, not a second process.

## Mapping To Existing Workflow

| SOLAR Pillar | Repo Workflow Stage       | Primary Output                                              |
| ------------ | ------------------------- | ----------------------------------------------------------- |
| Specialist   | Implement, Test, Docs     | Focused code, tests, and documentation changes              |
| Orchestrator | Review, Plan, Gates       | Work packages, delegation, escalation decisions             |
| Ledger       | Throughout                | `.github/.ai_ledger.md` and `.github/instructions/` updates |
| Adversarial  | Test, Review, Gates       | Findings, failed checks, residual risk                      |
| Recursive    | Implement, Verify, Repair | Bounded loops until a completion promise or escalation      |

## Standard Flow

1. Intake: the Orchestration Governor reads the request, current docs, and ledger.
2. Decompose: split work into the smallest meaningful frontend, backend, testing, docs, or review packages.
3. Implement: assign the work to the relevant specialist.
4. Verify: run focused tests and adversarial review.
5. Repair: if verification fails, run a bounded recursive loop.
6. Close: write a non-pending completion promise to `.github/.ai_ledger.md` and synchronize affected docs.

## Phase 1 Simplifications

- The ledger is a single markdown file, not a full event stream.
- Hooks cover only prompt guidance, post-tool reminders, and stop-time completion checks.
- Recursive refinement is bounded to small work packages with a maximum of three iterations.
- Persistent memory is local repo memory only; hosted Copilot Memory is out of scope for phase 1.

## Completion Promises

Use one of these promises when a loop is ready to close:

- `<promise>WORK_PACKAGE_COMPLETE</promise>`
- `<promise>WORK_PACKAGE_BLOCKED</promise>`
- `<promise>ESCALATION_REQUIRED</promise>`

If no completion promise is justified, continue the loop or escalate.
