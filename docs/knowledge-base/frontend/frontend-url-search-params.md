---
purpose: URL search-param persistence rule
status: active
last-verified: 2026-08-06
type: guide
---

# URL Search-Param Persistence Rule

**Category:** Frontend Development  
**Last Updated:** August 6, 2026

---

## The Rule

> **Route-scoped params. No cross-route persistence.** Sub-state changes
> (`tab`/`view`/`mode`/`page`/`q`/`hsk`/`phase`) write with **`replace: true`**
> → Back _exits the page_. **Session starts** (quiz/review/dashboard CTAs)
> **push**. Sidebar: same-page click = **no-op (preserve sub-state)**;
> different-page click = **canonical bare path** (per-item `defaultParams`
> when defined). Deep-link/shareable URLs stay canonical (omit-when-default).

**Story:** 22.5 `search-param-nav-sync` — encoded the rule in the shared
convention layer (see below).

## Why

React Router's `setSearchParams(next, { replace: true })` maps to
`navigate(…, { replace: true })`, which **overwrites the current history
entry** — consecutive sub-state changes collapse to one entry per logical
page, so Back exits the page instead of rewinding tabs. This is the correct
behavior for shareable, deep-linkable state: params exist so users can
bookmark/share/refresh without losing state, and Back should not rewind every
intermediate tab/filter change.

## Where the Rule Lives

| Layer                                   | Mechanism                                                                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/constants/searchParams.ts`      | `buildSearchParams(current, updates, opts?)` — pure builder (merge + omit/delete-on-null); `withSearchParams(path, params?)` for shareable URLs; `SearchParamInput` type                                                                                       |
| `shared/hooks/useSearchParamState.ts`   | `useSearchParamState` — typed single-param hook (`replace: true` default); `useSearchParamsBatch()` — atomic multi-param `replaceParams`/`pushParams` (ONE navigation per logical event)                                                                       |
| `shared/components/SideNav/SideNav.tsx` | Child `to = withSearchParams(path, defaultParams)` (bare canonical today); same-path guard = no-op on same-page clicks (preserves sub-state); Learn header label navigates to the group default (`/learn/foundations`) while the chevron toggles the accordion |

## Anti-Patterns

- ❌ N separate same-tick `setSearchParams` writes for one logical event —
  React Router's functional baseline is the _rendered_ search, so they clobber
  each other. Use `useSearchParamsBatch` instead.
- ❌ Sidebar links that push a bare URL when the user is already on that page
  (drops `?tab` and stacks a history entry). Same-page clicks must no-op.
- ❌ Cross-route param persistence — params are route-scoped and dropped on
  navigation (sidebar lands on canonical bare paths).
- ❌ Intercepting browser Back with a custom `History`/session stack — it
  fights the browser and breaks the shareable/deep-link property that
  `replace: true` already provides for the common case.
