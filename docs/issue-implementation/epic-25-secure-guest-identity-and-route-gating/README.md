---
purpose: Epic 25 implementation — P0-1 guest isolation pinned, one guest gate source, A25 Learn un-gating, TTS guest cost surface
status: completed
last-verified: 2026-10-30
type: epic
---

# Epic 25: Secure Guest Identity & Route Gating — Implementation

**BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/README.md`

**PR:** #61 (single epic PR) · **Branch:** `epic-25-guest-identity`

## Epic Summary

**Goal:** Make guest mode safe and correct on the NestJS shell — pin the P0-1 cross-tenant SRS rejection with an executable audit, collapse the two progression guest answers into one derived source, remove the Learn phase walls A25 does not ratify, and prove both anonymous TTS surfaces are cache-first-free.

**Key Points:**

- **P0-1 needed evidence, not a fix.** The repository rejection (`ReviewRepository.findByUserAndTypes` → `[]`, `countDue` → `0` for `undefined` userId) and the `RequireAuthGuard` mount on all three review handlers were already in place. The gap was a written audit and a regression with **real seeded rows for two users**; both now ship, and the audit is **executable** (15 `OptionalAuthGuard` routes + 7 optional-`userId` signatures must equal the reviewed tables, each disposition citing a live asserted source line). **No production code changed.**
- **One guest gate source.** `buildGuestGateStatus(createGuestPhaseGate())` is the only producer of the `/v1/progression/gates` guest payload; `getGates` no longer hand-writes a second literal, so the two endpoints cannot disagree. The **Phase-4 drift test** — not the Phase-1 parity case — is the real guard (a Phase-1 literal and a Phase-1 derivation are byte-identical).
- **The gate cache is evicted, not identity-keyed.** `clearPhaseGateCache()` runs at **six** identity transitions plus a one-shot legacy purge, and `usePhaseGate` drops the in-state gate on identity change. Identity-in-key was blocked by the `shared → features` boundary rule (no user id is persisted), so the residual windows are stated rather than engineered away.
- **A25 is subtractive.** `LearnRoutes` lost its `PhaseGate` helper and all three wrappers; `SideNav` lost the lock affordance **and** its `phaseGate`/`requiredPhase` props; `requiredPhase` became `phase` and `LEARN_REQUIRED_PHASE` was **deleted**; `AppLayout` reads no gate for navigation. The deleted lock style was also a WCAG 1.4.3 failure (2.62:1 on `--card`).
- **Guest cost is bounded downstream.** Both `optionalAuth` TTS surfaces are proven free on a cache hit (including the bad-token case) and the **generated** path is documented as epic-29's counter-gated path. No quota machinery ships here; the exposure is recorded, not accepted silently.

**Status:** Completed — all four stories shipped and **merged** via PR #61 (`6e84c12e`, 2026-10-30).

**Last Update:** October 30, 2026

## Technical Overview

Epic 25 is a **verify-and-remove** epic. Three of its four stories changed no production behaviour that the BR assumed was broken: P0-1 was already closed at two layers (the audit was missing), the guest gate already existed at `/v1/progression/phase-gate` (a second, hand-written copy was the defect), and both TTS surfaces were already cache-first (the bad-token proof was missing). The one behavioural change is A25's: the Learn walls came down at both the route and the navigation layer, and phase was demoted to sequencing metadata.

Scope as built, by story:

| Story | Commit     | What landed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Production code changed |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 25-1  | `17fdbcdb` | `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts` (executable inventory: 15 routes + 7 signatures) and `apps/backend/tests/integration/nest/review-guest-isolation.test.ts` (two-user seeded: positive control → guest `401` / repo `[]`·`0`), plus the story impl doc                                                                                                                                                                                                                   | **No**                  |
| 25-2  | `1ace7681` | Backend: new `modules/progression/services/gateStatus.factory.ts` (`buildGuestGateStatus`, `GuestGateIdentity`, `GuestGateStatus`), `getGates` derives via `buildGuestGateStatus(createGuestPhaseGate())`, Phase-4 drift test, two DB-backed parity cases. Frontend: `clearPhaseGateCache()` + `purgeLegacyPhaseGateResidue()`, eviction at six identity transitions, `usePhaseGate` drops the stale gate, guest clamps in `GrammarPage`/`RadicalsPage`, `docs/architecture.md` guest `/gates` claim corrected | Yes (both halves)       |
| 25-3  | `8f507c66` | `LearnRoutes` `PhaseGate` helper + 3 wrappers deleted; `SideNav` lock affordance and its `phaseGate`/`requiredPhase` props deleted; `.side-nav__child--locked` CSS deleted and an app-wide `:focus-visible` ring added; `requiredPhase` → `phase`, `LEARN_REQUIRED_PHASE` deleted; `AppLayout` no longer reads the gate; `PhaseLocked` story replaced; six route tests, SideNav click-through test, `@ts-expect-error` prop tripwire, AppLayout no-guest-region pin; registry + `DESIGN.md` rows updated       | Yes (frontend)          |
| 25-4  | `0656e243` | `/v1/tts` invalid-token case now asserts no synthesis/upload; **new** readers passage-audio bad-token case (never 401, `source: "gcs"`, no generation); local artifact `verification-artifacts/epic-25-tts-guest-cost-surface.md` + condensed committed record; explicit epic-29 handoff                                                                                                                                                                                                                       | **No**                  |

**Where the code actually changed.** Backend production code changed in **one module only** — `progression` (the new `gateStatus.factory.ts` plus the controller's guest branch). `audio`, `mnemonics`, `quiz`, `readers` and `review` were **not** modified; they are covered by the new inventory (`optional-auth-coverage.test.ts`), the parity suites and `review-guest-isolation.test.ts`, which is exactly why stories 25-1 and 25-4 report "no production code changed". Frontend production code changed under `router/LearnRoutes.tsx`, `pages/learn/{grammar,radicals,chengyu,readers}`, `shared/{constants,hooks,layouts,services,components}` and `features/auth`; `features/dashboard` gained a test only.

**Gate results at epic close (2026-10-27, `epic-25-guest-identity`).**

| Gate                | Command                                                                                    | Result                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Full frontend suite | `npm run test:full --workspace=@mandarin/frontend` (`vitest run --project='!storybook'`)   | **157 files / 1156 tests pass**                                                                                             |
| Full backend suite  | `npm run test:full --workspace=@mandarin/backend` (`vitest run`)                           | **55 files / 631 tests pass**                                                                                               |
| Storybook stories   | `npm run test-storybook --workspace=@mandarin/frontend` (`vitest run --project storybook`) | **64 files / 364 tests pass**                                                                                               |
| Repo build          | `npm run build`                                                                            | **pass** (pre-existing >500 kB chunk warning only)                                                                          |
| Lint                | `npm run lint`                                                                             | **0 errors**, 41 pre-existing warnings                                                                                      |
| CSS lint            | `npm run lint:css --workspace=@mandarin/frontend` (`stylelint`)                            | **0 errors**, 6 pre-existing warnings (all `!important` in `SandhiDrill.css`)                                               |
| Registry ↔ stories  | `npm run check:registry-stories`                                                           | **38/38 pass**                                                                                                              |
| Page inventory      | `npm run check:page-inventory`                                                             | **pass** — 19 entries (17 conforms, 2 diverges)                                                                             |
| Module boundaries   | `npm run check:module-boundaries`                                                          | **pass** — `shared` imports no feature/module                                                                               |
| Design lint         | `npm run design:lint`                                                                      | **0 findings**                                                                                                              |
| Design parity       | `npm run check:design-parity`                                                              | **pass**                                                                                                                    |
| Spine parity        | `npm run check:spine-parity`                                                               | **pass** — 91 canonical / 2 override / 47 domain                                                                            |
| System map          | `npm run check:system-map`                                                                 | **pass** after `npm run generate:system-map`                                                                                |
| Design audit        | `npm run design-audit`                                                                     | **249 errors / 434 warnings in 683 findings repo-wide** — **zero findings in any file this epic touched**; triaged (KF-006) |
| Doc links           | `npm run check:doc-links`                                                                  | **135 unresolved relative links across 52 files** — none in an Epic 25 doc; triaged (KF-005)                                |
| Formatting          | `npm run format:check`                                                                     | **741 files unformatted repo-wide**, none of them an Epic 25 doc after this pass; triaged (KF-004)                          |
| Backend audit skill | `.github/skills/backend-audit/SKILL.md` (9-point checklist over the backend diff)          | **0 HIGH / 0 MEDIUM / 1 LOW** — see below                                                                                   |

**Backend-audit result (coordinator, 2026-10-27).** Scope: the only backend production change in the epic —
`modules/progression/services/gateStatus.factory.ts` + the `getGates` guest branch. Checklist outcome:
error-message format OK (the factory's only throw is an internal invariant, `"Failed to build guest gate status for
a non-guest identity"`, and is unreachable because `createGuestPhaseGate()` always sets `isGuest: true`);
architecture boundary OK (controller → pure builder, no repository access from the controller, no new DI);
input validation n/a (no body); Prisma safety n/a (no schema change); test coverage OK (unit derivation + Phase-4
drift proof + controller agreement + two DB-backed integration cases); API contract OK (Phase-1 `/gates` payload
byte-identical, pinned by the unchanged parity assertion); security OK (both progression routes stay `optionalAuth`
**by intent**, and the guest branch is now exercised on both endpoints instead of asserted twice in isolation —
audit checklist item 8 "guest path exercised" was the epic's actual defect); doc truth OK after the truth-check pass.
**1 LOW:** the builder's header comment said `getGates` hand-wrote "six hardcoded `\"Guest — Phase 1 only\"` strings";
it is three `reason: "GUEST"` + three `details: "Guest — Phase 1 only"`. Corrected in the same commit. No
`*.factory.ts` precedent existed in `modules/` — accepted, because `audio` already carries lowerCamelCase non-class
modules in `services/` (`paths.ts`, `errors.ts`).

Pre-existing failures triaged rather than fixed (process rule, no code change made in this epic): all three are
recorded in `docs/guides/testing/known-failures.md` (KF-004 formatting, KF-005 doc links, KF-006 design audit) with
the counts re-measured on 2026-10-27. Re-triaging them from scratch is prohibited — match the entry and bump its
**Last verified** date instead.

## Architecture Decisions

1. **The repository is the last line of defence, and the audit is executable.**
   Rationale: a controller guard can be forgotten by the next route, while a repository that returns empty for `undefined` userId cannot leak regardless of the caller. As built, that principle is enforced twice — the two structural rejections in `ReviewRepository` plus `RequireAuthGuard` on every review handler — and the _set_ of guest-reachable reads is pinned by `optional-auth-coverage.test.ts`, which re-derives it from source on every run and fails on any difference in either direction.
   Alternatives considered: a prose audit table with no scanner (rots the first time a route is added); a Prisma middleware filter (implicit, and it hides the rejection from the call site).
   Implications: adding an `OptionalAuthGuard` route or an optional-`userId` parameter now fails the build until it gets a reviewed disposition; three disposition kinds exist (`structural-reject`, `guarded-unreachable:<file:line>`, `guest-safe-no-user-scope:<file:line>`) so no row has to be forced into a falsehood.

2. **One guest answer, projected — not one shared object.**
   Rationale: `/v1/progression/phase-gate` returns a `PhaseGate` (id, `currentPhase`, four phase flags, retention columns, timestamps) while `/v1/progression/gates` returns three `GateResult`s. No single value can be both, so the shared thing is the **derivation**: `buildGuestGateStatus(guest)` takes the guest slice (`currentPhase` + `isGuest`) and projects every field from it — `passed = currentPhase >= 2`, `reason: "GUEST"` while locked, `details = "Guest — Phase ${currentPhase} only"`.
   Alternatives considered: collapsing `/gates` onto `/phase-gate` (would either change the persisted-gate payload or drop the computed gates — `/gates` re-evaluates gates passed outside the quiz flow); keeping the hand-written literal with a comment asking people to keep them in sync (that comment is what 25-2 replaced).
   Implications: `/gates` is retained deliberately even though it has no frontend consumer today (a product decision for epic 27/28, recorded in `docs/architecture.md`); the builder throws for `isGuest: false` so it can never silently replace a signed-in learner's real gates.

3. **Evict the gate cache on identity transition; do not key it by identity.**
   Rationale: the cache is `localStorage` (`phaseGate:user` / `phaseGate:guest`). Putting the user id in the key would require `shared/` to know the authenticated identity, and `shared → features` is a boundary violation (no user id is persisted anywhere in the client either). Eviction at every transition gives the same protection without the inversion: `clearPhaseGateCache()` at login, register, logout, the api-client silent-401 path, the boot refresh-failure path and the refresh-cookie restore, plus a one-shot purge of pre-existing `phaseGate:user` residue.
   Alternatives considered: identity-in-key (blocked — boundary rule); a separate guest namespace (still class-scoped, so it does not fix the user→user leg); server-side invalidation (there is no server-side gate cache to invalidate — the guest payload is a pure function of the identity, and an authenticated read recomputes from Prisma on every request, pinned by the interleaved two-identity test).
   Implications: a future identity transition that forgets the helper would re-open the window _while the fetch fails_; the helper makes that a one-line contract and the six existing sites are pinned by tests. Residual windows are listed in the story implementation doc and summarised below.

4. **Phase is a signal, not a wall — enforced by deleting the affordance, not by documenting it.**
   Rationale: BM-1 §3 ratifies "Learn — all content … browse/demo (no lock)" and L6 makes the roadmap "signals, not walls". A wall that survives as a _renameable prop_ is the re-entry point, so `SideNav`'s `phaseGate`/`requiredPhase` props were **deleted** (not renamed), `AppLayout` stopped reading the gate, and the derived `LEARN_REQUIRED_PHASE` export was deleted with its last consumers — its very name (`REQUIRED`) was the invitation to re-add the wall.
   Alternatives considered: keeping the props but ignoring them (a rename-and-keep, rejected — the next contributor wires them back); gating only the deepest route (still a wall).
   Implications: what survives is `LEARN_NAV_ITEMS[].phase`, a plain number used for one tooltip (`"Grammar · Phase 2 of 4"`); the shell holds no user-phase state at all, which is a stronger position than "derive it from the server gate".

5. **TTS guest safety = prove the free path now, ship the counter in epic-29.**
   Rationale: a cache hit is a read (one GCS `stat` + one URL signature), not a generation. A TTS-only counter would be throwaway machinery once the unified L5 quota spine lands, so this epic records which surface generates on a miss and what that path costs, and hands the counter, the `AICallLog` row, the circuit breaker and the quota-exhausted contract to epic-29.
   Alternatives considered: `requireAuth` on TTS (breaks the guest demo); a TTS-only counter now (duplicate machinery).
   Implications: a guest cache **miss** stays billable until epic-29 ships; the exposure (one synthesis per distinct cache path, no limiter on `/api/v1/tts` at all) is written down in the story implementation doc rather than left implicit.

## Technical Challenges & Solutions

### Challenge 1: Two guest gate sources that could drift — and why the Phase-4 test is the guard

- **Problem:** `getPhaseGate` returned `createGuestPhaseGate()` while `getGates` hand-wrote a second guest payload — three gate objects, each carrying its own `passed`/`reason`/`details` literal (`progression-nest.controller.ts:173-180` before 25-2). The same anonymous identity could be told Phase 1 by one endpoint and something else by the other, and no test could see it: both endpoints were correct for Phase 1.
- **Root Cause:** the guest branch was written twice, once per payload _shape_, at a time when only one shape existed. Nothing derived the second from the first, and the parity test compared a literal to a literal — which passes for as long as both literals say Phase 1.
- **Solution:** `buildGuestGateStatus(guest)` derives every field from `guest.currentPhase`, and `getGates` calls `buildGuestGateStatus(createGuestPhaseGate())`. The guard is the **drift** test, not the parity test: `gateStatus.factory.test.ts` builds the guest status at `currentPhase: 4` and asserts all three gates are `passed: true`, that `details` contains `Phase 4` and not `Phase 1`, and that a passed gate carries no lock reason. A controller unit case asserts the `/gates` guest body deep-equals `buildGuestGateStatus(<the body /phase-gate just returned>)`, and a DB-backed case in `quiz-progression-parity.test.ts` requests **both** endpoints for one anonymous identity and inverts the gate payload back to a phase.
- **Impact/Benefits:** the two endpoints cannot disagree without a failing test whose mutation was verified (replacing the derived `details` with the Phase-1 literal fails the Phase-4 and boundary cases while the Phase-1 case still passes — which is exactly why it is not the guard). The Phase-1 wire bytes are unchanged, so no consumer moved.
- **Alternatives Considered:** one shared object (impossible — the shapes differ); deleting `/gates` (a product decision, not a lockstep fix); a comment asking contributors to keep two literals in sync (that was the pre-existing state).

### Challenge 2: A gate cache keyed by identity _class_ leaked across identities

- **Problem:** the only phase-gate cache is `localStorage`, keyed `phaseGate:user` / `phaseGate:guest`, and `phaseGate:user` was **never** cleared — logout removed only the access token (`AuthContext.tsx`). On a shared device, user A's cached gate was served to user B whenever B's gate fetch failed.
- **Root Cause:** the cache key encoded the identity _class_ instead of the identity, and the eviction contract was nobody's job: `phaseGateService` owned the keys but not their lifecycle, so no auth transition knew it had to invalidate.
- **Solution:** the service now owns the namespace — `clearPhaseGateCache()` prefix-scans and deletes every `phaseGate:*` key (collecting keys before deleting so `removeItem` cannot re-index the loop) and `purgeLegacyPhaseGateResidue()` performs a one-shot deletion of pre-existing residue, guarded by a marker that lives **outside** the `phaseGate:` namespace so the clear cannot re-arm it. `AuthContext` calls `clearPhaseGateCache()` at **six** identity transitions — login, register, logout, the api-client silent-401 callback, the boot refresh-failure cleanup and the refresh-cookie restore — plus the one-shot `purgeLegacyPhaseGateResidue()` at boot, and `usePhaseGate` drops the in-state gate when the access token changes so the previous identity's number is not on screen while the new fetch is in flight.
- **Impact/Benefits:** the leak regression is a test, not a comment: A's gate cached → logout → B logs in → gate fetch fails → B sees `null`, never A's `currentPhase`; the refresh-cookie restore leg evicts a previous identity's bucket as well. Mutation-checked by removing sites 3 and 6 (the test then reads `4` and `phaseGate:user` survives logout).
- **Alternatives Considered:** identity-in-key — **blocked**, not rejected on merit: `shared/` may not import `features/auth`, and no user id is persisted client-side, so the key cannot carry it. A separate guest namespace fixes nothing (the leak is user → user).
- **Residual windows (stated, not engineered away):** (1) a future identity transition that forgets `clearPhaseGateCache()` serves the previous identity's gate _while the fetch fails_; (2) A's `phaseGate:user` survives at rest until the next transition or the boot purge — it is a gate _number_, not a credential. The authenticated `Infinity` fail-open that used to exist between a transition and the first successful fetch went away with the whole gate read in the later A25 un-gating (`AppLayout` now reads no phase), so there is no fail-open left — a guest is Phase 1 by construction.

### Challenge 3: The lock style hid a WCAG 1.4.3 failure

- **Problem:** removing the Learn locks was a product decision (A25); the audit of the CSS being deleted found that the lock state was itself unreadable, so the wall was also an accessibility defect.
- **Root Cause:** `.side-nav__child--locked` dimmed child labels with `opacity: 0.6` over `--ink-quiet` (`rgba(148, 135, 112, 1)`). The token alone composites to **4.94:1** on `--card` (`rgba(30, 25, 21, 1)`) — a pass. At `opacity: 0.6` it composites to **rgb(101, 91, 76)** = **2.62:1**, far below the 4.5:1 required for `font-xs` text. The same rows were also removed from the tab order (`tabIndex={-1}`), so low-vision _and_ keyboard users were blocked together.
- **Solution:** the rule was deleted rather than re-tinted (removing the wall fixes the arithmetic — nothing was recoloured to compensate); the active-pill selector lost its `:not(.side-nav__child--locked)` qualifier so `aria-current` restores the pill for every matching child including a deep-linked phase-ahead one; and an app-wide `:focus-visible` ring (`outline: 2px solid var(--focus-ring)`) was added, because five rows became newly focusable the moment the walls came down and `SideNav.css` had no focus pattern at all.
- **Impact/Benefits:** the contrast defect and the keyboard trap disappear with the feature that carried them; `SideNav.css` now produces **no** `design:lint` findings and no `design-audit` findings.
- **Alternatives Considered:** raising the opacity or picking a brighter token (would have kept an unreadable state on screen for a wall the model does not ratify); leaving the lock style and deleting only the JS (dead CSS that the next contributor would wire up).

### Challenge 4: Why the Learn wall kept coming back — and the four tripwires that now stop a third return

- **Problem:** the wall was built into `LearnRoutes.tsx` incrementally, one route per feature story, and extended in plan before it was ever removed. Any contributor adding a Learn page copied the previous wrapper, because nothing in the code said the absence of a wall was deliberate.
- **Root Cause:** (a) **the pattern was copied three times** — `git log -S PhaseGate -- apps/frontend/src/router/LearnRoutes.tsx` shows the wrapper arriving with readers (`23747f18`), grammar (`49d29f36`) and chengyu (`56867bb2`), each time by mirroring the route above it; `SideNav` then blocked **five of six** links, including radicals and phonetic-clusters, which had no route wall at all and were therefore unreachable from the navigation. (b) **the extension was documented as if it had shipped** — `docs/planning/epics-25-40.md` §Epic 25 listed "data-driven `LEARN_REQUIRED_PHASE` for all 6 Learn routes", a local calibration decision (D5) recorded route gates for radicals + phonetic as "Decided", and a local verification artifact described `LockedSurface` / `LEARN_ROUTE_CONFIG` / `LearnRouteGate` plus two route tests (`LearnRoutes.radicals`, `LearnRoutes.phonetic`) that **never existed** in `apps/frontend/src`. A future contributor reading those three records would have re-added the wall as "restoring documented behaviour".
- **Solution:** remove the affordance _and_ install four independent tripwires, so no single deletion can restore the wall:

  | #   | Tripwire                                                                      | Evidence (as built)                                                                                                                                                                                                                                                                                                                                                                                                |
  | --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | 1   | **Normative source docs** (the file a contributor reads before adding a gate) | `shared/constants/learnNav.ts` ("`phase` IS NOT A LOCK … NOTHING in the shell may compute a lock, redirect, `aria-disabled`, or `tabIndex={-1}` from `phase`"), `router/LearnRoutes.tsx` ("no route may turn it into a prerequisite again"), `SideNav.tsx` ("NO USER-PHASE STATE … don't"), `SideNav.css` ("Do not reintroduce a lock style here"), `AppLayout.tsx` ("Guest state is Browse-only … Don't add one") |
  | 2   | **Compile-time prop-deletion tripwire**                                       | `SideNav.test.tsx` passes a `phaseGate` object literal under `@ts-expect-error`; `npx tsc -b tsconfig.test.json --force` exits 0 today and fails the moment a phase prop returns under any name                                                                                                                                                                                                                    |
  | 3   | **Runtime tests**                                                             | six route tests (one per Learn route, guest at phase 1, redirect target asserted absent), the SideNav click-through test (every child navigates), `AppLayout.test.tsx` (no guest region; every Learn item enabled) and `DashboardGuest.test.tsx` (the dashboard owns the guest prompt)                                                                                                                             |
  | 4   | **Design-layer records**                                                      | `.github/component-registry.json` `SideNav` row ("every Learn item navigates … no user-phase props"), the `DESIGN.md` component row, and the Storybook story renamed `PhaseLocked` → "Learn — phase ahead, nothing blocked (phase 1)" (a story that renders a lock is now a visible regression)                                                                                                                    |

  The 15-row tripwire inventory (file → wording) is in the 25-3 implementation doc.

> **Cross-link:** the general form of this pattern — four tripwire kinds plus verify-by-mutation — is in
> [`docs/guides/testing/executable-audits.md`](../../guides/testing/executable-audits.md).

- **Impact/Benefits:** the three records that read as precedent are now superseded in the durable tree: this document and the story implementation doc carry the supersession text and the tripwire inventory, the planning doc's §Epic 25 body is annotated as reversed by A25 in place, and `verification-artifacts/README.md` (tracked) marks the stale route-gating artifact **SUPERSEDED** in its artifact index. The two local files themselves (the verification artifact and the untracked calibration note) also carry a SUPERSEDED banner in this worktree, but neither is committed — the index, the tripwires and the tests are the record that survives on `main`.
- **Alternatives Considered:** a lint rule banning `PhaseGate`-like identifiers (brittle, and a rename defeats it); documenting "no gate" only in the story docs (story docs are not where a contributor looks before adding a route); deleting `LEARN_NAV_ITEMS[].phase` outright (would lose sequencing and readiness messaging, which BM-1 L6 retains).

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `ttsAudio: "/v1/tts"` (`:9`), `progressionPhaseGate` (`:19`), `progressionGates` (`:20`), `reviewItems` (`:26`), `reviewDueCount` (`:28`), `readersPassages` (`:44`), `readersPassageAudioById: (id) => "/v1/readers/passages/${id}/audio"` (`:47`). No endpoint appears in this document that is not in `ROUTE_PATTERNS`.
- [x] Feature/module/component names verified against `apps/backend/src/modules/` (15 modules: `audio`, `auth`, `characters`, `chengyu`, `foundations`, `grammar`, `health`, `mnemonics`, `phonetic-clusters`, `progression`, `quiz`, `radicals`, `readers`, `review`, `words`) and `apps/frontend/src/features/` (13 features: `auth`, `character-hub`, `chengyu`, `dashboard`, `foundations`, `grammar`, `lexical-hub`, `phonetic-clusters`, `quiz`, `radicals`, `readers`, `review`, `word-hub`). Counts were re-derived by listing both directories on 2026-10-27, not copied from an older doc; `progression` is the only backend module whose production code changed.
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — the progression and review guests answer from the shared constant / repository (`createGuestPhaseGate()`, `prisma.srsCardState` behind `ReviewRepository`), readers passages come from Postgres via `ReadersRepository`, and the audio surfaces read GCS object existence (`AudioSynthesizer.ts:51` `gcs.fileExists`) plus a soft Redis path cache — no database read on the audio path except the passage lookup.
- [x] All relative markdown links resolve — `npm run check:doc-links` reports 135 unresolved links across 52 files repo-wide (KF-005), **none of them in an Epic 25 document**; re-run after this document was created.
- [x] Last Updated / Last Update date is current (same commit as the edit) — frontmatter `last-verified: 2026-10-30`, body `**Last Update:** October 30, 2026`.

## Technical Implementation

### Architecture

```
Guest (no token / bad token)
  │
  ├── OptionalAuthGuard ──► req.userId === undefined (never 401)
  │        │
  │        ├── GET  /v1/progression/phase-gate ──► createGuestPhaseGate()
  │        │                                          { currentPhase: 1, isGuest: true }
  │        ├── GET  /v1/progression/gates ──────► buildGuestGateStatus(createGuestPhaseGate())
  │        │                                          { passed: false, reason: "GUEST", details: "Guest — Phase 1 only" } ×3
  │        ├── POST /v1/tts ────────────────────► AudioSynthesizer.synthesizeOnce ── gcs.fileExists ──HIT──► sign (free)
  │        ├── POST /v1/readers/passages/:id/audio ► ReadersAudioService (per sentence) ── same primitive (free on hit)
  │        └── GET  /v1/review/items, /v1/review/due-count ──► RequireAuthGuard → 401 AUTH_REQUIRED
  │                                                              (repository would return [] / 0 regardless)
  │
Frontend shell
  ├── shared/services/phaseGateService.ts  namespace owner: fetchPhaseGate / clearPhaseGateCache / purgeLegacyPhaseGateResidue
  │        └── localStorage: phaseGate:user | phaseGate:guest
  ├── shared/hooks/usePhaseGate.ts         refetch on access-token change; drops the in-state gate meanwhile
  ├── features/auth/context/AuthContext    evicts at six identity transitions (+ one-shot boot purge)
  ├── shared/layouts/AppLayout.tsx         chrome + <Outlet /> only — reads NO phase for navigation
  ├── shared/components/SideNav            no user-phase props; `phase` only as tooltip metadata
  ├── router/LearnRoutes.tsx               no PhaseGate helper, no wrappers — six routes, all open
  └── features/dashboard (DashboardGuest)  the one guest affordance (Browse surface)
```

Layering note: `phaseGateService` lives in `shared/` and is consumed by `features/auth` (eviction) and `shared/hooks` (read). The dependency never runs the other way — `shared/` must not import `features/auth`, which is why identity lives in the token, not in the cache key.

### API Endpoints (if applicable)

`GET /v1/progression/phase-gate` (`ROUTE_PATTERNS.progressionPhaseGate`, guard `OptionalAuthGuard`)

**Parameters:**

- none (identity comes from the optional bearer token)

**Response** (guest): `createGuestPhaseGate()` — `id: "guest-unlocked"`, `currentPhase: 1`, the four phase flags false, `isGuest: true`, `qualificationScore`/`placedPhase`/retention/`gateCriteria` `null`, `createdAt`/`updatedAt` stamped `now`. Authenticated callers get the persisted `PhaseGate` row (created with defaults when absent).

`GET /v1/progression/gates` (`ROUTE_PATTERNS.progressionGates`, guard `OptionalAuthGuard`)

**Parameters:**

- none

**Response** (guest): `{ phase2Gate, characterCountGate, phase3To4Gate }`, each `{ passed: false, reason: "GUEST", details: "Guest — Phase 1 only" }` — byte-identical to the retired hand-written literal, now derived by `buildGuestGateStatus(createGuestPhaseGate())`. Authenticated callers get the recomputed per-user status.

`POST /v1/tts` (`ROUTE_PATTERNS.ttsAudio`, guard `OptionalAuthGuard`, `@HttpCode(200)`)

**Parameters:**

- `text`: string — required; must be non-empty, at most `audioConfig.maxWords` words, and must contain Hanzi (400 before any I/O)
- `voice`: optional voice name (defaults to `audioConfig.voiceDefault`, e.g. `"cmn-CN-Wavenet-B"`)

**Response:** `{ audioUrl, cached: boolean }` — `cached: true` means the GCS object existed and only a signed URL (3600 s) was issued; `cached: false` means a synthesis + upload happened. A guest never receives 401 on this route.

`POST /v1/readers/passages/:id/audio` (`ROUTE_PATTERNS.readersPassageAudioById(id)`, guard `OptionalAuthGuard`, `@HttpCode(200)`)

**Parameters:**

- `id`: passage id (404 when the passage does not exist)

**Response:** per-sentence `audioUrls[i] = { url, source: "gcs" | "ondemand" | "failed" }` — `"gcs"` is a cache hit (signing only, free), `"ondemand"` was synthesized (billable), `"failed"` is isolated per sentence and never a 5xx. A guest never receives 401.

### Component Relationships

| Layer              | Unit                                                                                                                                                                        | Responsibility in this epic                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guard tier         | `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts`                                                                                                     | Re-derives every `OptionalAuthGuard` handler + optional-`userId` signature from source and asserts equality with the reviewed tables                                             |
| Backend module     | `progression` (`services/gateStatus.factory.ts`, `nest/progression-nest.controller.ts`)                                                                                     | Single guest gate derivation; `/gates` projects what `/phase-gate` already answered                                                                                              |
| Backend module     | `review` (`repositories/ReviewRepository.ts`, `nest/review-nest.controller.ts`)                                                                                             | Structural rejection of `undefined` userId + `RequireAuthGuard` on all three handlers                                                                                            |
| Backend module     | `audio`, `readers`                                                                                                                                                          | Cache-first audio on both anonymous surfaces; no quota machinery (epic-29)                                                                                                       |
| Shared (frontend)  | `shared/services/phaseGateService.ts`, `shared/hooks/usePhaseGate.ts`                                                                                                       | Owns the cache namespace + eviction contract; one fetch path, one key, refetch on identity change                                                                                |
| Feature (frontend) | `features/auth` (`AuthContext`)                                                                                                                                             | Six eviction sites + one-shot legacy purge                                                                                                                                       |
| Shared (frontend)  | `shared/layouts/AppLayout.tsx`, `shared/components/SideNav`, `shared/constants/learnNav.ts`                                                                                 | No user-phase state; phase is tooltip metadata only                                                                                                                              |
| Router (frontend)  | `router/LearnRoutes.tsx`                                                                                                                                                    | Six open Learn routes, index redirect, legacy aliases — no gate helper                                                                                                           |
| Feature (frontend) | `features/dashboard` (`DashboardGuest`)                                                                                                                                     | The single guest affordance, on a Browse surface                                                                                                                                 |
| Guides             | [`docs/guides/testing/known-failures.md`](../../guides/testing/known-failures.md) · [`docs/guides/testing/executable-audits.md`](../../guides/testing/executable-audits.md) | KF-004 / KF-005 / KF-006 (the three pre-existing repo-wide failures this epic triaged); the executable-inventory + removal-tripwire pattern extracted from stories 25-1 and 25-3 |

Story documents: [25-1](story-25-1-optional-auth-srs-guest-isolation.md) · [25-2](story-25-2-guest-identity-lockstep.md) · [25-3](story-25-3-learn-ungating-browse-guest-state.md) · [25-4](story-25-4-tts-guest-cost-verification.md)
Story BRs: [25-1](../../business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-1-optional-auth-srs-guest-isolation.md) · [25-2](../../business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-2-guest-identity-lockstep.md) · [25-3](../../business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-3-learn-ungating-browse-guest-state.md) · [25-4](../../business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-4-tts-guest-cost-verification.md)

---

## Code Review Outcome (2026-10-27)

**Verdict: APPROVED** — no HIGH findings. 15 findings were raised (5 MEDIUM, 10 LOW); nine were fixed before the
epic PR and the rest are carried forward below with an owner. The reviewer's falsification attempts are the reason
this section exists: it could not route a guest to SRS state, could not make the two-user seeded test pass
vacuously, and confirmed the Phase-4 drift test would fail a re-hardcode.

### Fixed before merge

| Finding | Sev    | What was wrong                                                                                                                                                                                                                                                                                                                                                       | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1      | MEDIUM | `fetchPhaseGate()` chose its cache key **after** the `await`, so a fetch started under identity A could land in the **new** identity's bucket after an eviction (guest→login wrote a guest gate under `phaseGate:user`; logout→guest wrote a user's phase 4 under `phaseGate:guest`). The §7.2 class, in the opposite order from the transitions the story hardened. | Key captured before the request; the write is skipped when the identity changed mid-flight. Two MSW tests hold the response open across a transition (guest→login, and the mirror) plus an unchanged-identity control; both poison cases fail without the guard (verified by reverting it).                                                                                                                                                       |
| F2      | MEDIUM | The "executable inventory" scanned only `repositories/` + `services/` and only `nest/*.controller.ts`, and its decorator parser missed same-line/wrapped `@UseGuards`. Four live optional-`userId` signatures in `modules/quiz/strategies/` were unclassified (two spelled `_userId?`, which the old regex could not see), and the failure text over-promised.       | Signature scan now covers every non-test `.ts` under `src/modules/**`, across method/function/arrow forms (17 rows); controller discovery is by filename across `src/modules/**` + `src/nest/**`; the decorator parser binds by proximity and has self-tests (same-line, stacked, wrapped, commented-out). Non-parameters are excluded structurally, never by name allow-list. Controller broadening found 17 files / 63 handlers — no new route. |
| F5      | MEDIUM | `.github/component-registry.json` and `DESIGN.md` still sold `TopNav` as "Phase-gated lock support" while its props are orphaned and unsanctioned post-A25 — the design layer taught the opposite of the ratified rule.                                                                                                                                              | Both descriptions rewritten; component code, `states` and `storyFile` untouched (`check:registry-stories` 38/38).                                                                                                                                                                                                                                                                                                                                 |
| F6      | LOW    | `readers-nest.controller.ts` claimed a guest lists "shared" passages; the repository has no identity predicate, so a guest lists **every** user's generated passages.                                                                                                                                                                                                | Comment corrected to the shipped behaviour + the known gap. Query untouched (needs an owner — see carry-forward).                                                                                                                                                                                                                                                                                                                                 |
| F8      | LOW    | The allowlisted `shared → features/auth` import was justified as "phase-gated sign-in state"; post-A25 it supplies account chrome only.                                                                                                                                                                                                                              | NOTE reworded; the allowlist entry stays valid.                                                                                                                                                                                                                                                                                                                                                                                                   |
| F9      | LOW    | `DESIGN.md` had no changelog entry or date bump for its A25 catalog edit.                                                                                                                                                                                                                                                                                            | Date bumped, one changelog line added.                                                                                                                                                                                                                                                                                                                                                                                                            |
| F11     | LOW    | `modules/progression/index.ts` re-exported the builder + its two interfaces with no cross-module consumer (barrel pollution).                                                                                                                                                                                                                                        | Re-exports dropped per `backend.md` §2/§5 (the barrel is the public contract, so it only carries intended symbols); interfaces stay beside the factory.                                                                                                                                                                                                                                                                                           |
| F13     | LOW    | The 25-2 "one source" controller test compared the controller's output against the very function it calls — tautological.                                                                                                                                                                                                                                            | Replaced with a hand-written Phase-4 expectation (`passed: true`, `details: "Guest — Phase 4 only"`, no `reason`, key order pinned) that stubs `createGuestPhaseGate`, so it pins the wiring _and_ the projection.                                                                                                                                                                                                                                |
| F14     | LOW    | A SideNav case named "identical rail at phase 1 and 4" compared markup to itself — no phase input exists any more.                                                                                                                                                                                                                                                   | Renamed to what it proves (no lock surface in either register); the compile-time `@ts-expect-error` prop-deletion tripwire is kept and is enforced by `npm run build` (`tsc -b` includes `tsconfig.test.json`).                                                                                                                                                                                                                                   |

