---
name: phase-close-story
description: "Phase 4 of the lifecycle: closing a story — boxing the acceptance criteria, the BR/IMP pair and its doc-code truth-check, and the status and date the freshness scan reads."
user-invocable: true
---

# Phase 4 — Close a story

1. **Box the AC** — every criterion checked against the code, not against your memory of it.
2. **Set `status`** from the epic vocabulary and bump the update date **in the same commit** as the content
   edit. A stale date is the freshness scan's whole input.
3. **Run the truth-check on the pair**: endpoints exist with the method and path the router declares; names
   exist in `src/`; **counts are measured now**, never carried forward; the data source is what the code
   reads, guest fallback included; links resolve.
4. **Record the struggle the same day.** Cause and fix go in the implementation doc while you still
   remember them.
5. **Cross-link** BR ↔ implementation ↔ story files, and cite the PR in both.

## Exit gate

The doc-code truth-check passes on that pair, and `.github/skills/docs-audit/SKILL.md` has nothing open.

Hand off to `phase-close-epic` once the epic's last story is closed.