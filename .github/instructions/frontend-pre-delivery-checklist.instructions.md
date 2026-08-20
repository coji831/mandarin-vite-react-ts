---
description: "Use before reporting any UI code as complete. Run through every item to catch common design violations — token compliance, states coverage, interaction, layout, and pre-ship gate pointers."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Pre-Delivery UI Checklist

Before reporting any UI code as complete, verify every item. Each section cross-references the how-to instruction file that teaches the skill.

## Token & Style Compliance

See `frontend-css-styling.instructions.md` for the full styling workflow.

- [ ] Read `docs/guides/design/design-reasoning.md` — confirm your design aligns with Warm Minimalism
- [ ] No hardcoded colors (`#xxx`, `rgba()`) in `.tsx` files — use CSS variables only
- [ ] No hardcoded spacing (`gap:`, `padding:`, `margin:` with raw px) in CSS — use `var(--space-*)`
- [ ] No hardcoded font sizes — use `var(--font-*)`
- [ ] Utility class preference — don't create custom CSS if 2+ utility classes achieve the same layout

## States Coverage

See `frontend-api-client.instructions.md` for the 3-state service pattern (loading/error/success).

- [ ] Loading state — skeleton matches final content dimensions exactly (no layout jump)
- [ ] Empty state — handled with a message, not a crash or blank screen
- [ ] Error state — ErrorScreen or inline error for API failures, not console.log
- [ ] Disabled state — visually clear (`op-40` or equivalent) and non-interactive

## Interaction

See `ui-composition.instructions.md` for CTA clarity and layout rules.

- [ ] All clickable elements have `cursor: pointer` and hover/press states
- [ ] All icon-only buttons have `aria-label`
- [ ] No animation/transition/transform/pseudo-element motion in feature CSS unless a shared component variant or the documented tree exception (see `DESIGN.md` — Global Motion Rule; Radical/Phonetic Trees expand/collapse is the single documented exception)
- [ ] Dialog focus — focus moves into dialogs on open (`tabIndex={-1}`) and returns to the trigger on close (WCAG 2.4.3)
- [ ] Long browser/e2e verification runs use **small surgical batches + incremental on-disk ledger** per `docs/knowledge-base/practices/agent-browser-verification.md`

## Layout

See `ui-composition.instructions.md` for container discipline and `uiux-design-protocol.instructions.md` for data-resilient shell rules.

- [ ] Data-resilient shell — container uses fixed `height`/`width`, inner scroll for overflow
- [ ] Verified at 320px, 768px, 1024px
- [ ] No horizontal scroll
- [ ] Spacing hierarchy correct — section gaps > item gaps
- [ ] **Z-index layering** — spot-check at least one modal + one popover/overlay in browser: correct stacking vs page chrome, focus surface not unexpectedly covered
- [ ] **Layout stability (CLS)** — no measurable layout shift when data resolves (skeleton dimensions match final content; images/media reserve space)
- [ ] **Mobile/tablet browser spot-check** — at least one 375–390px mobile + one 768px tablet browser pass (complements the existing static 320/768/1024 CSS check); **required when the story changes layout/composition**, otherwise optional

## Visual QA

See `docs/guides/testing/visual-qa.md` for the per-surface procedure and the evidence contract. These two items strengthen gate #13 (no new gate number).

- [ ] **Chromatic/Playwright baseline diff accepted** for this PR's story changes (or no visual change) — the accept/deny decision recorded
- [ ] **Per-surface visual QA script run at epic close** — pass/fail + date recorded in `verification-artifacts/` (never per-commit; the automated Chromatic layer covers per-PR)

## Quality Gates (Pointer to Canonical Model)

Gates are defined in the canonical two-tier model in
`project-workflow.instructions.md` (source of truth) — this checklist does not
redefine them. Tier 2 (full suite) applies on pre-ship:

- **Static (Tier 1):** `npm run build` + `npm run lint`
- **Full suite (Tier 2):** `npm run test:full` + `npm run test-storybook --workspace=@mandarin/frontend` + `npm run check:page-inventory`
- **Design:** `npx @google/design.md lint DESIGN.md` + `npm run design-audit`

`npm test` is the changed-scope Tier-1 runner only — the full-suite gate is
`npm run test:full`.

Scoring companion (not a gate): at epic close, run the design-quality rubric
human pass (`docs/guides/design/design-quality-rubric.md`) as the per-epic
consistency snapshot against the archetype's Golden Template
(`docs/guides/design/page-archetypes.md`). Point, don't duplicate — the
criteria live in the rubric and the canonical gate table above.

UI-specific non-gate items still required before reporting UI complete:

- [ ] No `console.log`, no commented-out code, no TODO/FIXME comments in production code
- [ ] Storybook story exists for new components (see `storybook-production-alignment.instructions.md`)
- [ ] Feature `docs/design.md` (if changed) matches the shipped component structure — renamed components reflected, no stale sections.
- [ ] **No new `Features/...` stories** — story placement restricted to Pages/Layouts/Shared (3 grandfathered stories tracked as TD-001..003 in `docs/guides/testing/known-failures.md`)
- [ ] **`component-registry.json` consulted** before creating UI structure; no reimplemented shared component; no shared-component class on a raw native element
- [ ] **DESIGN.md ↔ globals.css token parity** — new/changed tokens present in both (reconcile drift)

---

**See also:** `frontend-css-styling.instructions.md` • `frontend-api-client.instructions.md` • `ui-composition.instructions.md` • `testing-standards.instructions.md` • `storybook-production-alignment.instructions.md`
