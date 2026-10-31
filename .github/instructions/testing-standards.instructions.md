---
description: "Minimum testing requirements per tier: what must be tested, at what level, before a story closes. Read when adding logic, writing tests, or completing a story."
applyTo: "apps/frontend/src/**/*.ts,apps/frontend/src/**/*.tsx,apps/backend/src/**/*.ts"
---

# Testing standards

The shape is a trophy, not a pyramid: static checks and integration tests carry the weight, unit tests
stay narrow, and end-to-end covers a few critical journeys.

| Tier | What it is | When it runs |
| --- | --- | --- |
| Static | `tsc`, eslint, stylelint, `design-audit` | every change |
| Unit | one pure function or hook in isolation | logic worth isolating |
| Integration | a component or service with real collaborators, MSW for HTTP | the largest slice |
| End-to-end | a critical journey through the real app | few, and only critical |

## Minimum per tier

- **New logic** gets a unit test for the branch that is not obvious, and an integration test for the
  behaviour a user would notice.
- **A new component** gets a story (the component contract) plus an integration test for its states.
- **A service** gets an integration test against MSW handlers, not against a live backend.
- **A bug fix** gets a test that fails before the fix. A fix without one is a fix that can regress
  silently.
- **A backend endpoint** gets a service test and, where it carries a contract, an api-spec entry.

## Never ship untested

- A new branch in a pure function with no unit test.
- A component state that no test or story reaches.
- A migration or schema change with no test of the new shape.
- Logic copied from elsewhere: the copy needs its own test, because it will drift from the original.

## Gates

Tier 1 and Tier 2 are defined in `project-workflow.instructions.md` and are the only place a gate list
lives. Run `npm test` for the changed scope while working; `npm run test:full` before a story closes.
A failure that already exists belongs in `docs/guides/testing/known-failures.md`: match it there first
rather than re-triaging from scratch.

## The reasoning lives in the guide

Why the trophy and not the pyramid, what each tier catches that the one below misses, and the
cost/confidence curve: `docs/guides/testing/frontend.md` and `docs/guides/testing/backend.md`.
