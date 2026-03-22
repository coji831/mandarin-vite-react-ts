# SOLAR-Ralph Agency Contract

This repository uses a simplified SOLAR-Ralph operating model for bounded autonomous delivery.

## Purpose

The agency exists to carry a story or bounded epic through five coordinated layers:

- Specialist: frontend, backend, testing, security, documentation, and review roles
- Orchestrator: a governor that decomposes work, delegates, and decides closure
- Ledger: restart-safe state stored in `.ai_ledger.md` and concise persistent facts under `/memories/repo/`
- Adversarial: reviewers and verification gates that challenge changes before closure
- Recursive: bounded repair loops that continue until completion criteria or escalation conditions are reached

## Instruction Precedence

Apply instructions in this order when guidance overlaps:

1. User request and current task constraints
2. `.github/copilot-instructions.md`
3. `AGENTS.md`
4. Path-specific instructions in `apps/frontend/.instructions.md` and `apps/backend/.instructions.md`
5. Matching skills and agent definitions
6. `/memories/repo/` facts and `.ai_ledger.md`

Memory never overrides source-of-truth documentation. If memory and docs disagree, trust the docs and refresh the memory.

## Core Roles

- Orchestration Governor: owns intake, delegation, escalation, and completion decisions
- Design Planning Architect: owns solution shaping, decomposition strategy, architecture-fit checks, and high-signal planning output before implementation starts
- Frontend Implementation Specialist: owns UI, routing, client integration, and state changes
- Frontend Review Auditor: challenges frontend correctness, regressions, accessibility, and maintainability
- Frontend Test Specialist: owns frontend test coverage and failure triage
- Backend Implementation Specialist: owns API, service, data, and integration changes
- Backend Review Auditor: challenges backend correctness, data integrity, and contract safety
- Backend Test Specialist: owns backend and integration tests
- Cache and External Integration Specialist: owns Redis cache layers, external HTTP clients, TTL policies, and retry/circuit-breaker patterns in the backend
- Security Auditor: challenges auth, validation, secret handling, and high-risk flows
- Docs Curator: keeps rollout, implementation, and knowledge artifacts aligned

## Operating Artifacts

- `.ai_ledger.md`: active work queue, blockers, verification state, and completion promises
- `/memories/repo/*.md`: concise durable facts verified from the current codebase
- Repo docs: durable guidance, workflow rules, templates, and architectural decisions

## Session-Type Reference

| Session-Type  | Stop Hook Behaviour                | When to Use                                                                                           |
| ------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `chat`        | Allows clean exit                  | Governor planning, single delegation, knowledge queries                                               |
| `loop`        | Blocks exit, enforces continuation | `/ralph-loop` autonomous execution                                                                    |
| `manual-test` | Silent — no blocking, no message   | Human is interacting with the app; agent observes and reports findings without enforcing continuation |

## Execution Mode

Chat mode (`@orchestration-governor`): planning only — produces a plan and waits. Use for questions, single lookups, and scoping.
Loop mode (`/ralph-loop`): autonomous execution — runs multiple steps unattended until completion promise is met. Use for stories, bugs, and multi-step tasks.

When in doubt, prefer loop mode for any task that involves code changes.

## Pipeline Contracts

Every request maps to exactly one pipeline. Execute stages in order. Do not skip stages except where explicitly marked conditional.

Record the active pipeline and current stage in `.ai_ledger.md` Current Objective:

```
- Pipeline: Bug Fix
- Pipeline Stage: 1 — Bug Investigation
```

Update the stage field after each stage completes.

---

### Pipeline 1: Knowledge

**Signal:** question, explanation, "what is", "how does", code lookup

```
Governor → Answer directly. No ledger task. No loop. No specialists.
```

---

### Pipeline 2: Simple Fix

**Signal:** single known location, ≤2 files, ≤2 steps, root cause already clear

```
Governor
└─ 1. Implementation Specialist (frontend or backend)
└─ 2. Test Specialist (if logic changed)
└─ 3. Close
```

Session-Type: `chat` throughout. No `/ralph-loop` needed.

---

### Pipeline 3: Bug Fix

**Signal:** "investigate and fix", "bug in X", unknown root cause, regression, multi-step fix

```
Governor
└─ 1. Bug Investigation Specialist
      ├─ simple root cause  → skip stage 2, go to stage 3
      └─ architectural root cause → stage 2
└─ 2. Design Planning Architect  [conditional: architectural only]
      └─ Output: decomposed work packages written to ledger
└─ 3. /ralph-loop  [Session-Type: loop]
      └─ Implementation Specialist + Test Specialist per iteration
└─ 4. Review Auditor (frontend and/or backend)
      ├─ Findings exist → one repair iteration back to stage 3
      └─ No findings → stage 5
└─ 5. Security Auditor  [conditional: only if auth/JWT/CORS/cookies touched]
└─ 6. Close  [Session-Type: chat, WORK_PACKAGE_COMPLETE]
      Log-Backpressure Gate: before writing WORK_PACKAGE_COMPLETE, the agent MUST run the
      original reproduction script from stage 1 and confirm it no longer produces the error.
      Provide the passing log/output as evidence in the Completion Notes section of the ledger.
      A bug fix is NOT complete until the reproduction script passes.
```

