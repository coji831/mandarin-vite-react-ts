# Implementation 22-5: Search-Param Nav Sync

> **BR Reference:** `docs/business-requirements/archive/epic-22-grammar-library/story-22-5-search-param-nav-sync.md` (Story 22.5 — nav/URL sync, per Architect proposal)
> **Last Updated:** August 16, 2026
> **Status:** ✅ Complete (gates + browser verified)
> **PR:** TBD (pending)

## Technical Scope

Frontend-only fix for the missing sync between the tab system and side-menu navigation (incl. search params). Introduces a single persistence rule and the URL machinery to enforce it, then wires the sidebar Learn group to it. No backend/data changes.

**The persistence rule (canonical, documented in `searchParams.ts` header):**

- Params are **route-scoped** — no cross-route persistence. Leaving a route drops its params (sidebar links land on the canonical bare path).
- **Sub-state writes** (`tab`/`view`/`mode`/`page`/`q`/`hsk`/`phase`) use `replace: true` so Back _exits the page_ instead of rewinding tabs.
- **Session starts** (quiz/review/dashboard CTAs) use `push`.
- **Same-page sidebar clicks** are a no-op that preserves the current sub-state.

**Files:**

- `apps/frontend/src/shared/constants/searchParams.ts` — update: `SearchParamInput` type + `buildSearchParams(current, updates, opts)` pure builder (omit logic extracted from `withSearchParams`); header documents the persistence rule
- `apps/frontend/src/shared/constants/__tests__/searchParams.test.ts` — update: `buildSearchParams` unit tests
- `apps/frontend/src/shared/hooks/useSearchParamState.ts` — update: add `useSearchParamsBatch()` → `{ replaceParams, pushParams }` — one atomic functional `setSearchParams` write for multi-param events (same-tick sibling writes previously clobbered); `writeSearchParams` shared single write path
- `apps/frontend/src/shared/hooks/__tests__/useSearchParamState.test.tsx` — update: batch atomicity + replace vs push + same-tick sibling preservation tests
- `apps/frontend/src/shared/constants/learnNav.ts` — update: `LearnNavItem` gains optional `defaultParams?: SearchParamInput` (bare-canonical landing rule — no values today)
- `apps/frontend/src/shared/components/SideNav/SideNav.tsx` — update: `location` prop (back-compat with `currentPath`), Learn child `to = withSearchParams(child.path, child.defaultParams)`, same-path guard (`guardSamePath` — same-page click `preventDefault` → preserves sub-state), Learn group header split (label = default-landing `Link` → `/learn/foundations`; chevron stays the accordion toggle)
- `apps/frontend/src/shared/components/SideNav/__tests__/SideNav.test.tsx` — update: `to` incl. defaultParams, same-item preventDefault preserves `?tab`, cross-item bare canonical, active unchanged by search
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — update: passes full `location={{ pathname, search }}` to `SideNav`
- `apps/frontend/src/shared/constants/index.ts` / `apps/frontend/src/shared/hooks/index.ts` — update: barrels re-export new exports

## Key Decisions

- **Custom history rejected** (Architect): React Router `replace: true` already coalesces consecutive param changes into one entry — "Back exits page" is the correct, built-in semantic. No `unstable_HistoryRouter`/session-stack needed.
- **Bare canonical landing** for all Learn items (locked, user-confirmed): `defaultParams` field is future-proofing only; every item lands bare today.
- **Scope boundary**: 22.5 = nav-URL sync only. ContentBrowser/TabBar bypass, Grammar `?q`/`?hsk`/`?phase` seeding, Readers `?mode`, TopNav removal, rail sub-state title are deferred (per lock).
- **`useSearchParamsBatch` is a convention-layer primitive** (Review N1): it ships as the shared, tested API for atomic multi-param writes but has no production call site yet by scope. The **Radicals `?radical` effect is its first consumer target** — the live G3 example of a multi-param single-event write — in the deferred migration story.
- **Back semantics**: `replace: true` for ALL sub-state; only session starts `push`.

## Verification

- All 6 quality gates pass (exit 0): build, lint, design-audit, check:registry-stories, `npm test` (503 frontend + 82 shared-utils), test-storybook (320). Results recorded as gitignored verification artifacts.
- Browser check (5/5 pass): same-path Foundations click preserves `?tab=tones` (no nav, no history entry); cross-item nav lands bare canonical; Learn header label navigates to `/learn/foundations` + chevron still toggles; Back after tab change exits the page; rapid tab clicks → single history entry (one Back exits once). Evidence recorded as gitignored verification artifacts.
