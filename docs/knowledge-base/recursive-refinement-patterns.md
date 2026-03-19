# Recursive Refinement Patterns

Recursive refinement in this repository is a bounded repair loop, not an open-ended autonomy mode.

## Loop Shape

1. Identify one unresolved failure.
2. Form one concrete repair hypothesis.
3. Apply the smallest change that tests the hypothesis.
4. Re-run the narrowest relevant verification.
5. Either record a completion promise or escalate.

## Why It Is Bounded

Unbounded loops hide drift and can waste requests without improving quality. Phase 1 therefore caps repair attempts per work package and requires escalation when the same failure repeats.

## Phase 1 Tooling

Phase 1 uses `AGENTS.md`, `.ai_ledger.md`, and `.github/hooks/hooks.json` to support the loop. A wider slash-command surface is intentionally deferred.
