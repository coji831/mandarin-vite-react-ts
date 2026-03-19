---
name: frontend-feature-implementation
description: "Use when implementing frontend React, TypeScript, routing, context, reducer, selector, page, or component changes in apps/frontend."
user-invocable: false
---

# Frontend Feature Implementation

## When to Use

- New UI flows
- State or reducer updates
- Route or page changes
- Frontend service-client integration work

## Procedure

1. Read `AGENTS.md`, `.github/copilot-instructions.md`, and `apps/frontend/.instructions.md`.
2. Identify the affected feature folder, route, and state boundary.
3. Implement the smallest coherent frontend change.
4. Update focused tests for reducers, hooks, components, or pages.
5. Record blockers or contract assumptions in `.ai_ledger.md`.

## Output

- Files changed
- State or UI boundaries touched
- Tests added or updated
- Integration assumptions
