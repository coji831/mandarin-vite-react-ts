---
name: memory-verification
description: "Use when applying facts from .github/instructions/ to confirm those facts still match the current codebase before acting on them. Prevents errors from stale architecture instructions."
user-invocable: false
---

Validate that facts from `.github/instructions/` still match the codebase before applying them. Prevents errors from outdated instruction content.

## When to Use

Load this skill at the start of any task where you:

- Apply a pattern or architecture fact from `.github/instructions/`
- Reference a specific file, function, or component from an instruction file
- Use a previously recorded API contract, state shape, or service boundary

## Constraints

- Do not skip verification to save time. A 5-second check prevents a 30-minute repair loop.
- Do not assume memory is correct just because it was recently written.
- Do not flag a memory as stale based on superficial differences (e.g., minor rename). Verify the semantic meaning is unchanged.

## Approach

For each memory claim being applied:

1. **Locate the reference** — Find the exact file, function, or component the memory describes.
2. **Verify existence** — Confirm the file/function/component still exists at the recorded path.
3. **Verify semantics** — Confirm the described behavior, contract, or shape still matches the current code.
4. **Check for recent changes** — Look for co-located test changes or updated type definitions that suggest a refactor.
5. **Classify the memory:**
   - ✅ **Valid** — Still accurate. Apply it.
   - ⚠️ **Stale** — No longer matches the current code. Do not apply. Record the discrepancy.
   - ❓ **Uncertain** — Partial match or ambiguous. Verify manually before applying.
6. **Update if stale** — Write a correction to the relevant `.github/instructions/*.instructions.md` file with current facts before proceeding.

## Output Format

For each verified memory:

- Memory claim: `<what the memory states>`
- Verification result: ✅ Valid / ⚠️ Stale / ❓ Uncertain
- Discrepancy (if stale): `<what has changed>`
- Action taken: Applied / Skipped / Updated
