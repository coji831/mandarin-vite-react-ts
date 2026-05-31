---
name: backend-review
description: "Use when reviewing backend API, service, repository, validation, auth, middleware, or Prisma changes for safety, regressions, and missing coverage."
user-invocable: false
---

# Backend Review

## When to Use

- After backend implementation work
- Before closing a backend work package
- When a user requests backend review or risk analysis

## Procedure

1. Inspect changed backend layers and tests.
2. Challenge contract safety, data integrity, auth handling, and validation.
3. Identify missing tests or unsafe assumptions.
4. **Code Gaming Detection (ARA)** — Check for: hardcoded test responses, skipped tests, mock overuse hiding integration risk, or service logic that detects and bypasses test context. Classify each finding using the ARA severity scale (CRITICAL / HIGH / MEDIUM / LOW).
5. Return findings with severity and required follow-up.

## Output

- Findings ordered by severity
- Missing verification
- Residual operational risk
