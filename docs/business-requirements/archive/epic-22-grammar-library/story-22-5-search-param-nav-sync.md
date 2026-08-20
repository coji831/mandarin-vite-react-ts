# Story 22.5: Search-Param Nav Sync

**Last Updated:** August 16, 2026 (Story 22.5 — frontend-only; nav/URL sync, per Architect proposal)

## Description

**As a** learner,
**I want to** navigate between Learn sections without losing my current sub-state (tabs/filters) and share deep-linkable URLs,
**So that** sidebar navigation stays in sync with the URL and Back exits the page instead of rewinding intermediate tab/filter changes.

## Business Value

This story fixes a real navigation bug in the application shell: sidebar Learn links were path-only, so navigating from a sub-state (e.g. `?tab=tones`) dropped it, and cross-route sub-state leaked. It introduces a single persistence rule (documented in the `searchParams.ts` header) and the URL machinery to enforce it — `buildSearchParams` (pure, omit-on-null) + `useSearchParamsBatch` (atomic multi-param writes) — then wires the `SideNav` Learn group to it. The result is shareable, deep-linkable URLs (params exist so users can bookmark/share/refresh without losing state) and Back semantics that match the browser (`replace` for sub-state, `push` for session starts). Frontend-only — no backend or data changes.

## Acceptance Criteria

- [x] `shared/constants/searchParams.ts` — `SearchParamInput` type + `buildSearchParams(current, updates, opts)` pure builder (omit/delete-on-null logic extracted from `withSearchParams`); header documents the canonical persistence rule (route-scoped params, `replace: true` sub-state writes, `push` session starts, same-page sidebar click = no-op).
- [x] `shared/hooks/useSearchParamState.ts` — `useSearchParamsBatch()` → `{ replaceParams, pushParams }` — one atomic functional `setSearchParams` write for multi-param events (same-tick sibling writes previously clobbered); `writeSearchParams` shared single-write path.
- [x] `shared/constants/learnNav.ts` — `LearnNavItem` gains optional `defaultParams?: SearchParamInput` (bare-canonical landing rule — no values today).
- [x] `shared/components/SideNav/SideNav.tsx` — `location` prop (back-compat with `currentPath`); Learn child `to = withSearchParams(child.path, child.defaultParams)`; same-path guard (`guardSamePath` — same-page click `preventDefault` → preserves sub-state); Learn group header split (label = default-landing `Link` → `/learn/foundations`; chevron stays the accordion toggle).
- [x] `shared/layouts/AppLayout.tsx` — passes full `location={{ pathname, search }}` to `SideNav`.
- [x] Barrels re-export the new exports (`shared/constants/index.ts`, `shared/hooks/index.ts`).
- [x] Tests updated/added (`searchParams.test.ts` for `buildSearchParams`; `useSearchParamState.test.tsx` for batch atomicity, replace-vs-push, and same-tick sibling preservation; `SideNav.test.tsx` for defaultParams `to`, same-item `preventDefault` preserving `?tab`, cross-item bare canonical, active-unchanged-by-search).
- [x] All 6 quality gates pass (exit 0): `npm run build`, `npm run lint`, `npm run design-audit`, `npm run check:registry-stories`, `npm test`, `npm run test-storybook` — results recorded as gitignored verification artifacts.
- [x] Browser check 5/5: same-path Foundations click preserves `?tab=tones` (no nav, no history entry); cross-item nav lands bare canonical; Learn header label navigates to `/learn/foundations` + chevron still toggles; Back after tab change exits the page; rapid tab clicks → single history entry — evidence recorded as gitignored verification artifacts.

## Business Rules

1. **Route-scoped params** — no cross-route persistence; leaving a route drops its params (sidebar links land on the canonical bare path).
2. **Sub-state writes use `replace: true`** (`tab`/`view`/`mode`/`page`/`q`/`hsk`/`phase`) so Back exits the page instead of rewinding tabs; session starts (quiz/review/dashboard CTAs) use `push`.
3. **Same-page sidebar clicks are a no-op** that preserves the current sub-state; different-page clicks land on the canonical bare path (per-item `defaultParams` when defined).
4. **One navigation per logical event** — multi-param writes go through `useSearchParamsBatch` (never N same-tick `setSearchParams` writes); query strings are never hand-built.
5. **No custom history** — React Router `replace: true` already coalesces consecutive param changes into one entry; no `unstable_HistoryRouter`/session-stack.
6. **Barrels re-export only** — `shared/constants/index.ts` and `shared/hooks/index.ts` only re-export.

## Related Issues

- Epic 22: Grammar Pattern Library — BR (`../README.md`) (epic parent)
- **Story 22.4: Sidebar Navigation and Account** ([BR](story-22-4-sidebar-navigation-and-account.md)) (related — introduced the search-params convention; 22.5 completes the nav/URL sync)

## Implementation Status

- **Status**: Complete
- **PR**: TBD (pending)
- **Merge Date**: TBD
- **Key Commit**: `131b4420` (`fix(epic-22): story 22.5 nav-url sync + review nits`)
