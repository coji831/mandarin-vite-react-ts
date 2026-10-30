---
purpose: A25 — Learn route/nav walls removed; phase demoted to sequencing metadata; guest state stays Browse-only
status: completed
last-verified: 2026-10-27
type: implementation
---

**Last Updated:** October 27, 2026

# Implementation 25-3: A25 Learn Un-Gating + Browse-Only Guest State

> **BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-3-learn-ungating-browse-guest-state.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 27, 2026
> **Key Commit:** `8f507c66` (feat(story-25-3): un-gate the Learn routes and move guest state out of the shell)

## Implementation Summary

Story 25-3 is a **subtractive** change: it removes every Learn phase wall the pre-BM-1 build still
carried and pins their absence with tests. BM-1 §3 ratifies "Learn — all content (foundations → chengyu,
all 4 stages) | ✅ browse/demo (**no lock**)" and L6 ratifies the roadmap as "a priority scoring layer,
**not a lock**" — signals, not walls. A25 therefore wins over any older prose: this story removes
walls and never adds one.

Measured starting state (branch `epic-25-guest-identity`, 25-2 at `1ace7681`):

- **Three route walls** — the local `PhaseGate` helper in `router/LearnRoutes.tsx` wrapped grammar
  (phase 2), readers (phase 3) and chengyu (phase 4); foundations / radicals / phonetic-clusters had
  no route wall at all.
- **Five of six sidebar links blocked** — `SideNav` short-circuited the click (`preventDefault`),
  set `aria-disabled`, `tabIndex={-1}` and a lock icon for any child whose phase exceeded the user's.
  Radicals and phonetic-clusters were therefore _unreachable from the navigation_ despite having no
  route wall.
- **A second, contradictory source of truth** about what a guest may see (`LEARN_REQUIRED_PHASE`) —
  a surviving export literally named `REQUIRED`, i.e. the re-entry point for the wall.

Everything removed here was navigation permission. What survives is `phase`, a plain number used for
one tooltip.

## Frontend

**Files:**

- `apps/frontend/src/router/LearnRoutes.tsx` — update: `PhaseGate` helper + all three wrappers deleted;
  `usePhaseGate` / `ReactNode` imports dropped; index redirect and legacy aliases
  (`flashcards`, `quiz`, `review`, `basic`) untouched
- `apps/frontend/src/shared/components/SideNav/SideNav.tsx` — update: `phaseGate` / `requiredPhase`
  props **deleted** (not renamed), `isLocked` compute, `preventDefault` branch, `tabIndex`,
  `aria-disabled`, lock `<Icon>` and the `&& !isLocked` pill guard removed; child `title` is now
  metadata (`"Grammar · Phase 2 of 4"`); `guardSamePath`, the accordion and the collapsed rail kept
- `apps/frontend/src/shared/components/SideNav/SideNav.css` — update: `.side-nav__child--locked` rule
  deleted, `:not(.side-nav__child--locked)` qualifier removed, app-wide `:focus-visible` pattern added
- `apps/frontend/src/shared/constants/learnNav.ts` — update: `requiredPhase` → `phase`,
  `LEARN_REQUIRED_PHASE` **deleted**, module + field docs rewritten as metadata-only (BM-1 §3 / L6 / A25)
- `apps/frontend/src/shared/constants/index.ts` — update: barrel no longer exports `LEARN_REQUIRED_PHASE`
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — update: `usePhaseGate`, `effectivePhase` and the two
  SideNav props removed; `resolvePageMode` / `chromeForMode` / `collapsed` / `isAuthPage` untouched
- `apps/frontend/src/shared/components/SideNav/SideNav.stories.tsx` — update: `PhaseLocked` replaced by
  the A25 "nothing blocked" story; header comment updated
