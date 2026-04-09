# SOLAR-Ralph Agency Contract

This repository uses a simplified SOLAR-Ralph operating model for bounded autonomous delivery.

## Purpose

The agency exists to carry a story or bounded epic through five coordinated layers:

- Specialist: frontend, backend, testing, security, documentation, and review roles
- Orchestrator: a governor that decomposes work, delegates, and decides closure
- Ledger: restart-safe state stored in `.github/.ai_ledger.md` and concise persistent facts in `.github/instructions/*.instructions.md`
- Adversarial: reviewers and verification gates that challenge changes before closure
- Recursive: bounded repair loops that continue until completion criteria or escalation conditions are reached

## Instruction Precedence

Apply instructions in this order when guidance overlaps:

1. User request and current task constraints
2. `.github/copilot-instructions.md`
3. `.github/AGENTS.md`
4. Path-specific `.instructions.md` files (scoped by `applyTo` glob)
5. Matching skills and agent definitions
6. `.github/instructions/*.instructions.md` facts and `.github/.ai_ledger.md`

Memory never overrides source-of-truth documentation. If memory and docs disagree, trust the docs and refresh the memory.

## Core Roles

- Orchestration Governor: owns intake, delegation, escalation, and completion decisions
- Design Planning Architect: owns solution shaping, decomposition strategy, and high-signal planning before implementation starts
- Frontend Implementation Specialist: owns UI, routing, client integration, and state changes
- Frontend Review Auditor: challenges frontend correctness, regressions, accessibility, and maintainability
- Frontend Test Specialist: owns frontend test coverage and failure triage
- Backend Implementation Specialist: owns API, service, data, and integration changes
- Backend Review Auditor: challenges backend correctness, data integrity, and contract safety
- Backend Test Specialist: owns backend and integration tests
- Cache and External Integration Specialist: owns cache layers, external HTTP clients, TTL policies, and retry/circuit-breaker patterns
- Security Auditor: challenges auth, validation, secret handling, and high-risk flows
- Bug Investigation Specialist: traces bug root causes; does not implement fixes
- Docs Curator: keeps rollout, implementation, and knowledge artifacts aligned
- Release Readiness Specialist: verifies pipeline readiness before closure

## Session-Type Reference

| Session-Type  | Stop Hook Behaviour                | When to Use                                                      |
| ------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `chat`        | Allows clean exit                  | Governor planning, single delegation, knowledge queries          |
| `loop`        | Blocks exit, enforces continuation | `/ralph-loop` autonomous execution                               |
| `manual-test` | Silent — no blocking, no message   | Human testing; agent observes and reports without enforcing exit |

## Execution Mode

Chat mode (`@orchestration-governor`): planning only — produces a plan and waits. Use for questions, single lookups, and scoping.
Loop mode (`/ralph-loop`): autonomous execution — runs multiple steps unattended until completion promise is met. Use for stories, bugs, and multi-step tasks.
