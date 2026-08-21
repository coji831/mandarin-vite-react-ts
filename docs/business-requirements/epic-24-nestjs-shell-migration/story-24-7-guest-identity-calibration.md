**Last Updated:** August 21, 2026

# Story 24.7: Guest Identity Calibration — `{currentPhase:1, isGuest:true}` + Minimal FE Lockstep

## Description

**As a** product owner,
**I want to** change the guest identity shape from the over-generous `{currentPhase: 4, phase4Unlocked: true}` to the calibrated **`{currentPhase: 1, isGuest: true}`** in the shared gate (`createGuestPhaseGate`), with types/tests and the **minimal frontend lockstep** (AppLayout guest override removal + `getGates` guest-branch unification) plus a guest end-to-end check,
**So that** guests unlock exactly Phase 1 (the Blueprint) — not all content — and the backend and shell agree on the same guest shape before the identity-reading port story (24-13) and the cutover.

## Business Value

This is the serial re-ratification's second **new** story (`24-7`, inserted between the auth-module port `24-6` and the characters/mnemonics port `24-8`). Under the serial model, epic-25's guest-identity work (F1) is **absorbed into Epic 24**: `createGuestPhaseGate` currently returns `currentPhase: 4, phase4Unlocked: true` (`packages/shared-constants/src/index.js:95`), i.e. guests see everything — which erodes the reason to register and dilutes the staged roadmap. This story lands the calibrated shape (`{currentPhase:1, isGuest:true}`) in lockstep across `shared-constants` (backend + types + tests) **and** the minimal FE surfaces that key off it: `AppLayout`'s guest override (`apps/frontend/src/shared/layouts/AppLayout.tsx` — the `: 4` fallback for unauthenticated users) is removed in favor of `isGuest`, and the `getGates`/`getPhaseGate` guest branch is unified to a single source. The FE lockstep is **mandatory**: if the backend ships `currentPhase:1` while the shell still keys off `currentPhase:4`, the cutover breaks the guest experience. Full FE guest-shell polish (isGuest badge/banner, route-gate fallback screen, design spec) is **not** absorbed — it stays in epic-25.

## Acceptance Criteria

- [ ] `createGuestPhaseGate` in `packages/shared-constants/src/index.js` returns `{ currentPhase: 1, isGuest: true }` (no `phase4Unlocked` all-unlock), with the `.d.ts` type (`packages/shared-constants/src/index.d.ts`) updated to match.
- [ ] `shared-constants` unit tests updated/added proving the new guest gate shape (and any existing consumers of `currentPhase: 4`/`phase4Unlocked` re-pointed).
- [ ] **FE lockstep:** `AppLayout` removes its unauthenticated `: 4` override (`effectivePhase` no longer falls back to `4` for guests — it uses the calibrated gate / `isGuest`), and the `getGates`/`getPhaseGate` guest branch is unified to a single source (one cache key, cleared on auth change).
- [ ] **Guest e2e:** with the calibrated gate, a guest renders the Phase-1 shape end-to-end; the guest flows (browse, quiz attempt, review view) still function after the change.
- [ ] No full FE guest-shell UI work (badge/banner, route-gate fallback screen, design spec) — that remains in epic-25 (F3 residual).
- [ ] No backend auth-guard change here (that is 24-5/24-6); this story is `shared-constants` + minimal FE lockstep only.
- [ ] Gates green: `npm run build`, `npm run lint` (0 errors), `npm run typecheck --workspace=@mandarin/backend`, `npm test`, `npm run test:full`, `npm run test:integration`.

## Business Rules

1. **Calibrated shape is the contract** — guest = `{currentPhase: 1, isGuest: true}`; never "all-unlocked". `createGuestPhaseGate` and `getGates`/`getPhaseGate` must **agree** for the same guest identity (single source, one cache key, cleared on auth change — kills the §7.2 staleness).
2. **FE lockstep is mandatory, and bounded** — the AppLayout `: 4 → isGuest` removal + `getGates` guest-branch unification ship here (they are the minimal FE changes needed so a `currentPhase:1` backend doesn't break guests at cutover). Full guest-shell polish stays in epic-25.
3. **No auth-guard changes here** — the auth guards are ported to the **calibrated** semantics in 24-5 (F6 unification); this story only lands the shared identity shape + FE lockstep.
4. **No backend route changes** — `ProgressionController.getGates`/`getPhaseGate` guest branch unification is FE-side in this story (backend port of the calibrated shape rides 24-6/24-11); the controller surface is not touched here.
5. **Type-safety** — the `.d.ts` is updated in the same change as the implementation (no drift between the JS and the declaration).

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-5--auth-surface-guards-calibrated)) (related — guards target the calibrated semantics per the calibration spec; no code dependency on this story)
- **Story 24.6: Auth Module Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-6--auth-module-port)) (related — `/me` requires auth; guest handling comes from the 24-5 guards)
- **Story 24.13: Quiz + Progression Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-13--quiz--progression-port)) (consumer — progression guest branch unified to the calibrated gate)
- **Implementation (IMP twin):** `story-24-7-guest-identity-calibration.md` → `../../../issue-implementation/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md`

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
