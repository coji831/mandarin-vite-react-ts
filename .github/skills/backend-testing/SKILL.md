---
name: backend-testing
description: "Use when adding or repairing backend service, repository, route, controller, integration, or Prisma-sensitive tests in the repository's backend area."
user-invocable: false
---

# Backend Testing

## When to Use

- Service logic changes
- Route or controller changes
- Contract-sensitive backend work
- Schema-adjacent work requiring confidence

## Procedure

1. Map the behavior to the smallest meaningful backend test surface.
2. Prefer focused service or route tests before broad integration suites.
3. Cover the happy path and one meaningful edge case.
4. Run the narrowest relevant backend checks.
5. Record failures or gaps in `.github/.ai_ledger.md`.

## Output

- Tests added or updated
- Checks run
- Remaining gaps
