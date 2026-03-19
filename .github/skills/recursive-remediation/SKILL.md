---
name: recursive-remediation
description: "Use when a bounded SOLAR loop must repair a failed test, review finding, or verification issue without expanding scope uncontrollably."
argument-hint: "Failure or blocker to remediate"
user-invocable: true
---

# Recursive Remediation

## When to Use

- Repeated test or review failures within one work package
- Bounded repair loops after a focused implementation step

## Procedure

1. Restate the smallest unresolved failure.
2. Form one concrete repair hypothesis.
3. Implement only that hypothesis.
4. Re-run the narrowest relevant verification.
5. Stop after three iterations or earlier if the same failure repeats without a stronger hypothesis.
6. Record the outcome and next action in `.ai_ledger.md`.

## Output

- Failure being addressed
- Current hypothesis
- Verification result
- Completion or escalation decision
