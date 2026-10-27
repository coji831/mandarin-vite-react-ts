**Last Updated:** October 27, 2026

# Implementation 25-2: Guest Identity Lockstep — One Guest Gate, One Cache Key

> **BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-2-guest-identity-lockstep.md`
> **Status:** In Progress
> **Last Update:** October 27, 2026
> **Key Commit:** pending

## Implementation Summary

Story 25-2 closes the measured §7.2 staleness: the only phase-gate cache is localStorage keyed by
identity **class** (`phaseGate:guest` / `phaseGate:user`, `shared/services/phaseGateService.ts`) and
`phaseGate:user` was **never** cleared (`AuthContext.logout()` removed only the token). User A's cached
gate was therefore served to user B on a shared device whenever the gate fetch failed — a cross-user
leak of gate state, not merely a cosmetic staleness.

The fix keeps the class split (identity-in-key is blocked: `shared/hooks/**` may not import
`features/auth`, and no user id is persisted) and **evicts on every identity transition** instead. The
service owns the namespace so no caller hardcodes a cache key.

## Frontend

**Files:**

- `apps/frontend/src/shared/services/phaseGateService.ts` — update: owns the cache namespace, exports
  `clearPhaseGateCache()` + `purgeLegacyPhaseGateResidue()`, doc states the eviction contract
- `apps/frontend/src/shared/services/index.ts` — update: barrel-exports the two helpers
- `apps/frontend/src/shared/hooks/usePhaseGate.ts` — update: drops the in-state gate when the identity
  (access token) changes
- `apps/frontend/src/features/auth/context/AuthContext.tsx` — update: eviction at the six identity
  transitions + one-shot boot purge
- `apps/frontend/src/pages/learn/grammar/GrammarPage.tsx` — update: guest clamp on the phase fallback
- `apps/frontend/src/pages/learn/radicals/RadicalsPage.tsx` — update: guest clamp on the phase fallback
- `apps/frontend/src/shared/services/__tests__/phaseGateService.test.ts` — **NEW**: cache contract tests
- `apps/frontend/src/shared/hooks/__tests__/usePhaseGate.test.tsx` — **NEW**: hook tests
- `apps/frontend/src/features/auth/context/__tests__/AuthContext.phaseGateEviction.test.tsx` — **NEW**:
  cross-identity leak regression (logout/login + refresh-cookie restore)
- `apps/frontend/src/pages/learn/grammar/__tests__/GrammarPage.integration.test.tsx` — update: guest clamp
- `apps/frontend/src/pages/learn/radicals/RadicalsPage.integration.test.tsx` — update: guest clamp
- `apps/frontend/src/pages/learn/radicals/RadicalsPage.test.tsx` — update: renders under `AuthProvider`
- `docs/architecture.md` — update: `/gates` guest payload corrected (line 344)

### 1. The namespace now has an owner

`apps/frontend/src/shared/services/phaseGateService.ts`

- `clearPhaseGateCache()` — removes every `phaseGate:*` key (prefix scan, collected before deleting so
  `removeItem` cannot re-index the loop) and nothing else.
- `purgeLegacyPhaseGateResidue()` — one-shot deletion of the pre-25-2 `phaseGate:user` residue, guarded
  by a marker (`mandarin:phaseGate-identity-purge:v1`) that lives **outside** the `phaseGate:` namespace,
  so `clearPhaseGateCache()` cannot re-arm it and wipe a freshly written gate on the next boot.
- Both are re-exported from the `shared/services` barrel; `fetchPhaseGate()` is unchanged in behaviour
  (auth-keyed write on success, auth-keyed read on failure) and the module doc now states the eviction
  contract.

### 2. Eviction at every identity transition (`features/auth/context/AuthContext.tsx`)

Line numbers are the post-change numbers in this worktree (the audit's numbers had drifted).

| #   | Site                                                                               | Line | Why                                                                                               |
| --- | ---------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| 0   | `initAuth` boot, before the token check — `purgeLegacyPhaseGateResidue()`          | 66   | destructive of pre-25-2 residue only                                                              |
| 1   | `login()` success — `clearPhaseGateCache()`                                        | 184  | A → B without a logout                                                                            |
| 2   | `register()` success — `clearPhaseGateCache()`                                     | 212  | guest → user (the `phaseGate:guest` bucket must go too)                                           |
| 3   | `logout()` `finally` — `clearPhaseGateCache()`                                     | 233  | **the leak path**                                                                                 |
| 4   | api-client logout callback (silent 401) — `clearPhaseGateCache()`                  | 153  | refresh failure at request time was previously unhandled                                          |
| 5   | `initAuth` refresh-failure cleanup (catch) — `clearPhaseGateCache()`               | 111  | boot-time identity loss                                                                           |
| 6   | `initAuth` refresh-cookie restore, after `setUser(user)` — `clearPhaseGateCache()` | 84   | the non-obvious leg: a restored session may belong to a different person than the gate in storage |

Sites 1–5 evict immediately after the token mutation and **before** `setUser(...)`: the token is
`usePhaseGate`'s identity dependency, so clearing first guarantees the refetch can never read the
previous identity's bucket. Site 6 has no token mutation in that branch (`requestAccessToken` already
wrote it), so the eviction sits directly after `setUser` — React commits (and runs the hook effect) only
after this synchronous block, so it still precedes the refetch.

`shared/hooks/usePhaseGate.ts` also drops the gate **in state** (`setPhaseGate(null)`) when its
`accessToken` dependency changes. Evicting localStorage alone would still let the previous identity's
gate stay on screen for the duration of the new identity's fetch; the hook now exposes no gate until the
server answers, which is what business rule 3 ("in-flight must not unlock") requires.

### 3. Page-level guest clamps

| File                                       | Change                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/learn/grammar/GrammarPage.tsx:40`   | `currentPhase = phaseGate?.currentPhase ?? (isAuthenticated ? defaultPhase : 1)` — a failed-fetch guest no longer gets the dev `4` / prod `2` preview phase |
| `pages/learn/radicals/RadicalsPage.tsx:87` | `effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? defaultPhase : 1)` — a failed-fetch guest keeps the Phase-1 framing instead of the dev `3`  |

`pages/` is the orchestrator layer and may read `useAuth`; the components below stay presentational.
Card lock badges are unchanged (readiness signals, not walls).

### 4. Tests added

| File                                                                               | Coverage                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/services/__tests__/phaseGateService.test.ts` (**NEW**)                     | key selection per identity class; write on success into exactly one bucket; **cached read on fetch failure**; guest never served a `phaseGate:user` value; `clearPhaseGateCache()` removes every `phaseGate:*` key and nothing else (incl. an unknown future member) and makes the next failing fetch throw; legacy purge runs once and is not re-armed |
| `shared/hooks/__tests__/usePhaseGate.test.tsx` (**NEW**)                           | one fetch path; refetch on access-token change (guest → user → guest); failure resolves `null`; a previously resolved gate is dropped when the next identity's fetch fails; **no gate is exposed while the new identity's fetch is in flight**                                                                                                          |
| `features/auth/context/__tests__/AuthContext.phaseGateEviction.test.tsx` (**NEW**) | **the leak regression**: A's gate cached → logout → B logs in → gate fetch fails → B sees `null`, never A's `currentPhase`; and the `initAuth` refresh-cookie restore leg evicts a previous identity's `phaseGate:user`                                                                                                                                 |
| `pages/learn/grammar/__tests__/GrammarPage.integration.test.tsx`                   | guest + failing gate → all three seeded patterns stay locked (no phase above 1)                                                                                                                                                                                                                                                                         |
| `pages/learn/radicals/RadicalsPage.integration.test.tsx`                           | guest + failing gate → the Phase-1 page framing is kept (no "Radical Trees" upgrade)                                                                                                                                                                                                                                                                    |
| `pages/learn/radicals/RadicalsPage.test.tsx`                                       | harness moved to `renderWithProviders` because the page now reads `useAuth()`                                                                                                                                                                                                                                                                           |

Mutation check performed: with sites 3 and 6 removed, the regression test fails on both legs
(`phase` reads `4`, `phaseGate:user` survives logout). Restored, it passes.

### 5. Residual windows (stated honestly — this is eviction, not identity-in-key)

1. **A transition that misses the helper.** The cache is keyed by class, so any future identity change
   that does not call `clearPhaseGateCache()` serves the previous identity's gate _while the fetch
   fails_. The helper makes that a one-line contract for new call sites; the test suite pins the six that
   exist.
2. **Authenticated `Infinity` fail-open.** Between an identity transition and the first successful gate
   fetch, an authenticated learner temporarily falls back to "all unlocked" in `AppLayout`
   (`phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`) — the documented deliberate exception
   from Story 24-7. Eviction does not change it; a guest is always Phase 1.
3. **Residue at rest.** A's `phaseGate:user` survives in localStorage until the next transition (or the
   one-shot boot purge). Anyone with DevTools on the device can read it — it is a gate _number_, not a
   credential, and the token is removed on logout.
4. **Out of this slice (Story 25-3 owns Learn un-gating).** `features/radicals/components/RadicalTreesTab.tsx:39-40`
   keeps its own `import.meta.env.DEV ? 3 : 1` fallback (prod `1`, so no production leak), and the two
   page-level fallbacks above stay dev-preview-only for authenticated learners. Both are inside the
   Learn walls 25-3 removes.

### 6. Doc truth

`docs/architecture.md:344` said guests receive an **all-passed** response from `/gates`; corrected to the
shipped Phase-1-only `createGuestPhaseGate()` answer. No other line in that file changed.

### Validation

| Command                                                                                                                                                                                                                    | Result                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `npx vitest run --project='!storybook' src/shared/services/__tests__/phaseGateService.test.ts src/shared/hooks/__tests__/usePhaseGate.test.tsx src/features/auth/context/__tests__/AuthContext.phaseGateEviction.test.tsx` | 3 files / 18 tests pass     |
| `… + src/pages/learn/grammar/__tests__/GrammarPage.integration.test.tsx src/pages/learn/radicals/RadicalsPage.integration.test.tsx src/pages/learn/radicals/RadicalsPage.test.tsx`                                         | 6 files / 39 tests pass     |
| `npm run test:full` (`apps/frontend`)                                                                                                                                                                                      | 156 files / 1147 tests pass |
| `npm run build` (`apps/frontend`, `tsc -b && vite build`)                                                                                                                                                                  | see coordinator report      |
| `npm run lint --workspace=@mandarin/frontend`                                                                                                                                                                              | see coordinator report      |
| `npm run check:module-boundaries`                                                                                                                                                                                          | see coordinator report      |

## Backend

**Files:**

- `apps/backend/src/modules/progression/services/gateStatus.factory.ts` — **NEW**: `buildGuestGateStatus`
  (the one place the guest `/gates` payload is produced), `GuestGateIdentity`, `GuestGateStatus`
- `apps/backend/src/modules/progression/index.ts` — update: barrel-exports `buildGuestGateStatus` + its
  two types (module surface, like the other modules' helper exports)
- `apps/backend/src/modules/progression/nest/progression-nest.controller.ts` — update: `getGates` guest
  branch calls `buildGuestGateStatus(createGuestPhaseGate())`; header + handler comments describe one
  derived answer instead of two guest branches
- `apps/backend/src/modules/progression/services/__tests__/gateStatus.factory.test.ts` — **NEW**: derivation,
  drift proof (Phase 4), boundary, and non-guest guard
- `apps/backend/src/modules/progression/nest/__tests__/progression-nest.controller.test.ts` — update: new
  `/gates` ≡ derivation-of-`/phase-gate` case (the two endpoints cannot disagree)
- `apps/backend/tests/integration/nest/quiz-progression-parity.test.ts` — update: two new DB-backed cases —
  both guest endpoints for one anonymous identity, and two registered users reading their own gate

### 1. One answer, two shapes (`gateStatus.factory.ts`)

`getPhaseGate` returned `createGuestPhaseGate()` while `getGates` hand-wrote a **second** guest payload —
three gate objects, each carrying its own `"Guest — Phase 1 only"` string, i.e. three hand-copied versions
of an answer `/phase-gate` was already serving (`progression-nest.controller.ts:173-180` before this
change). Two independently written answers for one identity is a drift bug: change the guest phase in one
place and `/gates` keeps asserting Phase 1 forever.

`buildGuestGateStatus(guest)` is now the only producer of the guest gates, called as
`buildGuestGateStatus(createGuestPhaseGate())` — the same value `/phase-gate` returns. Every field is a
function of the guest identity:

| Field (each of `phase2Gate`, `characterCountGate`, `phase3To4Gate`) | Derivation                                       | Phase 1 (shipped, unchanged wire bytes) | `{ currentPhase: 4 }` (drift test)        |
| ------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------- | ----------------------------------------- |
| `passed`                                                            | `guest.currentPhase >= 2`                        | `false`                                 | `true`                                    |
| `reason`                                                            | `"GUEST"` while locked; absent when passed       | `"GUEST"`                               | absent (a passed gate has no lock reason) |
| `details`                                                           | `` `Guest — Phase ${guest.currentPhase} only` `` | `"Guest — Phase 1 only"`                | `"Guest — Phase 4 only"`                  |
| (guard, not a field)                                                | `isGuest` must be true, else throws              | ok                                      | ok                                        |

The three gates share one derivation (a guest has no per-gate data) — there is no per-gate literal left to
diverge. Key order for the locked payload is `passed`, `reason`, `details`, i.e. **byte-identical** to the
retired hand-written object: the parity assertion at
`tests/integration/nest/quiz-progression-parity.test.ts:633-647` and the controller unit case were left
untouched and still pass.

**Why a builder and not one shared object.** The surfaces have different shapes: `/phase-gate` returns a
`PhaseGate` (id, `currentPhase`, the four phase flags, retention columns, timestamps), `/gates` returns
`{ phase2Gate, characterCountGate, phase3To4Gate }` of `GateResult`s. No single value can be both, so the
shared thing is the _derivation_, not the payload: the builder takes the guest slice (`currentPhase` +
`isGuest`) of the `PhaseGate` answer and projects it. Both endpoints read one answer while keeping their
own contracts.

**Why not collapse `/gates` onto `/phase-gate`.** They answer different questions. `/phase-gate` serves the
persisted row (what the quiz flow wrote); `/gates` **re-evaluates** each gate against current data, which
is the only way a gate passed outside the quiz flow (e.g. the ≥500 character-count gate) becomes visible
(`docs/architecture.md:336-346`). Collapsing them would either change the persisted-gate payload or drop
the computed gates, and the parity harness asserts both shapes separately.

**Disposition of `/gates`: retained deliberately; not deprecated here.** It is the only computed-gates
surface outside the quiz flow and it has **no frontend consumer today** — a documented gap
(`docs/architecture.md:346`): the UI reads `/phase-gate`. Deprecating it would delete a working
contract to satisfy a consumer that does not exist yet, which is a product decision (epic 27/28), not a
lockstep fix. What this story changes is that `/gates` can no longer contradict `/phase-gate` for a guest.

**Fail-fast guard.** `buildGuestGateStatus` throws for `isGuest: false` instead of emitting a
plausible-looking Phase-1 lock. If the builder ever got wired to a signed-in identity it would silently
replace real gates with guest locks; the misuse now fails loudly
(`"Failed to build guest gate status for a non-guest identity"`).

The controller header no longer implies two independent guest branches: it states that both branches
derive from one `createGuestPhaseGate()` answer, keeps the 24-7 calibration history (never all-unlocked)
and the 24-13 F6 deviation, and drops the stale note about the Express surface "still returning the
all-passed `GUEST` object" (Express was retired at 24-15).

### 2. Tests

| File                                                                     | Case                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/__tests__/gateStatus.factory.test.ts` (**NEW**)                | Phase 1 → exact `{ passed: false, reason: "GUEST", details: "Guest — Phase 1 only" }` per gate with key order `passed/reason/details`; **drift proof** (`currentPhase: 4` → all gates `passed: true`, details contain `Phase 4` and not `Phase 1`, no lock reason); boundary 1-vs-2; all three gates deep-equal each other; non-guest → throws                                                                                                                                                                                                                                                |
| `nest/__tests__/progression-nest.controller.test.ts`                     | new: the `/gates` guest body deep-equals `buildGuestGateStatus(<the body /phase-gate just returned>)` — the endpoints cannot disagree; the existing Phase-1 parity case is unchanged                                                                                                                                                                                                                                                                                                                                                                                                          |
| `tests/integration/nest/quiz-progression-parity.test.ts` (**DB-backed**) | **(a)** one anonymous identity requests **both** `/api/v1/progression/gates` and `/api/v1/progression/phase-gate`; the gate payload is inverted back (`details` → phase, `reason` → isGuest, `passed` → `currentPhase >= 2`) and must match `/phase-gate`'s `currentPhase`/`isGuest`. **(b)** userA and userB read `/phase-gate` interleaved (A → B → A): each body carries its own `userId`, distinct row ids, A's second read deep-equals the first, B is Phase 3 (advanced by the write block) while A stays Phase 1 — "no server-side gate cache" is pinned as an invariant, not observed |

Mutation check: replacing the derived `details` with the literal `` `Guest — Phase 1 only` `` fails the
Phase-4 drift case and the boundary case (verified, then reverted). The Phase-1 case still passes, which is
exactly why the Phase-4 case is the one that matters.

### 3. Honest note: the gate cache is frontend-only

There is **no** server-side gate cache — no Redis bucket, no in-memory map. A guest's gates are a pure
function of the guest identity, and an authenticated read recomputes from Prisma on every request (the
interleaved two-identity test above pins that). The only gate cache in the system is the frontend's
localStorage (`shared/services/phaseGateService.ts`), i.e. the `## Frontend` half above: the identity-scoped
key plus eviction at the six transitions. So the backend half guarantees "one answer, never served across
identities"; the staleness ACs are satisfied by the frontend eviction, not by anything here.

### Validation

| Command                                                                                                       | Result                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `npx vitest run src/modules/progression` (`apps/backend`)                                                     | 4 files / 57 tests pass (unit)                              |
| `npm run test:full` (`apps/backend`)                                                                          | 55 files / 631 tests pass (full unit suite)                 |
| `npx vitest run --config vitest.integration.config.ts tests/integration/nest/quiz-progression-parity.test.ts` | 1 file / 33 tests pass — **DB-backed cases ran** (no skips) |
| `npm run typecheck --workspace=@mandarin/backend`                                                             | pass                                                        |
| `npx eslint src/modules/progression` (`apps/backend`)                                                         | clean (`tests/integration/**` is outside the eslint config) |
| `npx prettier --write` on the five touched files                                                              | formatted (2 rewritten, 3 already clean)                    |
