---
name: frontend-audit
description: "Run this skill when auditing frontend code — UI, components, pages, or full userflows. Part 1 covers the 12 UIUX fundamentals + the AI-slop checklist (first-class); Parts 2–4 cover architecture & data, verification, and integration so ALL frontend development is audited. Use after implementing a frontend feature, before closing a UI story, or when reviewing any frontend change."
user-invocable: true
---

# Frontend Audit Skill

The umbrella audit procedure for ALL frontend work, built on `docs/guides/design/uiux-fundamentals.md` (the 12 fundamentals + QA pyramid + AI-slop list) and `frontend-component-architecture.instructions.md` (structure/state/logic). **UIUX + AI-slop is Part 1 (the headline); Parts 2–4 keep every other frontend concern covered** — this is the lean-but-complete frontend audit. It supersedes the `uiux-audit` skill (renamed + broadened) and the older `frontend-audit`/`component-decomposition` skills.

## When to Use

- After implementing a frontend feature (self-audit by Frontend Engineer)
- During code review (Code Reviewer checking frontend changes)
- Before closing a story that touches UI
- When auditing a full page/userflow against the fundamentals
- When debugging UI quality, "AI slop", or architecture drift

## 0. Preparation (read before auditing)

1. `docs/guides/design/uiux-fundamentals.md` — the 12 fundamentals + AI-slop checklist + QA pyramid (Part 1's spec)
2. `frontend-component-architecture.instructions.md` — 3-tier hierarchy, state colocation, logic placement, barrels, stores, drift (Part 2's ruleset)
3. `DESIGN.md` — tokens, component specs, Elevation Usage Ladder, Global Motion Rule
4. `.github/component-registry.json` — the ONLY allowed component list
5. `docs/guides/design/page-archetypes.md` — the archetype contract for page surfaces
6. Run the machine gates first (below) — they surface most violations before the human pass.

## 1. Machine Gates (run first — L1/L2/L3 of the QA pyramid)

- `npm run design-audit` → **0 errors** (token violations, slop, magic values, color-role leaks, elevation/z-index, line-height/weight literals)
- `npx @google/design.md lint DESIGN.md` → 0
- `npm run lint` + `npm run typecheck` → 0
- `npm test` (changed scope) → pass
- `npm run test-storybook --workspace=@mandarin/frontend` → pass (includes the **hard axe gate**: `a11y.test:'error'`, WCAG 2.2 `runOnly`)
- `npm run check:registry-stories` + `npm run check:page-inventory` → pass (registry contract + archetype conformance)
- **Visual regression (L4/L5):** if the story changed, the Chromatic baseline diff must be accepted/recorded.

> **Elevation blind spot:** `elevation-no-hairline`/`slop-untokened-shadow` only scope `--shadow-elevated-*` tokens — a surface on the compat `--shadow-sm` (e.g. Box `dark`/`card` Browse tier) is invisible to the rules. Always **also compare each surface's rendered shadow + hairline against the DESIGN.md Elevation Usage Ladder** (which declares Browse cards = `--shadow-elevated-1` + `--surface-border-subtle`). A 0-error audit does NOT prove ladder parity.

## Part 1 — UIUX Fundamentals + AI-Slop (first-class)

### 1A. The 12 fundamentals (human audit items)

Score each against the applied form in `uiux-fundamentals.md` §1 (per-page + per-component where noted).

| #   | Fundamental           | Human check                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | WCAG contrast         | Muted/subtle text legible on `--surface-dark` and elevated surfaces; text-role tiers respected (primary/secondary = body ≥4.5:1; muted = large/decorative only); hairline borders decorative-exempt OK                                                                                                                                                                                                                                                                             |
| 2   | Typography discipline | ≤4–5 active type sizes per surface; weight/color over size; bold only for metrics/emphasis; no ad-hoc line-height/weight (tokens only); display headings carry `tracking-tight`                                                                                                                                                                                                                                                                                                    |
| 3   | Semantic color roles  | Color carries meaning (status/feedback via `--success/error/warning/info`); pinyin `--tone-*` only in sanctioned tone surfaces; no decorative saturated fills                                                                                                                                                                                                                                                                                                                      |
| 4   | Spacing & grids       | 8pt-scale tokens only; nesting tightens (outer > inner > card > chip); section gap > item gap; no same-gap collapse; no raw margins                                                                                                                                                                                                                                                                                                                                                |
| 5   | Elevation & layering  | Resting elevation = `--shadow-elevated-1/2/3` only + hairline; amber family hover/XP only; z-index from the `--z-*` ladder; ≤2–3 competing elevated surfaces per viewport (depth budget). **Ladder-vs-render check:** open the rendered surface and confirm its shadow + hairline match the DESIGN.md Elevation Usage Ladder row for its tier (Browse card / popover / modal / focus-flat) — do NOT trust a 0-error `design-audit` alone (it misses the compat `--shadow-sm` tier) |
| 6   | Cognitive load        | Advanced options behind a reveal, not stacked on the shell (progressive disclosure); hub-launcher quick-access grid capped ~8–9 targets per group (Hick's law); one primary CTA per view                                                                                                                                                                                                                                                                                           |
| 7   | Layout physics        | Single-scroll shell respected (`100dvh`/`min-height:0` chain); no nested scroll containers; `min-w-0`/`flex-shrink:0` where flex children could blow out; no horizontal scroll at 320/768/1024                                                                                                                                                                                                                                                                                     |
| 8   | Quality bar           | Side-by-side vs the archetype's Golden Template (ReviewView focus-task / DashboardPage hub-launcher) — no structural drift (canonization gate 8)                                                                                                                                                                                                                                                                                                                                   |
| 9   | Deep hierarchy        | **Squint test**: blur/zoom-out → top 3 visible elements = intended hierarchy; depth budget ≤2–3 elevated surfaces; generous padding > borders                                                                                                                                                                                                                                                                                                                                      |
| 10  | Data density          | (Dense surfaces only, epics 36/37) scan-friendly rows, tabular numerals for counts, status via roles not saturation                                                                                                                                                                                                                                                                                                                                                                |
| 11  | Composition & focus   | Focus order = visual order; focus-visible ring on every interactive; Modal/Dropdown focus trap correct; compose via sub-parts, no parent-injected styles                                                                                                                                                                                                                                                                                                                           |
| 12  | Tailwind-ref          | No Tailwind classes or arbitrary values anywhere; "no magic numbers" discipline holds                                                                                                                                                                                                                                                                                                                                                                                              |

### 1B. AI-Slop checklist (12 items — `uiux-fundamentals.md` §3)

1. Gradient only on sanctioned surfaces (whitelist) — `slop-gradient`
2. No glassmorphism / backdrop-filter — `slop-backdrop-filter`
3. No glow/glass blur — `slop-blur`
4. Shadows tokenized — `slop-untokened-shadow`
5. Emoji only where `Icon` doesn't cover the surface; banned once covered (ADR-010) — `slop-emoji`
6. Resting amber shadow forbidden (hover/XP only) — `resting-amber-shadow`
7. No decorative animation/transition/transform in feature CSS — `transition-token-only` + Global Motion Rule
8. ≤1 filled saturated element per viewport (all hues) — `saturated-fill-overflow` + rubric one-CLA
9. Display headings carry `tracking-tight` — `display-tracking`
10. No confetti/particles/floating orbs/glow gradients (AI-Native UI / playful) — human
11. Microcopy: action verbs, empty states give a next step, no placeholder slop — human
12. No hardcoded color/spacing/font-size/line-height/font-weight/radius/z-index — `hardcoded-*` + `z-index-raw` + `inline-style-magic-value`

## Part 2 — Architecture & Data

**Ruleset:** `frontend-component-architecture.instructions.md`.

- **Three layers** — thin page container (≤ ~100 JSX lines, delegates) → feature components → shared primitives. No feature logic in `shared/`, no raw-HTML soup in a page.
- **Shared component reuse** — no reimplementation of any shared component (Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, ContentBrowser, PageHeader, Box). A raw native element carrying shared-component classes (`btn-*`, `input-*`, `card-*`) is a violation. Extend via new props; never CSS-cascade overrides.
- **State colocation** — lift only when ≥2 siblings share it; compute derived values in render; server/data state behind a service + hook; URL-as-state for shareable/filterable; global store ONLY for cross-cutting.
- **Logic placement** — JSX is a pure projection; side effects in event handlers; `useEffect` last resort; reusable stateful behavior → hook; stateless domain/API → service; complex flows → store with named actions.
- **Service layer / API** — no `apiClient` calls from hooks/components; every HTTP call goes through a feature service (`passageService`, `wordService`). High if a component calls `apiClient` directly.
- **Barrels** — `index.ts` re-exports only, never inline types/constants/logic; consumers import through the barrel, not direct file paths.
- **Store placement** — stores in `stores/` (feature or `shared/store/`), never in `components/`.
- **Input / timer edge cases** — countdown timers have an explicit "time's up" transition; auto-submit inputs account for multi-syllable input (longer debounce or explicit submit). Per `frontend-input-handling.instructions.md`.
- **Extraction triggers** — JSX branch >50–80 lines; new local state in a render branch; props changing together; same JSX in 2+ places; file under `components/` past ~250 lines (`large-component` advisory).
- **Named `XxxProps`** for >2 props; data down / `onXxx` up; composition over prop-drilling.
- **Design-system drift** — any shared-component API change (props/variants/path) or token change must update `DESIGN.md` + `.github/component-registry.json` **in the same commit**.
- **CSS import bypass** — no `eslint-disable-next-line no-restricted-imports` to bypass CSS import restrictions.
- **Global CSS bleed** — no component styles leaking via global `button`/`input`/`select` resets.

## Part 3 — Verification

- **Registry + states** — every shared component declares `storybook.storyFile` + non-empty valid `states` (`check:registry-stories`); states cover the declared set (loading/empty/error/disabled where applicable) via stories + MSW.
- **Tests present + passing** — per `testing-standards.instructions.md` (Testing-Trophy, not coverage %); changed code has a test.
- **States matrix (page containers)** — Default/Loading/Empty/Error/Edge/Guest ALL present in `page-inventory.json` `states[]` + mapped to stories + MSW-mocked (static pages exempt where no initial fetch). High if a fetching container lacks a state.
- **Layout stories target the real layout** — page stories use `AppLayout`/`LearnLayout` as `component:`, not an inline stand-in.
- **MSW-only for data states** — data states mocked via MSW, not store-injection (store/context injection only in decorators for auth/guest/layout).
- **Story ↔ production parity** — open the Storybook story and the production page in browser, wait for both to fully render, compare the SAME state (loading↔loading, data↔data), verify data parity (same rows/cards/items), compare layout/spacing/colors.
- **Visual overflow** — `scrollWidth > clientWidth` / clipping / unexpected horizontal scrollbars on dynamic containers; flex-shrink clip (`flex-shrink:0` on growing children; ONE unified scroll container).
- **Async-enrich rendering** — derived/enriched display fields read from the display shape, not the raw fetch shape.
- **Story isolation** — stories that read/write localStorage/singletons reset in per-story `beforeEach`.
- **Responsive + CLS** — 320/768/1024 + mobile spot-check; skeleton dims = final dims; no layout shift when data resolves.
- **a11y** — interactive elements have `role`, `aria-label`, `tabIndex`, keyboard handlers; `React.memo` where frequently re-rendering.

## Part 4 — Integration

- **External DOM libs** — canvas/animation libs (hanzi-writer, D3) integrated per `react-external-libs.instructions.md`: ref stability, DOM ownership, lifecycle coordination; no direct DOM writes fighting React.
- **Feature conventions** — quiz/review follow `quiz-architecture.instructions.md` (strategy pattern, routing, component reuse); no feature logic in stories.
- **No business logic in stories** — stories are thin visual shells over real data flow; no home-grown data fetching/state machines inside a story.
- **Doc ↔ code truth-check** — for changed components/features, verify the feature `docs/design.md` + BR/impl still match (renamed components reflected, endpoints accurate).

## Output Format

- Group findings by file path / surface
- For each: file/surface, description, which Part + fundamental/AI-slop item it maps to, severity (HIGH/MEDIUM/LOW), suggested fix
- For page audits: a rubric score table per surface (the 12 fundamentals + states + AI-slop) and the full-userflow walk
- End with a summary: X findings (Y high, Z medium) + a fix list
- Record the audit in `verification-artifacts/` (e.g. `frontend-audit-<page>-full-userflow.md`) with pass/fail + date
