---
name: frontend-feature-implementation
description: "Use when implementing frontend React, TypeScript, routing, context, reducer, selector, page, or component changes in the repository's frontend area."
user-invocable: false
---

# Frontend Feature Implementation

## When to Use

- New UI flows
- State or reducer updates
- Route or page changes
- Frontend service-client integration work

## Procedure

1. Read `AGENTS.md`, `.github/copilot-instructions.md`, and the repository's frontend instructions file (e.g., a `.instructions.md` scoped to the frontend area) if present.
2. Identify the affected feature folder, route, and state boundary.
3. **Responder** — Implement the smallest coherent frontend change as a first draft.
4. **Evaluator** — Self-critique the draft before finalizing:
   - Does it follow conventions in `.github/instructions/conventions.instructions.md` (seeded from the project scan; fall back to `CONTRIBUTING.md` or any detected convention file if not present)?
   - Does it touch only the files in scope (no unrelated changes)?
   - Are all new exported functions, hooks, or components covered by a test?
   - Does it break any existing interface contracts?
5. **Revisor** — Apply corrections from the Evaluator step. Do not skip even if the draft looks correct.
6. Update focused tests for reducers, hooks, components, or pages.
7. Record blockers or contract assumptions in `.github/.ai_ledger.md`.

## Output

- Files changed
- State or UI boundaries touched
- Tests added or updated
- Integration assumptions
