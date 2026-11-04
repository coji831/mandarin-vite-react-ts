---
name: phase-build-story
description: "Phase 3 of the lifecycle: building one story — the pre-implementation checks, the code-change checklist, the Tier 1 gates, the implementation record, and the commit gate."
user-invocable: true
---

# Phase 3 — Build a story

## Before you touch code

1. **Find the pattern that already exists.** Search for a sibling implementation first; a second way to do
   a solved thing is the defect.
2. **Verify the structure you are about to touch** — the route constant in `paths.ts`, the service, the
   store, the component's registry entry. Read, do not assume.
3. **Check the data source**: which endpoint, which content file, which fallback a guest gets.

## The change

- The smallest change that satisfies the AC; nothing unrelated moved.
- A new branch of logic has a test; a bug fix has a test that failed before it.
- Types are real, not `any`; a new public symbol has a named interface.
- A new component has a registry entry, a story and its state set.

## Exit gate

The Tier 1 gates pass (`quality-gates-tier-1`) and the owner has said **"commit allowed"** — an ambiguous
"go ahead" is not permission.

Hand off to `phase-close-story`.