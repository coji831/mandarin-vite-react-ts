---
name: backend-feature-implementation
description: "Use when implementing backend Express, Prisma, service, repository, route, controller, middleware, or backend contract changes in apps/backend."
user-invocable: false
---

# Backend Feature Implementation

## When to Use

- API endpoint changes
- Service or repository logic changes
- Schema-sensitive backend work
- Middleware or controller updates

## Procedure

1. Read `AGENTS.md`, `.github/copilot-instructions.md`, and `apps/backend/.instructions.md`.
2. Identify the affected backend layer and contract surface.
3. Implement the smallest coherent backend change.
4. Update focused tests.
5. Record schema, contract, or rollout risks in `.ai_ledger.md`.

## Output

- Files changed
- Contract or data impact
- Tests added or updated
- Open blockers
