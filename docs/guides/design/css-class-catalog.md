---
purpose: "Every utility, pattern and animation class the three stylesheets declare, with its first declarations"
status: active
last-verified: 2026-10-31
audience: agent
type: guide
---

# Class catalog

Generated from the live sheets by `node scripts/generate-class-catalog.mjs`. **Do not hand-edit**;
add the class to its sheet and re-run. `npm run check:class-catalog` fails when this file is stale.

Classes found: **188** across 3 sheets.

The rule it serves is in `.github/instructions/frontend-css-styling.instructions.md`: a value comes
from a token, and a repeated shape comes from one of these classes rather than a new block.

## globals.css

Tokens plus single-property utilities: `apps/frontend/src/styles/globals.css`. 165 classes.

| Class | First declarations |
| --- | --- |
| `.absolute` | `position: absolute;` |
| `.bg-error` | `background: var(--color-error);` |
| `.bg-error-bg` | `background: color-mix(in srgb, var(--color-error) calc(var(--status-tint) * 100%), transparent);` |
| `.bg-gradient-primary` | `background: var(--accent-fill);` |
| `.bg-gradient-success` | `background: linear-gradient(90deg, var(--color-success) 0%, rgba(5, 150, 105, 1) 100%);` |
| `.bg-info-bg` | `background: var(--status-info-bg);` |
| `.bg-primary` | `background: var(--accent-fill);` |
| `.bg-primary-bg` | `background: var(--accent-tint);` |
| `.bg-primary-bg-light` | `background: var(--accent-tint);` |
| `.bg-primary-bg-medium` | `background: var(--accent-tint);` |
| `.bg-success` | `background: var(--color-success);` |
| `.bg-success-bg` | `background: color-mix(in srgb, var(--color-success) calc(var(--status-tint) * 100%), transparent);` |
| `.bg-surface-dark` | `background: var(--card);` |
| `.bg-surface-dark-alt` | `background: var(--canvas);` |
| `.bg-surface-dark-alt-2` | `background: var(--card);` |
| `.bg-surface-hover` | `background: var(--surface-hover);` |
| `.bg-surface-light-10` | `background: var(--surface-light-8);` |
| `.bg-surface-light-20` | `background: var(--surface-light-8);` |
| `.bg-surface-light-3` | `background: var(--surface-light-3);` |
| `.bg-surface-light-5` | `background: var(--surface-light-5);` |
| `.bg-surface-light-8` | `background: var(--surface-light-8);` |
| `.bg-transparent` | `background: transparent;` |
| `.bg-warning-bg` | `background: color-mix(in srgb, var(--color-warn) calc(var(--status-tint) * 100%), transparent);` |
| `.block` | `display: block;` |
| `.border-1` | `border-width: 1px; border-style: solid;` |
| `.border-2` | `border-width: 2px; border-style: solid;` |
| `.border-none` | `border: none;` |
| `.border-primary` | `border-color: var(--accent-fill);` |
| `.border-primary-border` | `border-color: var(--edge-control);` |
| `.border-surface` | `border-color: var(--hairline);` |
| `.border-surface-light-10` | `border-color: var(--surface-light-8);` |
| `.border-surface-subtle` | `border-color: var(--hairline);` |
| `.border-transparent` | `border-color: transparent;` |
| `.border-warning` | `border-color: var(--color-warn);` |
| `.border-warning-border` | `border-color: var(--color-warn);` |
| `.cursor-not-allowed` | `cursor: not-allowed;` |
| `.cursor-pointer` | `cursor: pointer;` |
| `.disabled` | `opacity: 0.3; cursor: not-allowed;` |
| `.fixed` | `position: fixed;` |
| `.flex` | `display: flex;` |
| `.flex-1` | `flex: 1;` |
| `.flex-align-center` | `display: flex; align-items: center;` |
| `.flex-between` | `display: flex; align-items: center; justify-content: space-between;` |
| `.flex-center` | `display: flex; align-items: center; justify-content: center;` |
| `.flex-col` | `display: flex; flex-direction: column;` |
| `.flex-col-center` | `display: flex; flex-direction: column; align-items: center; justify-content: center;` |
| `.flex-wrap` | `flex-wrap: wrap;` |
| `.focus` | `border-color: var(--accent-fill);` |
| `.focus-ring-primary` | `outline: 2px solid var(--focus-ring); outline-offset: 2px;` |
| `.focus-within` | `border-color: var(--accent-fill);` |
| `.font-2xl` | `font-size: var(--font-2xl);` |
| `.font-3xl` | `font-size: var(--font-3xl);` |
| `.font-4xl` | `font-size: var(--font-4xl);` |
| `.font-5xl` | `font-size: var(--font-5xl);` |
| `.font-6xl` | `font-size: var(--font-6xl);` |
| `.font-italic` | `font-style: italic;` |
| `.font-lg` | `font-size: var(--font-lg);` |
| `.font-md` | `font-size: var(--font-md);` |
| `.font-sm` | `font-size: var(--font-sm);` |
| `.font-xl` | `font-size: var(--font-xl);` |
| `.font-xs` | `font-size: var(--font-xs);` |
| `.fw-400` | `font-weight: var(--fw-400);` |
| `.fw-500` | `font-weight: var(--fw-500);` |
| `.fw-600` | `font-weight: var(--fw-600);` |
| `.fw-700` | `font-weight: var(--fw-700);` |
| `.fw-800` | `font-weight: var(--fw-800);` |
| `.gap-2xl` | `gap: var(--space-2xl);` |
| `.gap-lg` | `gap: var(--space-lg);` |
| `.gap-md` | `gap: var(--space-md);` |
| `.gap-sm` | `gap: var(--space-sm);` |
| `.gap-xl` | `gap: var(--space-xl);` |
| `.gap-xs` | `gap: var(--space-xs);` |
| `.grid` | `display: grid;` |
| `.grid-2-col` | `display: grid; grid-template-columns: repeat(2, 1fr); width: 100%;` |
| `.grid-3-col` | `display: grid; grid-template-columns: repeat(3, 1fr); width: 100%;` |
| `.grow-1` | `flex-grow: 1;` |
| `.h-8px` | `height: 8px;` |
| `.h-auto` | `height: auto;` |
| `.h-full` | `height: 100%;` |
| `.height-full` | `height: 100%;` |
| `.hover` | `opacity: 0.9;` |
| `.inline-block` | `display: inline-block;` |
| `.inline-flex` | `display: inline-flex;` |
| `.inset-0` | `inset: 0;` |
| `.items-center` | `align-items: center;` |
| `.justify-between` | `justify-content: space-between;` |
| `.justify-center` | `justify-content: center;` |
| `.left-0` | `left: 0;` |
| `.lh-1` | `line-height: var(--lh-1);` |
| `.lh-1-3` | `line-height: var(--lh-1-3);` |
| `.lh-1-4` | `line-height: var(--lh-1-4);` |
| `.lh-display` | `line-height: var(--lh-display);` |
| `.lh-normal` | `line-height: var(--lh-normal);` |
| `.lh-relaxed` | `line-height: var(--lh-relaxed);` |
| `.lh-tight` | `line-height: var(--lh-tight);` |
| `.line-through` | `text-decoration: line-through;` |
| `.m-0` | `margin: 0;` |
| `.m-lg` | `margin: var(--space-lg);` |
| `.m-md` | `margin: var(--space-md);` |
| `.m-sm` | `margin: var(--space-sm);` |
| `.m-xs` | `margin: var(--space-xs);` |
| `.max-w-320` | `max-width: 320px;` |
| `.max-w-450` | `max-width: 450px;` |
| `.max-w-480` | `max-width: 480px;` |
| `.max-w-full` | `max-width: 100%;` |
| `.mb-md` | `margin-bottom: var(--space-md);` |
| `.mb-xl` | `margin-bottom: var(--space-xl);` |
| `.min-h-0` | `min-height: 0;` |
| `.min-w-0` | `min-width: 0;` |
| `.mt-md` | `margin-top: var(--space-md);` |
| `.mt-xs` | `margin-top: var(--space-xs);` |
| `.mx-auto` | `margin: auto;` |
| `.op-0` | `opacity: 0;` |
| `.op-100` | `opacity: 1;` |
| `.op-40` | `opacity: 0.4;` |
| `.op-60` | `opacity: 0.6;` |
| `.op-80` | `opacity: 0.8;` |
| `.outline-none` | `outline: none;` |
| `.overflow-hidden` | `overflow: hidden;` |
| `.overflow-y-auto` | `overflow-y: auto;` |
| `.p-0` | `padding: 0;` |
| `.p-2xl` | `padding: var(--space-2xl);` |
| `.p-lg` | `padding: var(--space-lg);` |
| `.p-md` | `padding: var(--space-md);` |
| `.p-sm` | `padding: var(--space-sm);` |
| `.p-xl` | `padding: var(--space-xl);` |
| `.p-xs` | `padding: var(--space-xs);` |
| `.px-xs` | `padding-left: var(--space-xs); padding-right: var(--space-xs);` |
| `.py-md` | `padding-top: var(--space-md); padding-bottom: var(--space-md);` |
| `.py-sm` | `padding-top: var(--space-sm); padding-bottom: var(--space-sm);` |
| `.py-xs` | `padding-top: var(--space-xs); padding-bottom: var(--space-xs);` |
| `.radius-full` | `border-radius: 50%;` |
| `.radius-lg` | `border-radius: var(--radius-lg);` |
| `.radius-md` | `border-radius: var(--radius-md);` |
| `.radius-pill` | `border-radius: var(--radius-pill);` |
| `.radius-sm` | `border-radius: var(--radius-sm);` |
| `.relative` | `position: relative;` |
| `.self-start` | `align-self: flex-start;` |
| `.shrink-0` | `flex-shrink: 0;` |
| `.sr-only` | `position: absolute; width: 1px; height: 1px; padding: 0;` |
| `.text-accent` | `color: var(--accent-ink);` |
| `.text-capitalize` | `text-transform: capitalize;` |
| `.text-center` | `text-align: center;` |
| `.text-error` | `color: var(--color-error);` |
| `.text-left` | `text-align: left;` |
| `.text-muted` | `color: var(--ink-quiet);` |
| `.text-primary` | `color: var(--ink-1);` |
| `.text-primary-light` | `color: var(--accent-ink);` |
| `.text-secondary` | `color: var(--ink-2);` |
| `.text-subtle` | `color: var(--ink-wash-subtle);` |
| `.text-success` | `color: var(--color-success);` |
| `.text-tertiary` | `color: var(--ink-3);` |
| `.text-uppercase` | `text-transform: uppercase;` |
| `.text-warning` | `color: var(--color-warn);` |
| `.text-white` | `color: white;` |
| `.tone-1` | `color: var(--tone-1);` |
| `.tone-2` | `color: var(--tone-2);` |
| `.tone-3` | `color: var(--tone-3);` |
| `.tone-4` | `color: var(--tone-4);` |
| `.tone-5` | `color: var(--tone-5);` |
| `.top-0` | `top: 0;` |
| `.tracking-tight` | `letter-spacing: var(--tracking-tight);` |
| `.tracking-wide` | `letter-spacing: 0.05em;` |
| `.w-full` | `width: 100%;` |
| `.whitespace-nowrap` | `white-space: nowrap;` |

