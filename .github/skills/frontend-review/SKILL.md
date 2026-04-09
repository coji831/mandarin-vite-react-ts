---
name: frontend-review
description: "Use when reviewing frontend changes for regressions, accessibility, rendering risks, state correctness, or missing Vitest and RTL coverage."
user-invocable: false
---

# Frontend Review

## When to Use

- After frontend implementation work
- Before closing a frontend work package
- When a user requests review or regression analysis

## Procedure

1. Inspect changed frontend files and tests.
2. Challenge accessibility, state transitions, rendering assumptions, and integration risk.
3. Identify missing tests or brittle assertions.
4. **Code Gaming Detection (ARA)** — Check for: test modifications that bypass the real bug, deleted/skipped tests, unjustified mocks, or logic correct only in test context. Classify each finding using the ARA severity scale (CRITICAL / HIGH / MEDIUM / LOW).
5. Return findings with severity and required follow-up.

## Output

- Findings ordered by severity
- Missing verification
- Residual risk
