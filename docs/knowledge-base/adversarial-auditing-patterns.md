# Adversarial Auditing Patterns

The adversarial layer exists to challenge work before it is declared complete.

## What Counts As Adversarial

- Reviewer findings with severity and follow-up actions
- Missing-test identification
- Contract and migration risk checks
- Security-sensitive flow review

## Phase 1 Shape

Phase 1 does not implement a large artifact pipeline. Instead, adversarial outputs are concise auditable summaries recorded in review results and `.ai_ledger.md`.

## Closure Rule

If a serious reviewer finding or failed verification remains unresolved, the work package should not receive a completion promise.
