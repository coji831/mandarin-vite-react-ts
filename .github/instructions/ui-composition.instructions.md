---
description: "Use when designing or laying out new UI — pages, sections, cards, forms. Covers visual hierarchy, spacing rhythm, CTA clarity, and container discipline. Read BEFORE writing any UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# UI Composition Guide

## Purpose

Prevent "AI slop" UI — generic, cluttered, no-hierarchy layouts. These rules teach the agent how to compose components aesthetically _before_ writing code.

## Golden Rule

**One primary focal point per section.** If the user can't identify the main action or content at a glance, the layout is wrong.

---

## 1. Visual Hierarchy

- **One clear heading level per section:** Use `<h2>` for section titles, `<h3>` for subsection titles. Never skip levels.
- **Spotlight the CTA:** The primary action button must use `variant="primary"`. Secondary actions use `variant="secondary"` or `variant="ghost"`. Never use two primary buttons next to each other.
- **Content priority:** Place the most important content top-left (or top-center for hero sections). Less important content flows below.
- **Font size ladder:** Don't jump sizes erratically. Use: `font-xl` (h2) → `font-lg` (h3) → `font-sm`/`font-md` (body) → `font-xs` (metadata/muted).

## 2. Spacing Rhythm

- **Use gap utilities, never raw margins between children:** `gap-xs` (8px), `gap-sm` (12px), `gap-md` (16px), `gap-lg` (24px). Stacking sections use `gap-sm` or `gap-md` on the parent flex container.
- **No raw `margin` properties in CSS** — use utility classes (`mx-auto`, `p-*`, `gap-*`) or `Box` component `padding` prop.
- **Inner padding:** Use `Box` `padding` prop consistently: `"xs"` for dense toolbars, `"sm"` for card content, `"md"` for section containers.
- **Breathing room:** Leave at least `gap-sm` between distinct visual sections. If two sections feel stuck together, add `gap-md`.

## 3. Container Discipline

- **Prefer `Box` over raw `<div>`:** `Box` enforces the design system's border, background, and padding tokens. Only use raw `<div>` for truly unstyled wrappers (e.g., flex containers with no visual treatment).
- **Pick the right `Box` variant:**
  - `"dark"` — top-level section containers, intro headers, tip callouts
  - `"dark-alt"` — secondary panels, grids, search bars
  - `"elevated"` — floating/prominent cards
  - `"card"` — content cards with interactive state
  - `"surface"` — inline info blocks
  - `"divider"` — visual separators between sections
- **Max nesting depth of 3:** Page wrapper → section Box → content. Beyond 3 levels, extract a component.
- **Don't nest `Box` inside `Box` unnecessarily** — use a single `Box` with the right variant and padding.

## 4. CTA & Interaction Clarity

- **One primary CTA per view:** The user should know immediately what to click. Highlight it with `Button variant="primary"`.
- **Destructive actions use `variant="secondary"` with `className="text-error"`** — never color a destructive button primary.
- **Disable CTAs that can't be used:** `disabled` prop on `Button`, `op-40` utility for visual feedback.
- **Loading states on CTAs:** Use `Button`'s `loading` prop — never hide the button during loading.

## 5. Layout Density & Responsiveness

- **Don't overcrowd:** If a section has more than 6-7 items, consider a grid or pagination.
- **Grid items:** Use `flex-wrap gap-sm` for variable-width item lists. Use `grid-2-col`/`grid-3-col` for card grids.
- **Responsive baseline:** Assume mobile-first. Use `flex-col` stacking on narrow viewports, switch to row layouts with media queries.
- **Overflow prevention:** Always wrap dynamic content in a container with `overflow-hidden` or test that `scrollWidth` doesn't exceed `clientWidth`.

## 6. What "Good UI" Looks Like for This Project

- **Clean dark theme:** Our surfaces use `--surface-dark` (bg) and `--surface-dark-alt` (panel bg). Content sits on `--surface-dark-alt` inside `Box` containers.
- **Amber accents:** Primary color is amber (`--color-primary`). Use it sparingly — for CTAs, active states, and emphasis only.
- **Consistent radii:** `radius-sm` for buttons/cards, `radius-md` for larger panels, `radius-pill` for chips/tags.
- **Subtle borders:** `border-1 border-surface` on panels and cards. Avoid thick borders.
- **Minimal text colors:** `text-primary` for headings, `text-secondary` for body, `text-tertiary` for secondary info, `text-muted` for hints/metadata. Don't invent other colors.

## 7. Preview vs Detail Separation (Master-Detail Law)

**A card is a teaser. A detail panel is a reward.** The learner clicks the card because it promises value; the detail panel delivers value the card did NOT already show. (Folded in from the retired `preview-detail-separation.instructions.md`.)

1. **Identify the preview surface** — the card/list item and its purpose.
2. **List all elements on it**, then classify each as preview (stays) or reward (moves to detail):

| Preview (stays on card) | Reward (move to detail panel)        |
| ----------------------- | ------------------------------------ |
| Glyph (hero)            | Etymology (story)                    |
| Pinyin (how to say it)  | Variant forms (new discovery)        |
| Meaning (what it means) | Full character list (the main event) |
| Strokes (metadata)      | Notes (extra context)                |
| ★ badge (priority)      | Similar radicals (comparison)        |

3. **Remove reward elements from the card** — duplicating detail content on the card makes the detail panel feel redundant ("I already saw this on the card").
4. **Verify the reward loop** — after clicking through, the learner finds NEW content.

### Anti-patterns

- Variant forms on the card (discovery of "扌 is also 手" is the reward for clicking)
- Character preview strip on the card (small characters look clickable but aren't — WAGC violation)
- Etymology on the card (deep-read element belongs in the detail panel)
- Duplicating any detail-panel section on the card

### Best practices

- **One priority indicator per card** — a ★ badge is enough; don't stack colored border + elevated shadow + wider column (one signal, not three).
- **Every card element helps scanning** — Glyph → "Is this the shape?", Meaning → "What is this?", ★ → "Important?", Strokes → "How complex?"
- **Design for current architecture, not future-state** — don't pre-implement a richer card that belongs to a future redesign.
- **WAGC + density + clarity** before adding anything to a card.

---

**See also:** `uiux-design-protocol.instructions.md` (design pipeline) • `frontend-css-styling.instructions.md` (styling workflow) • `frontend-pre-delivery-checklist.instructions.md` (layout audit)
