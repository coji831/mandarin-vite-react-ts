# .github/solar-system/

This directory is the **SOLAR-Ralph isolated self-improvement boundary**.

## What belongs here

| Subdirectory   | Purpose                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| `.learnings/`  | Persistent learning capture files accumulated across work sessions                    |
| `context/`     | Context-tier documentation: tier model, artifact handle pattern, compaction policy    |
| `schemas/`     | Typed handoff JSON schemas for inter-agent output contracts (Phase 2+)                |
| `adversarial/` | Adversarial vulnerability pattern checklist for prompt injection detection (Phase 2+) |
| `protocols/`   | Lifecycle coordination, session resumption, and inquiry-first protocols (Phase 2+)    |
| `patterns/`    | Orchestration pattern cost/latency classification; output-position contract (Phase 3+, 5+) |
| `pipelines/`   | JIT-loaded pipeline stage definitions (Pipeline 0-4); loaded by governor at runtime (Phase 5+) |
| `logs/`        | Per-session activity log JSON files (gitignored); created by `session-start.cjs` (Phase 5+) |

## What does NOT belong here

- Project-facing instructions (`*.instructions.md`) — those live in `.github/instructions/`
- Active ledger state — that lives in `.github/.ai_ledger.md`
- Agent definitions (`*.agent.md`) — those live in `.github/agents/`
- Hook scripts (`*.cjs`) — those live in `.github/hooks/`
- Prompt commands (`*.prompt.md`) — those live in `.github/prompts/`

## Isolation Rule

Files in `solar-system/` are **SOLAR-internal** and must never be referenced in:

- Project-facing `copilot-instructions.md`
- Non-SOLAR story or epic documentation
- Agent delegation for non-SOLAR tasks

The governor and specialist agents may reference these files during SOLAR setup,
self-improvement, and governance operations only.

## Learning Capture Flow

1. `SessionStart` hook fires → `session-start.cjs` reads `.learnings/LEARNINGS.md`
   and injects a condensed summary into the session's `additionalContext`.
2. When a tool failure is detected during a work session, the `PostToolUse` hook
   surfaces a write instruction: record the error in `.learnings/ERRORS.md`.
3. At compound review time (`/solar-compound-review`), the governor extracts
   verified patterns from recent ledger tasks and promotes them into
   `.learnings/LEARNINGS.md` and updates `AGENTS.md` write-back rules.

## Directory Created

Phase 1 of SOLAR-Ralph v4 implementation (2026-04-04).
Phase 5 additions: `pipelines/` (JIT pipeline files), `logs/` (per-session activity log, gitignored), `patterns/output-position-contract.md`.
