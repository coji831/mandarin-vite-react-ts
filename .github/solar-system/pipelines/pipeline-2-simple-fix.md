# Pipeline 2: Simple Fix

**Signal:** single known location, 2 or fewer files, 2 or fewer steps, root cause already clear

## Pipeline Stages

```
Governor
└─ 1. Implementation Specialist (frontend or backend)
└─ 2. Test Specialist (if logic changed)
└─ 3. Close
```

Session-Type: `chat` throughout. No `/ralph-loop` needed.

## Stage Completion Criteria

**Stage 1 — Implementation Specialist:**

- Change is confined to the known location
- No new files created beyond what was scoped
- Self-critique step complete

**Stage 2 — Test Specialist (conditional: only if logic changed):**

- Tests updated or added to cover the changed path
- Test suite passes

**Stage 3 — Close:**

- Ledger updated with outcome
- No unresolved verification failures
