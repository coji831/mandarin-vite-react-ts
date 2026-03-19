# Memory Governance Guide

This guide defines where information should live in the phase 1 SOLAR-Ralph system.

## Storage Layers

### `.ai_ledger.md`

Use for active execution state:

- current objective
- work queue
- blockers
- verification failures
- handoff results
- completion promise

### `/memories/repo/`

Use for concise verified facts that are useful across sessions:

- commands
- architecture facts
- workflow facts
- frontend facts
- backend facts
- security facts
- verification facts

### `docs/`

Use for durable guidance, rationale, and human-readable operating rules.

## Decision Rules

- If the note is about the current task state, put it in `.ai_ledger.md`.
- If the note is a short verified repo fact, put it in `/memories/repo/`.
- If the note teaches humans or explains policy, put it in `docs/`.
- If memory and documentation disagree, correct memory and keep docs authoritative.

## Anti-Patterns

- Copying long documentation into memory files
- Leaving stale blockers in the ledger after they are resolved
- Recording opinions or guesses as verified repo facts
- Using memory to avoid updating required docs
