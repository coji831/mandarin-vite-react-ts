**Last Updated:** August 21, 2026

# Story 24.7: Guest Identity Calibration

## Description

**As a** product owner,
**I want to** calibrate the guest identity to exactly Phase 1 — `createGuestPhaseGate` returns `{currentPhase: 1, isGuest: true}` in `packages/shared-constants` (`index.js` + `.d.ts` + a new Vitest suite), with the **minimal frontend lockstep** (`AppLayout` drops the unauthenticated `: 4` all-unlock, `usePhaseGate` re-fetches on auth-identity change, `phaseGateService` keys its cache by guest-vs-user) and a guest end-to-end assertion of the Phase-1 shape,
**So that** guests unlock exactly the Phase-1 (Blueprint) shell — never all content — and the backend's calibrated shape agrees with the FE shell (no guest regression at the 24-15 cutover), setting the calibrated identity shape consumed by 24-13 (progression) and the FE shell.

## Business Value

This is the serial re-ratification's second **new** story (`24-7`, inserted between the auth-module port `24-6` and the characters/mnemonics port `24-8`). Under the serial model, epic-25's guest-identity work (F1) is **absorbed into Epic 24**: `createGuestPhaseGate` previously returned `{currentPhase: 4, phase4Unlocked: true}` (`packages/shared-constants/src/index.js`), i.e. guests saw everything — eroding the reason to register and diluting the staged roadmap. This story lands the calibrated shape (`{currentPhase: 1, isGuest: true}`) in lockstep across `shared-constants` (JS + types + tests) **and** the minimal FE surfaces that key off it: `AppLayout`'s unauthenticated `: 4` fallback is removed in favor of a single-source `effectivePhase` (`phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`), `usePhaseGate` re-fetches when the auth identity changes (guest ↔ logged-in), and `phaseGateService` keys its localStorage cache by guest-vs-user so one identity's gate is never served to the other. The FE lockstep is **mandatory**: if the backend ships `currentPhase: 1` while the shell still keys off `currentPhase: 4`, the cutover breaks the guest experience. The guest e2e (`AppLayout.guest.integration.test.tsx`) proves the Phase-1 shape end-to-end through the real `usePhaseGate` → `apiClient` → `createGuestPhaseGate` path. Full FE guest-shell polish (isGuest badge/banner, route-gate fallback screen, design spec) is **not** absorbed — it stays in epic-25.

## Acceptance Criteria

- [x] `createGuestPhaseGate` in `packages/shared-constants/src/index.js` returns `{ currentPhase: 1, isGuest: true }` — no all-unlock; `phase4Unlocked: false` kept so `isPhaseGate`'s required-boolean check stays satisfied; `id: "guest-unlocked"` sentinel kept so `isGuestPhaseGate` (shared-types) keeps recognizing the guest gate. The `.d.ts` (`packages/shared-constants/src/index.d.ts`) matches with literal types.
- [x] `shared-constants` tests updated — new suite `packages/shared-constants/src/__tests__/guestPhaseGate.test.js` (5 tests) proving the calibrated shape; the package `test` script is flipped from `echo "No tests yet"` to `vitest run --config vitest.config.ts` (new `packages/shared-constants/vitest.config.ts`); 5/5 green.
- [x] `PhaseGate.isGuest?: boolean` added to `packages/shared-types/src/index.ts` — additive/optional so `isPhaseGate` and `isGuestPhaseGate` keep working for persisted user gates.
- [x] **Minimal FE lockstep:** `AppLayout` removes the unauthenticated `: 4` override — single-source `effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`; `usePhaseGate` re-fetches on auth-identity change (keyed by the access token); `phaseGateService` uses an auth-keyed cache key (`phaseGate:user` vs `phaseGate:guest`). **Note:** the FE consumes `fetchPhaseGate` — there is **no** FE `getGates` consumer, and the backend `/gates` GUEST branch is intentionally left for the 24-13 port.
- [x] **Guest e2e** asserts the Phase-1 shape end-to-end — `AppLayout.guest.integration.test.tsx` runs the real `usePhaseGate` + `apiClient` with MSW serving the actual `createGuestPhaseGate` (single source of truth); a guest renders the Phase-1 identity (Foundations unlocked, Phase-2+ locked), including the gate-fetch-failure fallback.
- [x] **Consumers:** `createGuestPhaseGate` has exactly **one** backend repo caller — `ProgressionController.getPhaseGate` (Express; ported by 24-13) — and guests now receive the calibrated shape; the FE shell consumes it via `fetchPhaseGate`. No full FE guest-shell UI (badge/banner, route-gate fallback, design spec — stays in 25).
- [x] Gates green: `shared-constants` 5/5; backend + FE typecheck 0 errors; FE full suite 147/1092; focused FE tests pass; lint 0 errors; `check:module-boundaries` green; design-audit no new findings attributable to 24-7.

## Business Rules

1. **Calibrated shape is the contract** — guest = `{currentPhase: 1, isGuest: true}`; never all-unlocked. `id: "guest-unlocked"` (the `isGuestPhaseGate` sentinel) and `phase4Unlocked: false` (a required boolean in `isPhaseGate`'s shape check) are preserved unchanged.
2. **`isGuest` is additive** — the field is optional on `PhaseGate`, so persisted user gates (without it) remain valid and `isPhaseGate`/`isGuestPhaseGate` are untouched.
3. **FE lockstep is mandatory and bounded** — the AppLayout `: 4` removal + `usePhaseGate` re-fetch + auth-keyed cache key ship here (the minimal FE changes so a `currentPhase: 1` backend doesn't break guests at cutover). Full guest-shell polish (badge/banner, route-gate fallback, design spec) stays in epic-25.
4. **Backend `/gates` GUEST branch NOT touched here** — deferred to the 24-13 port; the FE has no `getGates` consumer, so no FE lockstep is required for it now.
5. **No backend auth-guard change here** — the guards were ported to the calibrated semantics in 24-5/24-6 (F6); this story lands the shared identity shape + FE lockstep only.
6. **Type-safety** — the `.d.ts` is updated in the same change as the implementation (no JS↔type drift).
7. **Comment hygiene** — "guests = 4" comments in the FE gate-consumer files are updated to "guests = 1 (calibrated)" in the same change.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([BR](story-24-5-auth-guards-calibrated.md)) (related — the guards target the calibration spec (F6), never `createGuestPhaseGate`; no code dependency on this story)
- **Story 24.6: Auth Module Port** ([BR](story-24-6-auth-module-port.md)) (dependency — sits between 24-6 and 24-8 in the serial order)
- **Story 24.13: Quiz + Progression Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-13--quiz--progression-port)) (consumer — progression guest branch unified to the calibrated gate; `getPhaseGate` is the only backend `createGuestPhaseGate` caller)
- **Implementation (IMP twin):** `story-24-7-guest-identity-calibration.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `09c59df8`
- **Implementation note:** `createGuestPhaseGate` calibrated to `{currentPhase: 1, isGuest: true}` (sentinels `id: "guest-unlocked"` + `phase4Unlocked: false` preserved so `isGuestPhaseGate`/`isPhaseGate` keep working); `PhaseGate.isGuest?: boolean` added (additive); minimal FE lockstep — AppLayout single-source `effectivePhase`, `usePhaseGate` re-fetch on auth change, `phaseGateService` auth-keyed cache key; new shared-constants Vitest suite (5/5) + `AppLayout.guest.integration.test.tsx` (MSW serves the actual `createGuestPhaseGate`); 5 comment-hygiene files updated. All 7 ACs verified against the shipped code (commit `09c59df8`) — commit hash deferred to epic close.
