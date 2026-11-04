---
name: phase-design-gate
description: "Phase 2 of the lifecycle: the design gate before code — the component set per surface, each component's state list, spine resolution, and the human preview that ends the phase."
user-invocable: true
---

# Phase 2 — Design gate

Output is the component set per surface plus each component's state list. No code.

1. **Resolve before designing.** A need resolves to a spine component (`spine://components/{name}`) or a
   spine token (`spine://tokens`). Spine owns the generic layer; this repo owns the theme overlay and the
   `domain.pinyinpal` support tokens. Inventing either locally is a fork.
2. **Reuse before proposing.** `src/shared/components` holds `Button`, `Input`, `LoadingScreen`,
   `ErrorScreen`, `ProgressBar`, `FilterChip`, `ToggleSwitch` and `ContentBrowser`.
3. **Design every state first**: default, hover, focus-visible, active, disabled, loading, empty, error. A
   state nobody designed is a state a developer invents.

## Exit gate

The human preview gate: the owner has seen the component set and the state list and approved what the next
phase builds.

Hand off to `phase-build-story`.