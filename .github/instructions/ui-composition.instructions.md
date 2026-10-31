---
description: "Composition rules for laying out a surface: hierarchy, spacing rhythm, container choice, CTA clarity, density. Read before composing new UI."
applyTo: "apps/frontend/src/**/*.tsx"
---

# UI composition

Judgement, not gate. A linter can check a token; only a reader can check whether a screen has one job.

## Hierarchy

One `h1` per page, then `h2` for sections, `h3` for subsections. Never choose a level for its size; use
CSS. The primary action uses `variant="primary"`, secondary actions `secondary` or `ghost`, and two
primary buttons never sit side by side. The most important content is top-left (top-centre for a hero).

## Spacing rhythm

Space with `gap-*` on the parent, never with margins between children. Sections take `gap-sm` or
`gap-md`; a dense toolbar takes `gap-xs`. If two sections feel stuck together, the rhythm is wrong, not
the content.

## Container discipline

Prefer `Box` over a raw `div`: it carries the design system's border, background and padding tokens. A
raw `div` is for a wrapper with no visual treatment. Pick the variant that states the role (`card`,
`surface`, `elevated`, `divider`) rather than a colour. Nesting stops at three levels.

The page frame is not yours to set: `PageShell` -> `PageHeader` -> `PageStack` -> `PageGrid` own the
measure, the rhythm and the card grid. A page max-width, a centring wrapper or a page grid in a page
stylesheet fails `design-audit:foundation`.

## CTA clarity

One primary CTA per view, and the user should know immediately which it is. A destructive action is
`variant="secondary"` with an error treatment, never primary. Disable what cannot be used, and use the
`loading` prop rather than hiding the button.

## Density

More than six or seven loose items in a section wants a grid or a filter. Card grids use
`grid-2-col` / `grid-3-col`; variable-width lists use `flex-wrap gap-sm`. Wrap dynamic content so it
cannot overflow: check that `scrollWidth` does not exceed `clientWidth`.

## Master-detail: a card is a teaser, a detail is the reward

Three tiers, not two. A **preview** row teases; a **peek** delivers the reward without leaving the
surface you were reading; a **detail page** is a routable surface for "I arrived at this thing".

A peek is right only where the surface has **no task, no completion and no progress** (the lexical hub,
ADR-014). A surface **with** a task is a session: it goes straight to a routed detail page, and a peek
must never host one.

When splitting a card, the hero glyph, pinyin, meaning and a priority badge stay; etymology, variant
forms, the full character list, notes and comparisons move to the detail. Worked examples and the full
classification table: `docs/guides/design/page-archetypes.md`.