- `apps/frontend/src/shared/layouts/AppLayout.stories.tsx` — update: `PhaseLocked` story deleted
- `apps/frontend/src/router/__tests__/LearnRoutes.grammar.test.tsx` — update: wall test **inverted**
- `apps/frontend/src/router/__tests__/LearnRoutes.chengyu.test.tsx` — update: wall test **inverted**
- `apps/frontend/src/router/__tests__/LearnRoutes.guestAtPhase1.test.tsx` — **NEW**: the four routes that
  never had a wall test (foundations, radicals, phonetic-clusters, readers), guest at phase 1
- `apps/frontend/src/shared/components/SideNav/__tests__/SideNav.test.tsx` — update: "phase gating" block
  replaced by "no phase gating (A25 …)"; locked-child assertions inverted
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.test.tsx` — update: lock assertions inverted +
  A25 pins (no guest region; no Learn item disabled)
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.guest.integration.test.tsx` — update: inverted to
  "guest page + unimpeded Learn group", with and without a reachable gate endpoint
- `apps/frontend/src/features/dashboard/components/__tests__/DashboardGuest.test.tsx` — update: pinned as
  the guest-state owner (extended, not duplicated)
- `apps/frontend/src/pages/learn/chengyu/ChengyuPage.tsx` — update: header no longer claims a route gate
- `apps/frontend/src/pages/learn/readers/ReadersPage.tsx` — update: header states the route is open (A25)
- `apps/frontend/src/shared/components/ContentBrowser/ContentBrowser.tsx` — update: **comment only** on the
  inert second phase map
- `apps/frontend/src/shared/components/TopNav/TopNav.tsx` — update: **comment only** on the orphan lock props
- `.github/component-registry.json` — update: `SideNav` description + prop list (no phase props)
- `DESIGN.md` — update: component table `SideNav` row no longer says "phase-gated"

### 1. Route walls deleted (`router/LearnRoutes.tsx`)

The helper is gone, so there is no place left in the router where a phase comparison can happen:

```tsx
<Route path="foundations" element={<FoundationsPage />} />
<Route path="radicals" element={<RadicalsPage />} />
<Route path="grammar" element={<GrammarPage />} />
<Route path="phonetic-clusters" element={<PhoneticClustersPage />} />
<Route path="readers" element={<ReadersPage mode="library" />} />
<Route path="chengyu" element={<ChengyuPage />} />
```

Kept: the index redirect to `/learn/foundations` and the four legacy aliases. `usePhaseGate` is no
longer imported here (the hook itself is story 25-2 territory and is untouched).

### 2. SideNav holds no user-phase state

Both props are **deleted** rather than renamed, so a caller cannot pass a phase and the component has
no input from which to compute a lock. The child row is now:

```tsx
<NavLink
  onClick={(e) => guardSamePath(e, childTo, child.defaultParams)}
  title={`${child.label} · Phase ${child.phase} of 4`}
  className={({ isActive }) => `side-nav__child … ${isActive ? ACTIVE_LINK_CLASS : ""}`}
>
```

- `guardSamePath` (Story 22.5 sub-state preservation) is preserved verbatim — it is unrelated to
  locking and was the most likely casualty of a bulk delete.
- The accordion (`aria-expanded` / `aria-controls`) and the collapsed rail are unchanged.
- The **collapsed** group row's tooltip stays `"Learn — <active child>"`: Focus chrome is phase-free,
  so no phase text leaks into the icon rail.

### 3. `SideNav.css`: affordance deleted, a11y debt paid

Deleted:

```css
/* Locked children — dimmed, non-interactive affordance (parity with TabBar op-40) */
.side-nav__child--locked {
  color: var(--ink-quiet);
  cursor: not-allowed;
  opacity: 0.6;
}
```

**The wall was also a WCAG 1.4.3 failure.** The child text token `--ink-quiet` is
`rgba(148, 135, 112, 1)` and the rail surface is `--card` = `rgba(30, 25, 21, 1)`:

| state                                  | composited colour  | contrast on `--card` | 1.4.3 (4.5:1, text < 18.66px bold) |
| -------------------------------------- | ------------------ | -------------------- | ---------------------------------- |
| `--ink-quiet` alone (token's own spec) | rgb(148, 135, 112) | **4.94:1**           | pass                               |
| `--ink-quiet` at `opacity: 0.6`        | rgb(101, 91, 76)   | **2.62:1**           | **fail**                           |

`font-xs` child labels are far below the large-text threshold, so the walled rows were unreadable for
low-vision users _and_ unreachable for keyboard users (`tabIndex={-1}`). Removing the wall fixes the
arithmetic; nothing was re-tinted to compensate.

Also changed:

- The active pill selector loses its `:not(.side-nav__child--locked)` qualifier, so `aria-current`
  restores the pill for **every** matching child — including a deep-linked phase-ahead one.
- Added the app-wide keyboard-focus pattern that `SideNav.css` never had (five rows became newly
  focusable the moment the walls came down). Three declarations, tokens only, no `box-shadow`:

```css
.side-nav__link:focus-visible,
.side-nav__group-header:focus-visible,
.side-nav__child:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

### 4. `learnNav.ts`: metadata only

`LEARN_NAV_ITEMS[].phase` survives for sequencing and labels; `LEARN_REQUIRED_PHASE` is deleted with
its last consumers. The module doc now states, in the file a contributor actually reads before adding a
gate:

> NOTHING in the shell may compute a lock, redirect, `aria-disabled`, or `tabIndex={-1}` from `phase`.
> … The derived `LEARN_REQUIRED_PHASE` map was deleted with its last consumers precisely because a
> surviving export named `REQUIRED` is the re-entry point for the wall this epic removed.

### 5. `AppLayout` stops reading the gate for navigation

`usePhaseGate` and `effectivePhase` are gone; the shell passes no phase to `SideNav`. The dual-mode
chrome is untouched: `resolvePageMode` / `chromeForMode` / `collapsed` / `isAuthPage` are byte-identical
in behaviour (Focus = collapsed rail + recessed top bar, Browse = expanded rail + standard top bar,
auth = no rail).

### 6. Guest state stays Browse-only

No code was added for guest state — the measured position was already correct (epic README finding 5):
`DashboardGuest` is rendered by `pages/dashboard/DashboardPage.tsx` for a guest, has its own story in
`DashboardPageFull.stories.tsx`, and `AppLayout` has no guest region. Story 25-3's job was to **pin**
that with tests (see A25 evidence below), not to move it.

## Tripwire inventory (file → wording)

Every tripwire states the rule _and_ the reason, so the next contributor does not "fix" the absence of a
wall (this is the highest-value part of the story: the wall was removed once and must not return).

| File                                                   | Wording (short form)                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/constants/learnNav.ts` (module doc)            | "`phase` IS NOT A LOCK (BM-1 §3, BM-1 L6)" / "NOTHING in the shell may compute a lock, redirect, `aria-disabled`, or `tabIndex={-1}` from `phase`" / "signals, not walls" |
| `shared/constants/learnNav.ts` (field doc)             | "Recommended study order (1–4) — METADATA ONLY, never a lock (A25; BM-1 §3, L6) … Every item navigates for every visitor."                                                |
| `router/LearnRoutes.tsx` (header)                      | "EVERY Learn route renders for EVERY visitor … no route may turn it into a prerequisite again."                                                                           |
| `shared/components/SideNav/SideNav.tsx` (header)       | "NO USER-PHASE STATE (BM-1 §3, L6) … If a wall ever comes back, it comes back here first — don't."                                                                        |
| `shared/components/SideNav/SideNav.tsx` (child row)    | "Phase is metadata, not permission (A25): the tooltip names the recommended study order only."                                                                            |
| `shared/components/SideNav/SideNav.css` (file header)  | "there is no locked/dimmed nav state … Do not reintroduce a lock style here."                                                                                             |
| `shared/components/SideNav/SideNav.stories.tsx` (doc)  | "If this story ever renders a lock, a phase wall came back. BM-1 §3 / L6."                                                                                                |
| `shared/layouts/AppLayout.tsx` (header)                | "the shell renders chrome + `<Outlet />` only and reads NO phase for navigation … Guest state is Browse-only … Don't add one."                                            |
| `shared/layouts/AppLayout.stories.tsx` (header)        | "the shell reads no phase for navigation, so there is no phase-locked shell story"                                                                                        |
| `pages/learn/chengyu/ChengyuPage.tsx` (header)         | "Access: OPEN for every visitor … Do not reintroduce a route wall."                                                                                                       |
| `pages/learn/readers/ReadersPage.tsx` (header)         | "Access: OPEN for every visitor … Phase is sequencing metadata only — never a prerequisite."                                                                              |
| `shared/components/ContentBrowser/ContentBrowser.tsx`  | "Phase-lookalike tab map — INERT … NOT sanctioned: phase-driven nav locks are not a pattern post-A25" (comment only, no behaviour change)                                 |
| `shared/components/TopNav/TopNav.tsx` (header + props) | "ORPHANED lock props … must not be wired up or copied into a live surface" (comment only, no behaviour change)                                                            |
| `.github/component-registry.json` (`SideNav`)          | "A25: phase is sequencing metadata only — every Learn item navigates for every visitor (no lock state, no user-phase props)."                                             |
| `DESIGN.md` (component table)                          | "Learn group (phase is sequencing metadata only — every item navigates, A25)"                                                                                             |

### Supersession record (durable copy)

`verification-artifacts/epic-25-route-gating-verification.md` and `wip/guest-access-calibration.md` §D5
are **local, untracked** files (verified with `Test-Path`), so the banner appended to them would not
survive. The durable version is this section — the exact text appended to both:

> SUPERSEDED by A25 (Epic 25 / story 25-3), 2026-10-27. This describes a phase wall the owner removed:
> BM-1 §3 ratifies "Learn — all content … no lock" and L6 makes the roadmap "signals, not walls". The
> described code no longer exists and must not be restored. Learn phase is sequencing metadata only. Do
> not cite this document as precedent for a gate.

Why it matters: the artifact describes shipped `LockedSurface` / `LEARN_ROUTE_CONFIG` / `LearnRouteGate`
and two route tests (`LearnRoutes.radicals.test.tsx`, `LearnRoutes.phonetic.test.tsx`) that **do not
exist in `apps/frontend/src`**, while `wip/guest-access-calibration.md` D5 records "radicals + phonetic
get route gates — **Decided**". Both read as precedent; neither is.

**AC disposition (decided at epic close, 2026-10-27).** The story's stale-artifact AC asks for the two
local files to be corrected or marked superseded. Both banners were verified **in this worktree**: the
artifact carries the banner at line 99 and the calibration note's D5 row is annotated at line 694 — but
`verification-artifacts/` is gitignored and that calibration note is untracked, so **neither annotation can
reach `main`**. That is a property of the AC's target files, not of the work: on a fresh clone neither
file exists, so neither can mislead a contributor.

What the AC's _intent_ — "the next contributor must not re-add the wall" — now rests on, durably:

1. the tracked artifact index (`verification-artifacts/README.md`, "Current Artifacts") carries a
   **SUPERSEDED** row for the route-gating artifact, so the record that survives names it as dead;
2. this section, which holds the exact banner text and the reason;
3. the 15-row tripwire inventory above (source doc comments, the `@ts-expect-error` prop-deletion tripwire,
   the six route tests + SideNav click-through + AppLayout pins, and the registry / `DESIGN.md` / story
   records), plus the epic implementation README's Challenge 4;
4. `docs/planning/epics-25-40.md` §Epic 25, whose body now carries dated A25 reversal pointers on the
   goal, the route-gates bullet, AC 3 and the UI scope.

The AC is therefore **ticked**: the requested annotation exists in both named files (verified by line
number above) and the supersession is durable through four tracked channels. The residual risk is
honest — a contributor reading a _local_ copy of the untracked artifact sees the banner only because this
worktree wrote it; on another machine the file is absent rather than misleading.

## Deliberately left alone (recorded, not silently ignored)

| Surface                                                             | Why untouched                                                                                                                          | Owner / next step                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/components/ContentBrowser/ContentBrowser.tsx` phase tab map | Inert: the only caller (`LibraryPage`) passes `userPhase={4}`. Annotated as unsanctioned; behaviour unchanged (comment-only tripwire). | Epic 26 copy pass — remove the map or re-frame it as readiness metadata                                                                                                                                                                                   |
| `shared/components/TopNav/TopNav.tsx` `phaseGate` / `requiredPhase` | Orphan: no consumer; `TopNav` itself is orphaned since Story 22.4. Annotated; behaviour unchanged.                                     | Epic 26 copy pass — delete the component or strip the lock props                                                                                                                                                                                          |
| `features/radicals/components/RadicalTreesTab.tsx:39-40`            | `isPhase3 = effectivePhase >= 3` with a **DEV-only** `defaultPhase = 3` fallback: a feature-level phase gate that predates A25.        | **Epic-26 copy debt** — out of A25's stated boundary; recorded, not re-derived                                                                                                                                                                            |
| `docs/architecture.md:128` ("sidebar's phase-gated Learn group")    | The story forbade touching `docs/architecture.md`; the stale phrase was accepted debt.                                                 | **Done at epic close (2026-10-27)** — the phase-gated phrasing in `docs/architecture.md` (LearnRoutes, SideNav/Learn group, layouts, hooks, the Phase-4-gated chengyu row, and the `/gates` guest `reason`/`details` sentence) was corrected to A25 state |
| `usePhaseGate`, `phaseGateService`, `features/auth`                 | Story 25-2 delivered them (committed at `1ace7681`); 25-3 only removes the now-unused imports from `LearnRoutes` / `AppLayout`.        | —                                                                                                                                                                                                                                                         |

## A25 evidence (what the tests now prove)

Six Learn routes, guest at phase 1, page renders — no gate screen, no redirect:

| Route                      | Test file                                     | Assertion                                                           |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `/learn/foundations`       | `LearnRoutes.guestAtPhase1.test.tsx`          | `FoundationsPage` renders                                           |
| `/learn/radicals`          | `LearnRoutes.guestAtPhase1.test.tsx`          | `RadicalsPage` renders                                              |
| `/learn/grammar`           | `LearnRoutes.grammar.test.tsx` (**inverted**) | `GrammarPage` renders at phase 1 (was: redirect)                    |
| `/learn/phonetic-clusters` | `LearnRoutes.guestAtPhase1.test.tsx`          | `PhoneticClustersPage` renders                                      |
| `/learn/readers`           | `LearnRoutes.guestAtPhase1.test.tsx`          | `ReadersPage` renders                                               |
| `/learn/chengyu`           | `LearnRoutes.chengyu.test.tsx` (**inverted**) | `ChengyuPage` renders below the former Phase-4 wall (was: redirect) |

Every route test serves the calibrated guest gate (`createGuestPhaseGate()` or an equivalent phase-1
body) through MSW **on purpose**: if a route wall returns it reads that gate and redirects, and these
tests fail. The old redirect target (`FoundationsPage`) is asserted absent in each case.

Guest state is Browse-only: `DashboardGuest.test.tsx` pins the dashboard as the owner of the guest
prompt (welcome copy + registration CTA + all-phase preview), and `AppLayout.test.tsx` pins the
absence — `<main>` holds exactly the routed page, the shell's only element children are the rail and the
main column, and the single guest-marked node in the tree is the TopBar account control
(`user-menu--guest`), i.e. no guest banner/badge/region was added to the layout.

## Testing Implementation

### Inverted (never deleted)

| Test file                              | Before                                                     | After                                                                    |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `LearnRoutes.grammar.test.tsx`         | "redirects to /learn/foundations when below Phase 2"       | "renders the GrammarPage for a guest at Phase 1 (no gate, no redirect)"  |
| `LearnRoutes.chengyu.test.tsx`         | "redirects to /learn/foundations when below Phase 4"       | "renders the ChengyuPage below the former Phase-4 wall"                  |
| `SideNav.test.tsx`                     | `describe("phase gating")` — locked marks / non-navigable  | `describe("no phase gating (A25 — Learn = no lock; BM-1 §3, L6)")`       |
| `SideNav.test.tsx` (child hierarchy)   | "dims locked children … does not mark them current"        | "never dims or disables a Learn child (the locked class is retired)"     |
| `SideNav.test.tsx` (child hierarchy)   | "keeps a deep-linked locked child dimmed (no active pill)" | "keeps a deep-linked phase-ahead child fully styled and current"         |
| `AppLayout.guest.integration.test.tsx` | "Phase-1 guest shape … Phase-2+ items locked"              | "renders the guest page and an unimpeded Learn group at /learn/grammar"  |
| `AppLayout.guest.integration.test.tsx` | "keeps a guest Phase-1 when the gate fetch fails"          | "renders the same unimpeded shell when the phase-gate fetch fails"       |
| `AppLayout.test.tsx`                   | "Learn group unlocked while the gate is loading"           | "renders chrome + `<Outlet />` only — no guest region/banner/badge"      |
| `AppLayout.test.tsx`                   | "calibrated Phase-1 identity — Phase-2+ items locked"      | "leaves every Learn item enabled for a guest — no lock, no title prompt" |

### Added

- `LearnRoutes.guestAtPhase1.test.tsx` — 4 tests (foundations / radicals / phonetic-clusters / readers).
- `SideNav.test.tsx` A25 block — 5 tests: deleted phase props (compile-time `@ts-expect-error` tripwire,
  validated by `tsc -b`), every child navigates, phase appears only as `title` metadata, a deep-linked
  phase-ahead child keeps `aria-current` + pill classes, identical rail markup across mounts, collapsed
  tooltip phase-free.
- `AppLayout.test.tsx` — 2 A25 pins (no guest region; every Learn item enabled for a guest, deep-linked
  phase-ahead child keeps `aria-current="page"`).
- `DashboardGuest.test.tsx` — 1 ownership test (extended the existing suite, not duplicated).

Test counts (targeted run): `SideNav` 26, `AppLayout` 11, `AppLayout.guest.integration` 2,
`DashboardGuest` 6, `LearnRoutes.grammar` 2, `LearnRoutes.chengyu` 2, `LearnRoutes.guestAtPhase1` 4 —
**7 files / 53 tests green**.

## Validation results

Baseline captured **before** any edit on this branch:

| Command                                                  | Baseline                                     | After 25-3                                                                                                                        |
| -------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npx vitest run --project='!storybook'` (whole frontend) | (not run at baseline; targeted suites green) | **157 files / 1156 tests passed**                                                                                                 |
| targeted 7 files (see above)                             | —                                            | **7 files / 53 tests passed**                                                                                                     |
| `npm run build --workspace=@mandarin/frontend`           | —                                            | **pass** (`tsc -b` incl. `tsconfig.test.json` + vite build; only the pre-existing >500 kB chunk warning)                          |
| `npx tsc -b tsconfig.test.json --force`                  | —                                            | **exit 0** — proves the `@ts-expect-error` phase-prop tripwire is live                                                            |
| `npm run lint --workspace=@mandarin/frontend`            | —                                            | **0 errors**, 41 warnings (pre-existing; only touched-file warning is `ContentBrowser.tsx:105` `handleTabChange`, present before) |
| `npm run lint:css --workspace=@mandarin/frontend`        | —                                            | **0 errors**, 6 warnings (all pre-existing `!important` in `SandhiDrill.css`)                                                     |
| `npm run check:registry-stories`                         | 38/38 PASS                                   | **38/38 PASS** (`SideNav` states unchanged: `default`, `edge`)                                                                    |
| `npm run check:page-inventory`                           | PASS — 19 entries (17 conforms, 2 diverges)  | **PASS — identical**                                                                                                              |
| `npm run check:module-boundaries`                        | PASS — shared never imports features/modules | **PASS**                                                                                                                          |
| `npm run design-audit`                                   | **249 errors, 434 warnings, 683 findings**   | **249 errors, 434 warnings, 683 findings — identical, net-zero**                                                                  |

`design-audit` findings that reference files touched here are **all pre-existing warnings**, none
introduced by 25-3: `SideNav.tsx` "class `side-nav__group` not defined" (baseline `:164`, now `:172`),
`ContentBrowser.tsx` undefined `content-browser__*` classes, `TopNav.tsx` undefined `top-nav` class,
`ReadersPage.tsx` decorative emoji warning. `SideNav.css` produces **no** findings (the dead
`--locked` class is gone and the new focus rule uses tokens only).

### Doc Truth-Check

- [x] No endpoints touched (`ROUTE_PATTERNS` untouched; this story is frontend-only).
- [x] Component/route names verified against `apps/frontend/src` (not the stale verification artifact).
- [x] Data source unchanged: phase metadata is a static constant, not an API read, after this change.
- [x] Relative markdown links resolve.
- [x] `Last Updated` / `Last Update` = October 27, 2026 (same edit).

## Technical Challenges & Solutions

```
Problem: deleting the props risked collateral damage to Story 22.5's same-path guard.
Solution: `guardSamePath` was kept verbatim and the A25 block asserts navigation actually moves the
          location for all six children, so an accidental swallow (the old preventDefault branch)
          fails loudly.
```

```
Problem: "the rail renders identically at phase 1 and 4" is not directly testable once the phase
         input is gone.
Solution: prove the stronger property — two mounts of the same URL produce byte-identical nav markup —
         and pair it with a compile-time tripwire (`@ts-expect-error` on a `phaseGate` object literal)
         that fails `tsc -b` the moment a phase prop returns under any name.
```

## Contradictions / drift found against the BR (measured, `path:line`)

1. **BR counts three wall tests, two exist.**
   `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-3-learn-ungating-browse-guest-state.md:41`
   ("The **three** existing wall tests (`LearnRoutes.grammar`, `LearnRoutes.chengyu`) are **inverted**")
   — the parenthetical names two files, and only those two exist. Inverted 2; added 4 in a new file, so
   all six routes are now covered.
2. **The stale verification artifact describes tests that never existed.**
   `verification-artifacts/epic-25-route-gating-verification.md:26-28` lists `LearnRoutes.radicals.test.tsx`
   and `LearnRoutes.phonetic.test.tsx` as "NEW"/"updated" — neither file is present in
   `apps/frontend/src/router/__tests__/`. Superseded banner appended; durable copy in this doc.
3. **`ReadersPage.tsx` had no phase-gate claim to remove.**
   The instruction points at `apps/frontend/src/pages/learn/readers/ReadersPage.tsx`'s header; measured,
   the only gating claim lived in `apps/frontend/src/pages/learn/chengyu/ChengyuPage.tsx:19-25` ("mirrors
   `ReadersPage`, which is also route-gated"). Chengyu's claim was removed; Readers' header now states the
   route is open (a positive A25 statement rather than a deletion).
4. **Contrast figure.** The story quotes ≈2.4:1 for the deleted `opacity: 0.6`; the measured composite is
   **2.62:1** on `--card` (both fail 1.4.3). Arithmetic above.
5. **Line numbers drifted from the story text** (`SideNav.tsx:250/260-261/268-270/286`,
   `AppLayout.tsx:30/74/112-113`): at 25-2's HEAD the same constructs sit at `:249-286` and `:25/74/112-113`.
   Semantics matched exactly; no behaviour was guessed from stale numbers.