## components.css

Multi-property component patterns: `apps/frontend/src/styles/components.css`. 16 classes.

| Class | First declarations |
| --- | --- |
| `.alert-error` | `background: color-mix(in srgb, var(--color-error) calc(var(--status-tint) * 100%), transparent); border: 1px solid var(--edge-danger); borde` |
| `.alert-info` | `background: var(--status-info-bg); border: 1px solid var(--status-info-border); border-radius: var(--radius-md);` |
| `.alert-success` | `background: color-mix(in srgb, var(--color-success) calc(var(--status-tint) * 100%), transparent); border: 1px solid var(--color-success); b` |
| `.alert-warning` | `background: color-mix(in srgb, var(--color-warn) calc(var(--status-tint) * 100%), transparent); border: 1px solid var(--color-warn); border-` |
| `.btn-base` | `border-radius: var(--radius-md); border: 1px solid transparent; font-size: 1em; font-weight: var(--fw-500);` |
| `.btn-close` | `position: absolute; background: transparent; border: none; color: var(--ink-3);` |
| `.btn-icon-circle` | `width: 22px; height: 22px; background: var(--surface-light-8); color: var(--ink-2);` |
| `.card-interactive` | `background: var(--card); border: 1px solid var(--hairline); border-radius: var(--radius-md); cursor: pointer;` |
| `.card-raised` | `background: var(--card); border: 1px solid var(--hairline); border-radius: var(--radius-md);` |
| `.custom-scrollbar` | `width: 6px;` |
| `.hover-lift` | `transition: transform var(--transition-fast), box-shadow var(--transition-fast);` |
| `.hover-lift-md` | `transition: transform var(--transition-fast), box-shadow var(--transition-fast);` |
| `.hover-lift-sm` | `transition: transform var(--transition-fast), box-shadow var(--transition-fast);` |
| `.hover-scale` | `transition: transform var(--transition-fast);` |
| `.input-base` | `background: var(--surface-light-5); border: 1px solid var(--hairline); color: var(--ink-1); font-size: var(--font-lg);` |
| `.overlay` | `position: fixed; top: 0; left: 0; right: 0;` |

## animations.css

Keyframes and animation classes: `apps/frontend/src/styles/animations.css`. 7 classes.

| Class | First declarations |
| --- | --- |
| `.animate-fade-in` | `animation: fade-in var(--duration-normal) ease-out;` |
| `.skeleton-loading` | `background: linear-gradient( 90deg, var(--surface-light-5) 0%, var(--surface-light-8) 50%,` |
| `.transition-all` | `transition: all var(--transition-fast);` |
| `.transition-border-color` | `transition: border-color var(--transition-fast);` |
| `.transition-colors` | `transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);` |
| `.transition-transform` | `transition: transform var(--transition-fast);` |
| `.transition-width` | `transition: width var(--transition-normal);` |
