---
name: memory-curation
description: "Use when deciding whether information belongs in repo memory, session memory, the AI ledger, or permanent documentation."
argument-hint: "Fact or note to classify"
user-invocable: true
---

# Memory Curation

## When to Use

- Classifying new facts discovered during work
- Cleaning up drift between memory and docs
- Deciding what should persist across sessions

## Procedure

1. Put active execution state in `.ai_ledger.md`.
2. Put concise verified operational facts in `/memories/repo/`.
3. Put enduring guidance and rationale in `docs/`.
4. Avoid duplicating the same long-form content across all three layers.

## Output

- Chosen storage location
- Reason for that choice
- Follow-up cleanup needed
