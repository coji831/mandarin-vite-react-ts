**Last Updated:** August 21, 2026

# Implementation 24-7: Guest Identity Calibration

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `09c59df8`

## Implementation Summary

Calibrated the guest identity to exactly Phase 1 — `createGuestPhaseGate` now returns `{currentPhase: 1, isGuest: true}` — with the minimal FE lockstep so the backend's calibrated shape and the FE shell agree. The change is **additive-safe** and lands across three layers: `shared-constants` (the gate shape + literal `.d.ts` + a new Vitest suite), `shared-types` (`PhaseGate.isGuest?: boolean`), and the FE shell (`AppLayout`, `usePhaseGate`, `phaseGateService`).

**New calibrated shape + why the sentinels are kept** — `createGuestPhaseGate` (`packages/shared-constants/src/index.js`) returns `{ currentPhase: 1, isGuest: true }` (previously `{currentPhase: 4, phase4Unlocked: true}` — guests saw everything). Two fields are deliberately preserved:

- `id: "guest-unlocked"` — the sentinel `isGuestPhaseGate` matches on, so the guest gate keeps being recognized as a guest gate.
- `phase4Unlocked: false` — a required boolean in `isPhaseGate`'s shape check, so the gate still satisfies the guard.

`PhaseGate.isGuest?: boolean` is added to `packages/shared-types/src/index.ts` as **optional** (additive-safe) — persisted user gates (without the field) remain valid and `isPhaseGate`/`isGuestPhaseGate` are untouched. The `.d.ts` return type matches with literals (`readonly currentPhase: 1; … readonly isGuest: true; …`).

**FE lockstep (minimal, mandatory):**

- **AppLayout single-source `effectivePhase`** — the unauthenticated `: 4` override is removed: `const effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`. The shell consumes the backend's calibrated gate; while the fetch is in-flight/failed (`phaseGate` null), authed users default to all-unlocked (`Infinity` — Review N7), but guests stay Phase 1 — never all-unlocked.
- **`usePhaseGate` re-fetch on auth identity change** — the hook keys its effect on the access token, so a guest→login (or login→logout) transition re-fetches `GET /v1/progression/phase-gate` instead of keeping a stale Phase-1 (or user) shell until reload. This is the staleness fix.
- **`phaseGateService` auth-keyed cache key** — the localStorage fallback now keys by `phaseGate:user` vs `phaseGate:guest` (based on the presence of the access token), so one identity's gate is never served to the other; the correct bucket is overwritten on every successful fetch.

