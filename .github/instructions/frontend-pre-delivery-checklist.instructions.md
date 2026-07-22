---
description: "Use before reporting any UI code as complete. Run through every item to catch common design violations — token compliance, states coverage, interaction, layout, and quality gates."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Pre-Delivery UI Checklist

Before reporting any UI code as complete, verify every item. Each section cross-references the how-to instruction file that teaches the skill.

## Token & Style Compliance

See `frontend-css-styling.instructions.md` for the full styling workflow.

- [ ] Read `docs/guides/design-reasoning.md` — confirm your design aligns with Warm Minimalism
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
- [ ] Animations use `transform`/`opacity` only — never `width`/`height`/`top`/`left`

## Layout

See `ui-composition.instructions.md` for container discipline and `frontend-visual-design-protocol.instructions.md` for data-resilient shell rules.

- [ ] Data-resilient shell — container uses fixed `height`/`width`, inner scroll for overflow
- [ ] Verified at 320px, 768px, 1024px
- [ ] No horizontal scroll
- [ ] Spacing hierarchy correct — section gaps > item gaps

## Quality Gates

- [ ] No `console.log`, no commented-out code, no TODO/FIXME comments in production code
- [ ] Storybook story exists for new components (see `storybook-production-alignment.instructions.md`)
- [ ] `npx @google/design.md lint DESIGN.md` passes
- [ ] `npm run lint` — 0 errors (0 warnings preferred)
- [ ] Existing tests pass — `npm test` (or `npm run test:full` for full suite, see `testing-standards.instructions.md`)
- [ ] `npm run build` — type-check + bundle succeeds

---

**See also:** `frontend-css-styling.instructions.md` • `frontend-api-client.instructions.md` • `ui-composition.instructions.md` • `testing-standards.instructions.md` • `storybook-production-alignment.instructions.md`
