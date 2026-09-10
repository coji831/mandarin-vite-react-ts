---
purpose: Design spec for the Dashboard demo (hub-launcher) — guest + authenticated landing
status: active
last-verified: 2026-08-18
type: design
---

# Design Spec — Dashboard Demo (North Star)

Source: BM-1 (demo-guest lane) + northstar report (Q4)
archetype: hub-launcher # REQUIRED — page-archetypes §1
provenance: source: Vercel precision-minimal — why: airy whitespace, strong type hierarchy, one restrained amber accent, 1px hairlines, shallow neutral elevation

## 1. User flow

- **Guest:** landing → reads value pitch → "Sign Up Free ▸" (primary, header) or starts immediately via "Start with Pinyin Basics ▸" (secondary, hero) → register / foundations.
- **Authed phase 1 (empty):** welcome → "Start with Pinyin Basics ▸" (primary, header) → foundations.
- **Authed phase 2+ (default):** dashboard → reads next step → "Continue Learning ▸" (primary, header) → foundations/radicals; quick tiles → review/quiz/radicals/progress.
- **Edge (phase 4):** all unlocked → CTA becomes "Explore Content ▸" → library.

## 2. Preview/reward split

Cards show previews only (phase name, %, next step, tile label). Detail/task lives in the Focus surface — never inline on the dashboard (ui-composition §7 master-detail law).

## 3. States

| State             | Trigger                      | Storybook story                 | MSW handler                                                                                                                                                              |
| ----------------- | ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading           | phase gate in-flight         | `DashboardPageFull` → `Loading` | `mswHandlers.progression.phaseGate()` (never resolves)                                                                                                                   |
| Empty (Phase 1)   | authed, phase 1              | `Empty`                         | `phaseGate(1)`                                                                                                                                                           |
| Default (Phase 2) | authed, phase 2              | `Default`                       | `phaseGate(2)`                                                                                                                                                           |
| Phase 3           | authed, phase 3              | `Phase3Active`                  | `phaseGate(3)`                                                                                                                                                           |
| Edge (Phase 4)    | authed, phase 4              | `Edge`                          | `phaseGate(4)`                                                                                                                                                           |
| Error             | phase-gate fetch fails (500) | `Error`                         | `phaseGateError()` — `usePhaseGate` resolves `phaseGate=null` → page **gracefully degrades to the phase-1 welcome** (no crash); inline error+retry is a Phase-B decision |
| Guest             | unauthenticated              | `Guest`                         | `withGuestAuth` + `phaseGate(1)`                                                                                                                                         |

## 4. Component reuse map

Reference archetype `hub-launcher` (page-archetypes §1); **none invented beyond `PageHeader`** (registry-disciplined):

| Region             | Component                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Page shell         | `PageShell` archetype `hub-launcher`, `as="div"` (AppLayout owns `<main>`)  |
| Section rhythm     | `PageStack` (size `default`)                                                |
| Card home          | `PageGrid` (`columns={4}` tiles, `columns={2}` guest previews)              |
| Section head       | plain `section[aria-labelledby]` + `.dashboard-section-head` (feature CSS)  |
| Header             | `PageHeader` (title/eyebrow/description + ≤1 primary Button top-right)      |
| Focal card         | `Box` variant `card` + `.dashboard-card` (hairline + `--shadow-elevated-1`) |
| Empty-state focal  | `Box` variant `dashed` + `.dashboard-empty-card`                            |
| Quick-access tiles | `Button` variant `tag` + `.dashboard-tile` (icon well, title, sub-label)    |
| Progress           | `ProgressBar`                                                               |
| Loading            | `Skeleton` (dims = final dims)                                              |
| Activity           | `Box` variant `card` (rows) / variant `dashed` (empty)                      |

## 5. Token map

| Element         | Tokens                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header title    | `font-3xl fw-700 tracking-tight text-primary` (PageHeader)                                                                                                                       |
| Eyebrow         | `font-xs fw-500 text-muted tracking-wide` (PageHeader)                                                                                                                           |
| Header CTA      | `--gradient-primary` bg, `--radius-md`, hover-lift `--shadow-md` (amber)                                                                                                         |
| Card family     | `Box card` = `--surface-dark-alt` + `--radius-lg`; `.dashboard-card` narrows to `--surface-border-subtle` hairline + `--shadow-elevated-1`                                       |
| Quick tile      | `Button tag` + `.dashboard-tile` (same surface family); icon well = `--space-2xl` box, `--color-primary-bg`, `--color-primary-lighter`; hover = amber border + shared hover-lift |
| Section head    | `h2 font-lg fw-600 text-primary` + meta `font-sm text-muted`, baseline row (`margin-bottom: --space-sm`)                                                                         |
| Section rhythm  | `PageStack default` = `--section-rhythm` (32px)                                                                                                                                  |
| Card grid       | `PageGrid` = `--card-gutter` (20px), auto-fit collapse                                                                                                                           |
| Progress meta   | `font-sm text-muted`; bar = `ProgressBar` (untouched — success gradient is system doctrine)                                                                                      |
| Activity rows   | `font-sm text-secondary`; empty = dashed card + `EmptyState`                                                                                                                     |
| Guest hero card | `Box card` + `.dashboard-card`                                                                                                                                                   |
| Skeleton        | `Skeleton` — dims equal final card/header dims                                                                                                                                   |

