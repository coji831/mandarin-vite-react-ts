---
purpose: "The flex scroll chain and the layout failure modes it prevents, with the worked examples"
status: active
last-verified: 2026-10-31
audience: both
type: guide
---

# Layout physics

Reference, not rule. The rule it supports is in
`.github/instructions/frontend-css-styling.instructions.md` (the three conditions); this file is the long
form with the examples.

## Layout Gotchas — Flex Overflow & Scrolling

When building page layouts with flexbox where only a specific area should scroll (not the whole page), the flex chain must be properly bounded at every level.

### The Scroll Chain Rule

For `overflow-y: auto` to create an internal scroll area in a flex layout:

```
root-container { height: 100vh }           ← MUST be bounded (not min-height)
  flex-child { flex: 1; min-height: 0 }    ← MUST have min-height: 0
    scroll-area { flex: 1; overflow-y: auto; min-height: 0 }  ← scrolls
```

**Three conditions, all required:**

1. **The root flex container must have a bounded height** — `height: 100vh` (not `min-height: 100vh`). `min-height` is a floor, not a ceiling — the layout can still grow past it, making overflow impossible.

2. **Every flex ancestor in the chain needs `min-height: 0`** — Flex items default to `min-height: auto`, which means they CANNOT shrink below their content size. Without `min-height: 0`, `overflow-y: auto` never activates because there's never space for overflow.

3. **The scroll area must be a `flex: 1` child between fixed-height siblings** — The scroll area fills remaining space. Its siblings (header, footer, toolbar) take their natural height via `flex: 0 0 auto` or just no flex-grow.

### Anti-pattern

❌ `min-height: 100vh` on the root container — lets the entire layout grow past the viewport, forcing document-level scroll instead of internal scroll.

❌ `overflow-y: auto` on a flex child without `min-height: 0` on every flex ancestor — the child can't shrink below content size, so it never overflows.

❌ Fixing the scroll at `.learn-content` level when only `.radicals-page__content` needs to scroll — creates nested scroll containers and unexpected scrollbar behavior.

### ✅ Fix pattern (from radicals page)

```css
.app-layout {
  height: 100vh;
} /* bounded root */
.app-content {
  min-height: 0;
  overflow-y: auto;
} /* ancestor chain */
.learn-content {
  min-height: 0;
} /* ancestor chain */
.radicals-page__content {
  overflow-y: auto;
  min-height: 0;
} /* scrolls */
```

### Flex shrink/clip gotcha (from commit f365dc54)

A flex item with `overflow: hidden` sets `min-height: auto → 0`, so flex **shrinks** expanded
content — content stays in the DOM but is invisible. Real case: `.phonetic-family-node` was
rendered at 49px (header height) instead of 357px; the expanded member list was clipped.

Two rules:

1. **`flex-shrink: 0` on the growing child** — never let a dynamic-content item be shrunk
   below its content height:
   ```css
   .phonetic-family-node {
     flex-shrink: 0;
   }
   ```
2. **ONE unified scroll container, not nested per-item scrollers** — the tab wrapper is the
   single scroll zone; items inside must NOT each carry `overflow-y: auto` / `max-height`:
   ```css
   .radical-trees-tab {
     flex: 1;
     min-height: 0;
     overflow-y: auto;
   }
   ```
   Nested per-item `overflow-y: auto`/`max-height` re-introduces the shrink/clip bug and
   creates nested scrollbars.

### Layout-Breakage Playbook (min-w-0, flex-basis, overflow knobs, stacking contexts)

Quick recipes for the most common layout breakages — reach for these before re-architecting a layout.
Reference sources: Tailwind docs (layout / flexbox / overflow / grid sections) + Josh Comeau's CSS
layout articles. These are reference sources only — this repo is **no-Tailwind**; apply the _recipes_,
never Tailwind classes or arbitrary values.

1. **Content won't shrink / flex item overflows** → add `min-width: 0` to the flex child. Flex items
   default to `min-width: auto`, which refuses to shrink below content — the horizontal sibling of the
   scroll-chain `min-height: 0` rule above.
2. **Wrapping vs truncation** → set an explicit `flex-basis` (or `width`) on the child, then apply the
   overflow knobs on the text node (`overflow: hidden`, `text-overflow: ellipsis`, `whitespace-nowrap`).
   Without a basis, an item sizes to its content and the overflow knobs have nothing to clip.
3. **Overflow knobs** — `overflow: hidden` / `clip` / `auto` must sit on the element that owns the
   scroll/clip, with `min-height: 0` / `min-width: 0` on every flex ancestor (see Scroll Chain Rule).
   `overflow-x: clip` kills an accidental horizontal scroller without creating a scroll container
   (the `DashboardPage.css` pattern) — don't reach for `overflow-x: hidden` (it creates a scroll
   container and can trap focus).
4. **Stacking contexts** — never use a raw `z-index` value; use the documented `--z-*` ladder
   (`--z-content` < `--z-chrome` < `--z-popover` < `--z-modal` < `--z-toast`, in `globals.css`).
   A `position` / `transform` / `opacity` / `will-change` on an ancestor creates a stacking context —
   if an element won't layer above a sibling, find the nearest context owner instead of cranking
   `z-index` (use `isolate`/`isolation: isolate` to start a fresh context).
