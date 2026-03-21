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
3. **Responder** — Implement the smallest coherent backend change as a first draft.
4. **Evaluator** — Self-critique the draft before finalizing:
   - Does it follow conventions in `docs/guides/code-conventions.md`?
   - Does it preserve all existing API contracts (no breaking changes without an explicit flag)?
   - Are all new service or repository functions covered by a targeted test?
   - Does it introduce any unsafe validation, auth, or secret handling?
5. **Revisor** — Apply corrections from the Evaluator step before writing the final code.
6. Update focused tests.
7. Record schema, contract, or rollout risks in `.ai_ledger.md`.

## Output

- Files changed
- Contract or data impact
- Tests added or updated
- Open blockers
