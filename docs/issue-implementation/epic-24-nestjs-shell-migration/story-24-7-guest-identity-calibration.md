**Last Updated:** August 21, 2026

# Implementation 24-7: Guest Identity Calibration — `{currentPhase:1, isGuest:true}` + Minimal FE Lockstep

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md`
> **Last Updated:** August 21, 2026
> **Status:** Planned

## Technical Scope

Change the guest identity shape from the over-generous `{currentPhase: 4, phase4Unlocked: true}` to the calibrated **`{currentPhase: 1, isGuest: true}`** in `createGuestPhaseGate` (`packages/shared-constants/src/index.js`), update the `.d.ts` type + tests, and apply the **minimal FE lockstep**: remove `AppLayout`'s unauthenticated `: 4` override and unify the `getGates`/`getPhaseGate` guest branch to a single source. Add a guest e2e asserting the Phase-1 shape. This is the absorbed epic-25 F1 + identity-lockstep work — full FE guest-shell polish (badge/banner, route-gate fallback, design spec) is **not** absorbed (stays in epic-25).

**Files:**

- `packages/shared-constants/src/index.js` — **UPDATE**: `createGuestPhaseGate` (`:95`) returns `{ currentPhase: 1, isGuest: true }` (drop the `currentPhase: 4`/`phase4Unlocked: true` all-unlock).
- `packages/shared-constants/src/index.d.ts` — **UPDATE**: matching type (currently `readonly currentPhase: 4; … readonly phase4Unlocked: true` at `:90-98`) → `{ currentPhase: 1; isGuest: true; … }`.
- `packages/shared-constants/src/**/*.test.*` — **NEW/UPDATE**: unit tests for the calibrated guest gate shape; any consumer of `currentPhase: 4`/`phase4Unlocked` re-pointed.
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — **UPDATE**: remove the unauthenticated `: 4` fallback (`effectivePhase` no longer hard-codes `4` for guests — key off `isGuest`/the calibrated gate).
- `apps/frontend/src/**` (gate consumers: `getGates`/`getPhaseGate` guest branch) — **UPDATE**: unify the guest branch to the calibrated shape (single source, one cache key, cleared on auth change).
- `apps/frontend/src/**/__tests__/*` — **NEW/UPDATE**: guest e2e / component test asserting the Phase-1 shape.

## Implementation Details

### `createGuestPhaseGate` — `packages/shared-constants/src/index.js`

```javascript
// Before (:95-103) — guests see everything
export function createGuestPhaseGate() {
  return {
    currentPhase: 4,
    phase4Unlocked: true,
    // …
  };
}

// After — calibrated: guests unlock exactly Phase 1
export function createGuestPhaseGate() {
  return {
    currentPhase: 1,
    isGuest: true,
    // … (any fields the FE gate consumers rely on, e.g. phase1Passed: false)
  };
}
```

The `.d.ts` is updated in the same change (no JS↔type drift):

```typescript
export declare function createGuestPhaseGate(): {
  readonly currentPhase: 1;
  readonly isGuest: true;
  // …
};
```

### FE lockstep — `AppLayout`

```tsx
// Before (apps/frontend/src/shared/layouts/AppLayout.tsx:81) — guests hard-coded to 4
const effectivePhase = isAuthenticated ? (phaseGate?.currentPhase ?? Infinity) : 4;

// After — key off the calibrated gate / isGuest, no hard-coded :4
const effectivePhase = isAuthenticated
  ? (phaseGate?.currentPhase ?? Infinity)
  : phaseGate?.isGuest
    ? 1
    : 1;
```

The exact shape follows the calibrated `createGuestPhaseGate` output (`currentPhase: 1` + `isGuest`), and the `getGates`/`getPhaseGate` guest branch is unified so backend and shell agree on the same guest identity (single source, one cache key, cleared on auth change — kills the §7.2 guest↔user staleness).

### Guest e2e

Assert with the calibrated gate: a guest renders the Phase-1 shape end-to-end; guest flows (browse, quiz attempt, review view) still function after the change; no `currentPhase: 4`/`phase4Unlocked` all-unlock leaks into the guest shell.

## Architecture Integration

```
[Story 24-7: Guest Identity Calibration]
├── packages/shared-constants (index.js + index.d.ts + tests) — createGuestPhaseGate → {currentPhase:1, isGuest:true}
├── apps/frontend/src/shared/layouts/AppLayout.tsx — unauthenticated :4 override removed (isGuest)
├── apps/frontend gate consumers — getGates/getPhaseGate guest branch unified (single source, one cache key)
└── guest e2e — Phase-1 shape asserted
      ↓ consumed by 24-13 (progression `getPhaseGate` — the only backend `createGuestPhaseGate` caller) + the FE shell (settled in-story). The auth guards (24-5) consume the calibration spec (F6), not this shape.
```

Dependencies: **24-4** (shared substrate) + the calibrated shape being the single source of truth; sits between 24-6 and 24-8 in the serial order. Parallel-safety: touches `shared-constants` + FE gate consumers — the highest collision zone (`authMiddleware`/`shared-constants`) is handled here deliberately so the identity-reading port story (24-13) + the FE shell copy the settled shape; the guards (24-5) port the spec's calibrated semantics (single touch, no port-then-rework).

## Technical Challenges & Solutions

### Guest↔user gate disagreement (the §7.2 staleness)

```
Problem: getPhaseGate and getGates disagree for guests; the FE shell keys off the
        over-generous currentPhase:4 while the calibrated backend would ship currentPhase:1.
Solution: Land the calibrated createGuestPhaseGate shape + the minimal FE lockstep
        (AppLayout :4 → isGuest, getGates guest-branch unification) together in this story,
        so backend and shell agree before the identity-reading port story (24-13) copies the shape.
        One cache key, cleared on auth change.
```

### Why the FE lockstep is inside a backend epic

```
Problem: Under serial, there is no epic-25 to land the FE identity lockstep; shipping
        currentPhase:1 without the AppLayout/getGates lockstep would break guests at cutover.
Solution: 24-7 absorbs the minimal FE lockstep (small-but-mandatory, ~2 days) so the
        calibrated shape is safe to ship. Full FE guest-shell polish (badge/banner,
        route-gate fallback, design spec) stays in epic-25 — UI work with a design spec,
        not migration scope.
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **`shared-constants` unit tests:** `createGuestPhaseGate()` returns `{ currentPhase: 1, isGuest: true }`; no `phase4Unlocked` all-unlock.
- **FE component/e2e:** with the calibrated gate, `AppLayout` renders the Phase-1 shape for a guest; `getGates`/`getPhaseGate` agree for the same guest identity; guest flows (browse, quiz attempt, review view) still function.
- **Regression:** existing guest-flow tests pass after the gate change.
- **Gates:** Tier 1 `build`/`lint` (0 errors)/`test`; Tier 2 `test:full`/`typecheck`/`check:module-boundaries`/`test:integration`.
