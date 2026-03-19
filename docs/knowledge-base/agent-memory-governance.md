# Agent Memory Governance

Memory is useful only when it stays concise, verifiable, and subordinate to source-of-truth documentation.

## Phase 1 Layers

- `.ai_ledger.md` for active execution state
- `/memories/repo/` for concise verified repo facts
- `docs/` for durable guidance and rationale

## Governance Rules

- Do not store speculative claims in repo memory.
- Refresh or remove memory when code or docs change.
- Do not replace required documentation updates with memory-only notes.
- Keep memory short enough to remain usable during future sessions.

## Why This Matters

The ledger supports continuity during a single evolving task. Repo memory supports continuity across sessions. Documentation supports continuity for humans and for any future agent that needs authoritative guidance.
