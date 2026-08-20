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

| Region             | Component                                                               |
| ------------------ | ----------------------------------------------------------------------- |
| Header             | `PageHeader` (title/eyebrow/description + ≤1 primary Button top-right)  |
| Focal card         | `Box` variant `dark` (hairline + `--shadow-elevated-1` + `--radius-lg`) |
| Empty-state focal  | `Box` variant `dashed`                                                  |
| Quick-access tiles | `Button` variant `tag` (`flex-col` + hover-lift)                        |
| Progress           | `ProgressBar`                                                           |
| Loading            | `Skeleton` (dims = final dims)                                          |
| Activity           | `Box` variant `dark`                                                    |

## 5. Token map

| Element         | Tokens                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Header title    | `font-3xl fw-700 tracking-tight text-primary`                                                       |
| Eyebrow         | `font-xs fw-500 text-muted tracking-wide`                                                           |
| Header CTA      | `--gradient-primary` bg, `--radius-md`, hover-lift `--shadow-md` (amber)                            |
| Focal card      | `--surface-dark` + `--surface-border-subtle` hairline + `--shadow-elevated-1` + `--radius-lg`       |
| Quick tile      | `--surface-dark` + hairline + `--shadow-elevated-1`; hover `translateY(-2px)` + amber `--shadow-md` |
| Section h2      | `font-lg fw-600 text-primary`                                                                       |
| Progress meta   | `font-sm text-muted`; bar = `ProgressBar` (success gradient at 100% — untouched)                    |
| Activity rows   | `font-sm text-secondary`; empty = `font-sm text-muted`                                              |
| Guest hero card | `--surface-dark` + hairline + `--radius-lg` + `--shadow-elevated-1`                                 |
| Skeleton        | `Skeleton` — dims equal final card/header dims                                                      |

New tokens landed in this phase: `--surface-border-subtle`, `--shadow-elevated-1/2/3`, `--tracking-tight` (+ utilities). Amber `--shadow-md/lg` are now hover/XP-only (see DESIGN.md Elevation Usage Ladder & Amber Restriction).

## 6. A11y checklist (desktop-only)

- One `<h1>` (PageHeader); sections use `<h2>`; no skipped levels.
- `focus-visible` ring (`outline: 2px solid var(--color-primary)` + 2px offset) on every interactive element (WCAG 2.4.11).
- Contrast: `--text-primary/secondary/muted` on `--surface-dark` (existing tokens pass AA).
- Touch targets ≥ `--size-touch` (28px) on nav rows, quick tiles, CTA (SC 2.5.8).
- No color-only states: ProgressBar paired with % text; phase status has text.
- Focus order = visual order (header CTA → focal → sections).
- **320px reflow EXCLUDED** — mobile out of scope (Phase A decision 4).

## 7. Data-resilient shell

- `.dashboard`: `max-width: 960px`, `margin: 0 auto`, `padding: var(--space-xl) var(--space-lg)`, `min-height: 0` (no viewport floor — content grows inside `.app-content`), `overflow-x: clip`; scroll lives in `.app-content` (existing).
- Skeleton dims = final dims (header bar height, focal-card height, 4-tile grid cells, activity rows) — no CLS.
- Recent Activity renders its **existing empty branch** (the page hardcodes `activities=[]`; real data wiring is Phase B).

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
DashboardPage            — Route container (`pages/dashboard/DashboardPage.tsx`) — phase gate + guest/auth split
  ├── DashboardGuest     — Guest landing (sign-up CTA)
  │     └── DashboardWelcome  — Personalized welcome message (phase-1 CTA)
  └── DashboardSections  — Authed (phase 2+) dashboard
        ├── PageHeader   — eyebrow (phase name), title ("Welcome back"), streak, CTA
        ├── Current Phase    — h2 + Box `dark` focal card (ProgressBar)
        ├── Quick Access     — h2 + 4 Button `tag` tiles (Icon + label)
        └── Recent Activity  — h2 + Box `dark` (list rows or EmptyState)
```

## State & Data Flow

No feature stores (no Zustand/Context here). `DashboardPage` reads auth via `useAuth()`
(`features/auth`) and phase via the shared `usePhaseGate` hook (`shared/hooks/usePhaseGate.ts`)
→ `phaseGateService.fetchPhaseGate` → `GET /v1/progression/phase-gate`
(`ROUTE_PATTERNS.progressionPhaseGate`); page-level local `useState` only (`streakDays`,
`activities`). Recent Activity is hardcoded `activities=[]` (real wiring is Phase B).
No polling or real-time subscriptions.

## Responsive scope

Desktop-only (Phase A decision 4 — 320px reflow excluded). The legacy mobile `@media`
blocks in `DashboardPage.css` remain untouched (Phase A out-of-scope).

## File Structure

```
features/dashboard/
├── index.ts                     — Barrel exports
├── components/
│   ├── DashboardWelcome.tsx     — Welcome message + greeting
│   ├── DashboardGuest.tsx       — Guest landing with sign-up CTA
│   ├── DashboardSections.tsx    — Main authenticated dashboard
│   └── __tests__/               — Component tests
└── docs/
    └── design.md                — This document
```