**Consumers** — `createGuestPhaseGate` has exactly **one** backend repo caller: `ProgressionController.getPhaseGate` (Express; ported by 24-13), and guests now receive the calibrated shape (that's the intent). There is **no** FE caller and **no** FE `getGates` consumer — the FE consumes `fetchPhaseGate`; the backend `/gates` GUEST branch is **not** touched (deferred to the 24-13 port). The 24-5/24-6 auth guards read the calibration spec (F6), never this function — no code dependency.

**Comment hygiene (5 files)** — "guests = 4" comments updated to "guests = 1 — calibrated guest identity, Story 24-7": `GrammarList.tsx`, `grammarData.ts`, `ChengyuPage.tsx`, `GrammarPage.tsx`, and `GrammarPage.integration.test.tsx`.

**Tests** — new `shared-constants` suite (`packages/shared-constants/src/__tests__/guestPhaseGate.test.js`, 5 tests) — the package previously had `echo "No tests yet"` and gains a real `vitest.config.ts`; `AppLayout.test.tsx` adds the calibrated guest case (Phase-2+ locked) and the loading-default case (authed + null gate → not disabled); `AppLayout.guest.integration.test.tsx` (NEW) runs the real `usePhaseGate` + `apiClient` with MSW serving the **actual** `createGuestPhaseGate` imported from `@mandarin/shared-constants` (single source of truth).

**Behavior deltas to record:**

1. `usePhaseGate` briefly shows the old gate during a login re-fetch (inherent to the async fetch — acceptable, transient).
2. The cache is keyed by guest-vs-user presence, not per-user-id (two users on the same device share the `phaseGate:user` bucket until the fresh fetch lands — backend-down edge case).
3. `TopNav.stories.tsx` still says "Guest Mode — Phase 4, All Unlocked", but TopNav is retired (out of scope).

**Verification results (story gates):** `shared-constants` 5/5 · backend typecheck 0 · FE typecheck 0 · FE full 147/1092 · focused FE tests pass (`AppLayout` 2 files / 10 tests) · lint 0 errors · `check:module-boundaries` green · design-audit no new findings. (Full monorepo `test:full` not run — the backend doesn't assert the guest-gate shape; verified by grep: the only backend reference to `createGuestPhaseGate` is `ProgressionController.getPhaseGate`.)

## Technical Scope

Calibrate the guest identity across `shared-constants` (JS + `.d.ts` + new tests + package test tooling), `shared-types` (`PhaseGate.isGuest?` additive), and the minimal FE shell lockstep (`AppLayout` single-source `effectivePhase`, `usePhaseGate` auth-identity re-fetch, `phaseGateService` auth-keyed cache key), plus a guest e2e asserting the Phase-1 shape and comment hygiene in the FE gate-consumer files. This is the absorbed epic-25 F1 + identity-lockstep work — full FE guest-shell polish (badge/banner, route-gate fallback, design spec) is **not** absorbed (stays in epic-25).

**Files:**

- `packages/shared-constants/src/index.js` — **UPDATE**: `createGuestPhaseGate` → `{currentPhase: 1, isGuest: true}`; `id: "guest-unlocked"` + `phase4Unlocked: false` kept.
- `packages/shared-constants/src/index.d.ts` — **UPDATE**: literal return type → `{ readonly currentPhase: 1; … readonly isGuest: true; … }`.
- `packages/shared-constants/src/__tests__/guestPhaseGate.test.js` — **NEW**: 5-test suite for the calibrated guest gate.
- `packages/shared-constants/package.json` — **UPDATE**: `test` script `echo "No tests yet"` → `vitest run --config vitest.config.ts`.
- `packages/shared-constants/vitest.config.ts` — **NEW**: vitest config (`include: ["src/**/*.test.js"]`).
- `packages/shared-types/src/index.ts` — **UPDATE**: `PhaseGate.isGuest?: boolean` (additive).
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — **UPDATE**: unauthenticated `: 4` override removed → `effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`.
- `apps/frontend/src/shared/hooks/usePhaseGate.ts` — **UPDATE**: re-fetch on access-token change (auth-identity staleness fix).
- `apps/frontend/src/shared/services/phaseGateService.ts` — **UPDATE**: auth-keyed cache key (`phaseGate:user` vs `phaseGate:guest`).
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.test.tsx` — **UPDATE**: calibrated guest case + loading-default case.
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.guest.integration.test.tsx` — **NEW**: end-to-end guest Phase-1 assertion (real `usePhaseGate` + `apiClient` + MSW serving `createGuestPhaseGate`).
- Comment hygiene (5 files — "guests = 4" → "guests = 1 — calibrated"):
  - `apps/frontend/src/features/grammar/components/GrammarList.tsx` — **UPDATE**: JSDoc `currentPhase` comment.
  - `apps/frontend/src/features/grammar/utils/grammarData.ts` — **UPDATE**: `isLocked` phase-source comment.
  - `apps/frontend/src/pages/learn/chengyu/ChengyuPage.tsx` — **UPDATE**: phase-source comment.
  - `apps/frontend/src/pages/learn/grammar/GrammarPage.tsx` — **UPDATE**: phase-source comment.
  - `apps/frontend/src/pages/learn/grammar/__tests__/GrammarPage.integration.test.tsx` — **UPDATE**: phase-gate body comment.

## Implementation Details

### `createGuestPhaseGate` — calibrated Phase-1 shape

```javascript
// packages/shared-constants/src/index.js — calibrated guest identity (Story 24-7)
export function createGuestPhaseGate() {
  const now = new Date().toISOString();
  return {
    id: "guest-unlocked", // kept — isGuestPhaseGate sentinel
    currentPhase: 1, // calibrated: exactly Phase 1 (was 4)
    phase1Passed: false,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: false, // kept false — isPhaseGate required-boolean satisfied
    isGuest: true, // NEW — session-local guest identity marker
    qualificationScore: null,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: now,
    updatedAt: now,
  };
}
```

### `PhaseGate.isGuest?` — additive type (shared-types)

```typescript
// packages/shared-types/src/index.ts
export interface PhaseGate {
  // ...
  phase4Unlocked: boolean;
  /** Calibrated guest identity (Story 24-7): present only on the session-local
   *  guest gate (`createGuestPhaseGate` → `{currentPhase: 1, isGuest: true}`).
   *  Additive/optional so `isPhaseGate` and `isGuestPhaseGate` keep working for
   *  persisted user gates. */
  isGuest?: boolean;
  // ...
}
```

### AppLayout `effectivePhase` — single source, no `: 4`

```tsx
// apps/frontend/src/shared/layouts/AppLayout.tsx
// Calibrated guest identity (Story 24-7): the backend returns
// createGuestPhaseGate() → {currentPhase: 1, isGuest: true}, so the shell consumes
// that single source instead of a hardcoded `: 4` all-unlock. While the gate fetch
// is in-flight/failed (phaseGate null): authed users default to all-unlocked
// (Infinity — Review N7), guests stay Phase 1, never all-unlocked.
const effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1);
```

### `usePhaseGate` — re-fetch on auth identity change

```tsx
// apps/frontend/src/shared/hooks/usePhaseGate.ts
// The gate is identity-specific: guests get createGuestPhaseGate()
// ({currentPhase: 1, isGuest: true} — calibrated Story 24-7), logged-in users get
// their persisted gate. Re-fetch whenever the auth identity changes (guest ↔
// logged-in, keyed by the access token) so the shell never keeps a stale gate
// across login/logout.
const accessToken = localStorage.getItem("accessToken");

useEffect(() => {
  let isMounted = true; // Prevent state updates after unmount (React Strict Mode)
  setIsLoading(true);
  fetchPhaseGate()
    .then((gate) => { if (isMounted) setPhaseGate(gate); })
    .catch(() => { if (isMounted) setPhaseGate(null); })
    .finally(() => { if (isMounted) setIsLoading(false); });
  return () => { isMounted = false; };
}, [accessToken]);
```

### `phaseGateService` — auth-keyed cache key

```typescript
// apps/frontend/src/shared/services/phaseGateService.ts
// Single cache key, auth-keyed (calibrated identity lockstep — Story 24-7).
// The guest gate ({currentPhase: 1, isGuest: true}) and a logged-in user's
// persisted gate differ, so the localStorage fallback must never serve one
// identity's gate to the other.
function phaseGateCacheKey(): string {
  return localStorage.getItem("accessToken") ? "phaseGate:user" : "phaseGate:guest";
}

export async function fetchPhaseGate(): Promise<PhaseGate> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
    const data = response.data as PhaseGate;
    localStorage.setItem(phaseGateCacheKey(), JSON.stringify(data)); // auth-keyed, never cross-identity
    return data;
  } catch {
    const cached = localStorage.getItem(phaseGateCacheKey()); // THIS identity's cache
    if (cached) return JSON.parse(cached) as PhaseGate;
    throw new Error("Phase gate unavailable");
  }
}
```

## Architecture Integration

```
[Story 24-7: Guest Identity Calibration]
├── packages/shared-constants — createGuestPhaseGate → {currentPhase: 1, isGuest: true}
│     (index.js + index.d.ts literal + __tests__/guestPhaseGate.test.js + vitest.config.ts + test script)
├── packages/shared-types/src/index.ts — PhaseGate.isGuest?: boolean (additive)
├── apps/frontend/src/shared/layouts/AppLayout.tsx — unauthenticated :4 override removed →
│     effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)
├── apps/frontend/src/shared/hooks/usePhaseGate.ts — re-fetch on access-token change (staleness fix)
├── apps/frontend/src/shared/services/phaseGateService.ts — auth-keyed cache key (phaseGate:user|guest)
├── apps/frontend/src/shared/layouts/__tests__/AppLayout.test.tsx + AppLayout.guest.integration.test.tsx —
│     calibrated guest case + end-to-end Phase-1 assertion (MSW serves the real createGuestPhaseGate)
├── comment hygiene (5 files) — "guests = 4" → "guests = 1 — calibrated"
└── Consumers:
      ├── backend ProgressionController.getPhaseGate (Express) — the ONLY createGuestPhaseGate caller;
      │     guest branch returns the calibrated shape (ported by 24-13)
      ├── backend /gates GUEST branch — NOT touched (deferred to 24-13; no FE getGates consumer)
      └── FE shell — fetchPhaseGate consumes the calibrated gate; 24-5/24-6 guards read the
            calibration spec (F6), never this shape
```

Dependencies: sits between 24-6 and 24-8 in the serial order; sets the calibrated identity shape consumed by **24-13 (progression)** + the FE shell. The 24-5/24-6 auth guards target the calibration spec (F6) — **no code dependency** on this story. Parallel-safety: `shared-constants` (the highest collision zone) is touched here deliberately so 24-13 + the FE shell copy the settled shape.

## Technical Challenges & Solutions

### AppLayout-stays-mounted staleness — `usePhaseGate` must re-fetch on auth change

```
Problem: AppLayout mounts once and stays mounted across login/logout (auth pages keep the
        TopBar; the layout is not unmounted on auth transitions). Without a re-fetch, a guest
        who logs in keeps the Phase-1 guest shell, and a user who logs out keeps the user's
        gate — until a full page reload.
Root Cause: usePhaseGate's effect previously ran once on mount (empty deps) — it had no signal
        that the auth identity changed, so the shell served a stale gate across the guest↔user
        transition.
Solution: key the effect on the access token — `const accessToken = localStorage.getItem("accessToken")`
        in the hook body, `useEffect(..., [accessToken])`. Any login/logout (which writes/clears
        the token) re-runs the fetch and overwrites the shell's gate.
Impact: the shell always reflects the CURRENT identity's gate; a newly-logged-in user never keeps
        the calibrated Phase-1 guest shape, and a logged-out user never keeps an all-unlocked
        shell. Inherent, acceptable delta: the old gate is shown during the brief re-fetch until
        the new one lands.
Alternatives Considered: reading auth state from a store into the hook (would couple a generic
        shared hook to a feature store); keying the whole layout on auth (would unmount/remount
        the shell on every auth change). The token-keyed effect is the smallest, most local fix.
```

### Auth-keyed cache isolation in `phaseGateService`

```
Problem: phaseGateService caches the fetched gate to localStorage as a backend-down fallback.
        A single shared key would let one identity's gate leak to the other — a guest's Phase-1
        gate cached, then a logged-in user reads it (or vice-versa).
Root Cause: the original cache key was identity-agnostic; the calibrated change makes guest and
        user gates genuinely different shapes, so the cache must never cross identities.
Solution: key the cache by the presence of the access token — `phaseGate:user` vs `phaseGate:guest`.
        `usePhaseGate` re-fetches on auth change and overwrites the correct bucket on every
        successful fetch.
Impact: a backend outage never serves a user a guest's Phase-1 gate (or a guest a user's gate).
        Documented edge case: the key is guest-vs-user presence, not per-user-id — two users on
        the same device share the `phaseGate:user` bucket until the fresh fetch lands.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `progressionPhaseGate: "/v1/progression/phase-gate"` (GET), consumed by `fetchPhaseGate` via `apiClient.get`
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `createGuestPhaseGate`/`isGuestPhaseGate`/`isPhaseGate`/`PhaseGate`/`AppLayout`/`usePhaseGate`/`phaseGateService`/`ProgressionController` copied from the shipped files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — **API + session-local**: `fetchPhaseGate` → `apiClient.get(ROUTE_PATTERNS.progressionPhaseGate)`; the guest branch returns `createGuestPhaseGate()` (no DB row)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **`shared-constants` unit suite (NEW, 5 tests)** — `packages/shared-constants/src/__tests__/guestPhaseGate.test.js` (the package previously had `echo "No tests yet"`; new `vitest.config.ts` with `include: ["src/**/*.test.js"]`): calibrated Phase-1 shape (`currentPhase: 1`, `isGuest: true`); no all-unlock (`phase4Unlocked: false`, `currentPhase !== 4`); no passed gates / progression data (all `false`/`null`); `id: "guest-unlocked"` sentinel kept (so `isGuestPhaseGate` matches); `createdAt`/`updatedAt` stamped. **5/5 green.**
- **`AppLayout.test.tsx` (UPDATE)** — adds the calibrated guest case (guest + `{currentPhase: 1, isGuest: true}` → Foundations unlocked, Grammar `aria-disabled` + `title="Complete Phase 2 to unlock"`) and the loading-default case (authed + null gate → Learn group NOT disabled — Review N7). **10 tests across the 2 AppLayout files green.**
- **`AppLayout.guest.integration.test.tsx` (NEW, INTEGRATION tier)** — real `usePhaseGate` → `apiClient` → MSW serving the **actual** `createGuestPhaseGate()` imported from `@mandarin/shared-constants` (single source of truth): Phase-1 guest shape end-to-end (Foundations unlocked, Grammar locked) + gate-fetch-failure fallback (guest stays Phase 1, never all-unlocked).
- **Gates:** `shared-constants` 5/5 ✅ · backend typecheck 0 ✅ · FE typecheck 0 ✅ · FE full 147/1092 ✅ · focused FE tests pass ✅ · lint 0 errors ✅ · `check:module-boundaries` green ✅ · design-audit no new findings ✅. (Full monorepo `test:full` not run — the backend doesn't assert the guest-gate shape; verified by grep: the only backend reference to `createGuestPhaseGate` is `ProgressionController.getPhaseGate`.)
