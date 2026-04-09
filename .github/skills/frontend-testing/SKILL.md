---
name: frontend-testing
description: "Use when adding or repairing frontend Vitest, RTL, reducer, hook, component, or page tests in the repository's frontend area."
user-invocable: false
---

# Frontend Testing

## When to Use

- Reducer or selector changes
- Component behavior changes
- New route or page interactions

## Procedure

1. Map the behavior to the smallest meaningful test surface.
2. Prefer semantic RTL queries over brittle selectors.
3. Cover the happy path and one meaningful edge case.
4. Run the narrowest relevant frontend tests.
5. Record failures or gaps in `.github/.ai_ledger.md`.

## Output

- Tests added or updated
- Checks run
- Remaining gaps