---

### Pipeline 4: Feature

**Signal:** "implement", "add", "build", new feature, story, epic, "story-X"

```
Governor
└─ 1. Design Planning Architect
      └─ Output: decomposed work packages written to ledger
└─ 2. /ralph-loop  [Session-Type: loop]
      └─ Implementation Specialist + Test Specialist per iteration
└─ 3. Review Auditor (frontend and/or backend)
      ├─ Findings exist → one repair iteration back to stage 2
      └─ No findings → stage 4
└─ 4. Security Auditor  [conditional: only if auth/JWT/CORS/cookies touched]
└─ 5. Docs Curator
└─ 6. Close  [Session-Type: chat, WORK_PACKAGE_COMPLETE]
```

---

## Mandatory Delegation Matrix

These rules fire based on task signal, NOT on governor judgment. No exceptions.

| Signal                                                   | Required Agent                            | When                            |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| New story, epic, or feature                              | Design Planning Architect                 | BEFORE any implementation       |
| Bug with unknown root cause                              | Bug Investigation Specialist              | BEFORE any fix attempt          |
| Complex or architectural root cause (from investigation) | Design Planning Architect                 | AFTER investigation, BEFORE fix |
| Frontend code changes                                    | Frontend Implementation Specialist        | Always                          |
| Backend code changes                                     | Backend Implementation Specialist         | Always                          |
| Frontend changes complete                                | Frontend Review Auditor                   | BEFORE closure                  |
| Backend changes complete                                 | Backend Review Auditor                    | BEFORE closure                  |
| Auth, JWT, cookies, CORS, secrets, permissions touched   | Security Auditor                          | BEFORE closure                  |
| Redis, external HTTP client, TTL, retry, or cache work   | Cache and External Integration Specialist | Always                          |
| New logic or component                                   | Frontend or Backend Test Specialist       | Always                          |
| Doc or template changes                                  | Docs Curator                              | BEFORE closure                  |

High-intelligence agents (Design Planning Architect, Security Auditor) are invoked at well-defined entry points only — NOT for repeated iteration steps. This prevents cost spikes while ensuring they run where judgment matters.

## Verification Contract

No work package is complete until these are satisfied when relevant:

- Targeted tests pass
- Type or build checks pass for the affected lane
- Reviewer findings are either resolved or explicitly escalated
- Documentation impact is captured
- `.ai_ledger.md` reflects the current state

Verification findings must be summarized under the ledger sections for verification failures, review findings, and next actions.

When recording a failure in `.ai_ledger.md`, agents MUST include all three fields — a bare "test failed" entry is not acceptable:

```
- Verification Step: <what was checked>
- Failure: <what failed and the error output summary>
- Root Cause Hint: <why it failed + semantic direction for the fix>
```

The Root Cause Hint is the "semantic gradient" for the next iteration. It must state a direction — not just what broke, but which concept, abstraction, or data path to investigate next. This prevents repeated identical failures with no new hypothesis.

## Recursive Refinement Contract

Each bounded loop follows:

1. Plan the next smallest meaningful step
2. Implement only that step
3. Verify with the narrowest relevant checks
4. Repair failures or record blockers
5. Repeat until one completion promise is true

### Completion Promise Workflow

**How to emit a completion promise:**

1. Perform all required verification (tests, reviews, audits pass)
2. Document evidence in `.ai_ledger.md` Completion Notes section
3. **Replace the "Completion Promise" field** in "Current Objective" section:
   - From: `Completion Promise: pending`
   - To: `Completion Promise: <promise>WORK_PACKAGE_COMPLETE</promise>` (or BLOCKED/ESCALATION_REQUIRED)
4. The Stop hook will detect the non-pending promise and allow the session to exit

**Important:** The promise tag goes in the "Completion Promise" field (Current Objective section), NOT in a separate Completion Notes tag.

Supported completion promises:

- `<promise>WORK_PACKAGE_COMPLETE</promise>` — All work done, all verifications pass, ready to close
- `<promise>WORK_PACKAGE_BLOCKED</promise>` — Work blocked by external dependency, blocker documented in ledger
- `<promise>ESCALATION_REQUIRED</promise>` — Issue exceeds agent scope, escalated to human decision

Loop guardrails:

- Default maximum iterations per work package: `3`
- Escalate instead of looping if the same failure repeats without a new hypothesis
- Stop if the task requires policy, product, or external-system decisions that are not documented

## Stop Conditions

The agency may stop only when one of these is true:

- The active work package has a completion promise and no unresolved verification failures
- The ledger records a blocker with a concrete escalation reason
- The request is complete and all touched docs are synchronized

If none of the above is true, continue the bounded loop or escalate.