### Carry-forward (recorded, deliberately not fixed here)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                 | Where                                                                                                                          | Owner                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| F3  | **The DB-backed regressions never run in CI** — `ci.yml` sets a placeholder `DATABASE_URL`, so `checkDatabase()` fails and the suites skip. A security regression test that is green-by-absence is not a gate.                                                                                                                                                                                       | `.github/workflows/ci.yml`, `review-guest-isolation.test.ts`, `quiz-progression-parity.test.ts`                                | Whoever owns CI (recorded as KF-007)                                                         |
| F4  | **Guest-hidden Learn content outside the route layer**: `HubMnemonicSection` and `HubRadicalSection` `return null` below phase 2, so a production guest opening a character hub sees no mnemonic and no radical breakdown; guests also still see `🔒 Phase N` badges on grammar cards (clickable, so not a wall); three `import.meta.env.DEV ? N : 1` fallbacks grant a _dev_ guest a phase above 1. | `features/character-hub/**`, `features/grammar/components/GrammarCard.tsx`, `features/radicals/components/RadicalTreesTab.tsx` | **epic-26** copy pass — or a BM-1 change-gate decision if any of these walls is intended     |
| F7  | `usePhaseGate` reads the token during render as its only effect dep, so components that don't also consume `useAuth` (hub sections, `RadicalTreesTab`, `useQuizCard`) won't refetch on an in-place identity change. The transitions this epic hardened all navigate, so it is latent, not live.                                                                                                      | `shared/hooks/usePhaseGate.ts`                                                                                                 | epic-26/27 (an `identity-changed` event from `AuthContext` keeps `shared → features` intact) |
| F10 | `audio-nest.controller.ts` takes `@Req() req` only for `void req.userId;` — dead today, but the read is the documented hook epic-29's counter will consume.                                                                                                                                                                                                                                          | `modules/audio/nest/audio-nest.controller.ts`                                                                                  | epic-29                                                                                      |
| F12 | 4 of the 6 "every Learn route renders the page" tests render stubs, so they prove route resolution rather than page rendering; the two inverted wall tests mount the real pages with data. The file discloses this.                                                                                                                                                                                  | `router/__tests__/LearnRoutes.guestAtPhase1.test.tsx`                                                                          | epic-26 (when those pages gain data fixtures)                                                |
| F15 | Cross-**tab** identity transitions are unhandled — no `storage` listener, so a second tab keeps the previous identity's gate until reload. Not previously in the stated residual windows.                                                                                                                                                                                                            | `shared/services/phaseGateService.ts`                                                                                          | epic-26/27                                                                                   |
| —   | `GET /v1/readers/passages` serves other users' generated passages to guests (no identity predicate); `/v1/progression/gates` still has no frontend consumer; `ContentBrowser`'s second phase map is inert; `TopNav` is orphaned; TTS quota/counter/`AICallLog` are unbuilt.                                                                                                                          | various                                                                                                                        | epic-27 (data/gate calibration) · epic-26 (copy) · epic-29 (cost gateway)                    |