New tokens landed in this phase: `--surface-border-subtle`, `--shadow-elevated-1/2/3`, `--tracking-tight` (+ utilities). Amber `--shadow-md/lg` are now hover/XP-only (see DESIGN.md Elevation Usage Ladder & Amber Restriction).

## 6. A11y checklist (desktop-only)

- One `<h1>` (PageHeader); sections use `<h2>`; no skipped levels.
- `focus-visible` ring (`outline: 2px solid var(--color-primary)` + 2px offset) on every interactive element (WCAG 2.4.11).
- Contrast: `--text-primary/secondary/muted` on `--surface-dark` (existing tokens pass AA).
- Touch targets ≥ `--size-touch` (28px) on nav rows, quick tiles, CTA (SC 2.5.8).
- No color-only states: ProgressBar paired with % text; phase status has text.
- Focus order = visual order (header CTA → focal → sections).
- **320px reflow EXCLUDED** — mobile out of scope (Phase A decision 4).

## 7. Page anatomy & data-resilient shell

Anatomy (page-anatomy law — there is no page-scoped layout CSS any more):

| Layer     | Where                                                           | Owns                                                         |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Shell     | `PageShell archetype="hub-launcher" as="div"` (`DashboardPage`) | hub measure (960px), page gutters, region + `aria-busy`      |
| Rhythm    | `PageStack size="default"` (each variant)                       | 32px between-section rhythm                                  |
| Card home | `PageGrid` (`columns={4}` tiles, `columns={2}` guest previews)  | card columns + gutter; children wrapped in `role="listitem"` |
| Sections  | `section[aria-labelledby]` + `.dashboard-section-head`          | h2 + optional meta on a baseline row                         |

- `features/dashboard/dashboard.css` holds feature surfaces only (card family,
  tile, icon well, skeleton dims). The former `pages/dashboard/DashboardPage.css`
  is deleted — it was the page-anatomy deviation list's first entry.
- Scroll + gutters live in `.app-content` / `PageShell`.
- Skeleton dims = final dims (header bar, focal card, 4 tiles at 150px, activity
  card) — no CLS; the loading shell is `PageShell[aria-busy="true"]` with
  `role="region"`.

## 8. AI-codegen inputs

`DESIGN.md` + `globals.css` + `component-registry.json` + `page-inventory.json` + `ui-composition` + one exemplar story (`DashboardPageFull` — precision-minimal hub-launcher exemplar). Storybook MCP is the component source of truth — nothing is invented beyond `PageHeader`.

## 9. Acceptance

- `design-audit` 0 errors; `design lint` green.
- `check:page-inventory` → `DashboardPage` conforms (states + registry-clean composition).
- `check:registry-stories` green (incl. new `PageHeader`).
- `test-storybook` green; `npm test` (changed scope) green.
- addon-a11y spot-check on `DashboardPageFull` stories: 0 critical/serious.
- **User preview gate:** owner approves Dashboard + shell + ReviewView in Storybook before any Phase B.

## Component Tree

```
DashboardPage            — Route container (`pages/dashboard/DashboardPage.tsx`)
  │                        PageShell(hub-launcher) + phase gate + guest/auth split
  ├── DashboardGuest     — Guest landing (sign-up CTA, hero card, phase previews)
  ├── DashboardWelcome   — Phase 1 welcome (dashed empty-state focal card)
  └── DashboardSections  — Authed (phase 2+)
        ├── PageHeader   — eyebrow (phase), title ("Welcome back"), streak, CTA
        ├── Current Phase    — section head (+% meta) + Box `card` focal card (ProgressBar)
        ├── Quick Access     — section head + PageGrid of 4 Button `tag` tiles
        └── Recent Activity  — section head + Box `card` rows / dashed EmptyState
```

## State & Data Flow

No feature stores (no Zustand/Context here). `DashboardPage` reads auth via `useAuth()`
(`features/auth`) and phase via the shared `usePhaseGate` hook (`shared/hooks/usePhaseGate.ts`)
→ `phaseGateService.fetchPhaseGate` → `GET /v1/progression/phase-gate`
(`ROUTE_PATTERNS.progressionPhaseGate`); page-level local `useState` only (`streakDays`,
`activities`). Recent Activity is hardcoded `activities=[]` (real wiring is Phase B).
No polling or real-time subscriptions.

## Responsive scope

Desktop-first. The legacy mobile `@media` blocks are gone with
`DashboardPage.css`: the tile grid now collapses via `PageGrid`'s canonical
auto-fit columns (4 → 2 → 1) and `PageShell` tightens its gutters under 480px.
Sub-320px reflow is still out of scope.

## File Structure

```
features/dashboard/
├── dashboard.css                — feature surfaces (card family, tile, skeleton)
├── index.ts                     — barrel + stylesheet entry
├── components/
│   ├── DashboardWelcome.tsx     — Phase 1 welcome (PageStack + dashed focal card)
│   ├── DashboardGuest.tsx       — Guest landing (hero card + PageGrid previews)
│   ├── DashboardSections.tsx    — Phase 2+ (focal card, tiles, activity)
│   └── __tests__/               — Component tests
└── docs/
    └── design.md                — This document
```