## Epic Close — Documentation Duty

**Added retroactively (2026-10-31).** This epic closed on 2026-10-30 (PR #61, `6e84c12e`) before the
Epic & Story Lifecycle existed, so it never carried this section. The Phase 5 surface table in
`.github/copilot-instructions.md` enumerates the surfaces, and each row below was **re-verified on
2026-10-31 against the code**, not copied from the epic's own notes.

| Surface                                | Outcome (re-verified 2026-10-31)                                                                                                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture.md`                 | **Verified current.** The guest gating path, "phase is sequencing metadata, never a route gate", the single-source phase-gate rule (`createGuestPhaseGate()` → `buildGuestGateStatus()`), and the `SideNav` / `LearnRoutes` lines all match the shipped code.                                                   |
| `README.md`, `apps/*/README.md`        | **Verified current.** Root README is product-level and unaffected; `apps/frontend/README.md` states the Learn group treats phase as sequencing metadata with no locked or disabled entries.                                                                                                                     |
| `docs/knowledge-base/`, `docs/guides/` | **Patterns landed as guides, no KB article.** The reusable material became `docs/guides/testing/executable-audits.md`, the `design-revalidation-guide.md` additions, and the ADR-014 lexical-hub sheet — process rules rather than conceptual deep-dives, which is the correct home per the KB-extraction rule. |
| `docs/coverage.md`, `docs/README.md`   | **Regenerated** as part of closing; `check:system-map` PASS on 2026-10-31.                                                                                                                                                                                                                                      |
| Epic + story docs                      | **Complete.** Epic BR + epic IMP, and 4 story BR + 4 story IMP files; PR #61 named in both epic records.                                                                                                                                                                                                        |

### Carry-forward accountability correction

Two items this epic delegated to **epic-26** were **not picked up** by epic-26 and are still open. Verified
2026-10-31 rather than assumed:

| Ref | Item                                                                                                                                    | Status after epic-26 closed                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F12 | Four of the six "every Learn route renders the page" tests render `vi.mock` stubs, so they prove route resolution rather than rendering | **Still open.** `router/__tests__/LearnRoutes.guestAtPhase1.test.tsx` still stubs its four page modules (L27–L39). Re-assigned to epic-28, which builds the surfaces that would supply data fixtures. |
| F15 | Cross-**tab** identity transitions unhandled — no `storage` listener, so a second tab keeps the previous identity's gate until reload   | **Still open.** No `addEventListener("storage")` exists anywhere in `apps/frontend/src/shared/`. Re-assigned to epic-27.                                                                              |

This is the failure mode the lifecycle now guards against: a carry-forward row naming a future epic is a
hope, not a handoff. A closing epic must state its carry-forwards in the _receiving_ epic's record, not only
its own.
