# PinyinPal Design Reasoning Guide

**Last Updated:** 2026-07-18  
**Audience:** AI Coding Agents  
**Purpose:** Enable design decision-making — not just _what_ tokens exist, but _why_ and _when_ to use them.

> **How to use this file:** Read it at the start of any UI task. It replaces guesswork with ground rules. If you make a non-obvious design choice, add an ADR entry (see Appendix).

---

## 1. Style Identity: "Warm Minimalism"

**Definition:** Content-first minimalism with warm amber accents — functional, distraction-free, with a subtle Chinese cultural warmth.

| Attribute         | Value                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Name**          | Warm Minimalism                                                                          |
| **Keywords**      | Clean, functional, warm, amber, dark, content-first, study-focused                       |
| **Mood**          | Grounded, focused, calm — like studying in a warm-lit room                               |
| **Cultural cues** | Amber evokes lantern light, ink stone, earth tones — subtle, not literal                 |
| **Contrast with** | Duolingo (bright green gamification), Pleco (sterile utility), HelloChinese (cartoonish) |

### What Warm Minimalism Means in Practice

- **Flat surfaces** — no glassmorphism, no neumorphism, no heavy gradients
- **Content is king** — the character/word/quiz is the focus, not the chrome
- **Amber as wayfinding** — primary amber used sparingly for CTAs, active states, emphasis
- **Dark mode only** — warm slate backgrounds, never light mode
- **Subtle feedback** — hover lifts (`translateY(-2px)`), color transitions, no bouncy animations
- **Functional decoration only** — borders and subtle backgrounds to define space, not to decorate

### What Warm Minimalism Is NOT

- ❌ Not glassmorphism (no blur/semitransparent layered cards)
- ❌ Not brutalism (no harsh high-contrast blocks)
- ❌ Not AI-Native UI (no glowing gradients or floating orbs)
- ❌ Not playful/cartoonish (no bright colors, no emoji icons, no confetti)
- ❌ Not enterprise-dense (not data-table-overload, but not sparse either)

---

## 2. Business Context

### App Purpose

PinyinPal helps English speakers learn Mandarin Chinese. The app covers:

- **Foundations** — Pinyin initials/finals, tones, stroke order, character animations
- **Quiz modes** — Multiple choice, audio-to-pinyin, IME simulator, radical gate, and more
- **Character Hub** — Detailed character information (readings, radicals, etymology, common words)
- **Review** — Spaced repetition review of learned content

### Target Users

- Adult self-learners (18-40)
- Previous Mandarin exposure: none to intermediate
- Study context: desktop/laptop, dedicated study sessions (not mobile commute)
- Motivation: structured learning, not casual browsing

### Cognitive Load Principle

**Mandarin learning is cognitively demanding.** The UI must reduce cognitive load, not add to it. Every visual element either serves learning or is removed. Users are already juggling:

- Unfamiliar characters (hanzi)
- Unfamiliar sounds (pinyin + tones)
- Unfamiliar grammar patterns

The UI should never ask them to also figure out _how to use the interface_.

### Core UX Drivers

| Driver             | Implication                                                       |
| ------------------ | ----------------------------------------------------------------- |
| **Focus**          | No decorative animations, no auto-playing media, no parallax      |
| **Clarity**        | Correct/incorrect must be unambiguous at a glance (green/red)     |
| **Consistency**    | Same layout patterns across all quiz modes builds muscle memory   |
| **Feedback speed** | Visual feedback within 300ms — the user needs to know immediately |
| **Error recovery** | Clear error messages, obvious retry paths, never dead ends        |

---

## 3. UX Fundamentals (Immutable Rules)

These rules apply to **every** feature, **every** component, **every** screen:

1. **Content is king.** The hanzi/word/pinyin is the largest, most prominent element on the screen. Everything else is secondary.

2. **Dark mode only.** The app uses warm slate backgrounds exclusively. Never add light mode. Rationale: reduced eye strain during study, and a consistent visual identity.

3. **Immediate feedback.** Every user action gets a visible reaction within 300ms. Click → hover/press state. Correct answer → green. Wrong answer → red. Loading → skeleton.

4. **One primary CTA per view.** The user should know instantly what to do next. Don't crowd multiple primary buttons.

5. **No decorative animation.** Animation is for feedback and transition only. Never for ambiance or "delight." Exception: completion celebration on ProgressBar (subtle gradient glow).

6. **Accessibility is not optional.** All interactive elements need aria-labels or accessible names. Color is never the sole indicator (add text/icon). Focus states must be visible.

7. **Data-resilient shells.** Container dimensions must be fixed. Inner content scrolls if it overflows. This prevents layout jumps between Storybook (large mock datasets) and production (variable data).

8. **Consistency over innovation.** Use existing patterns. If a quiz card layout exists, use it for the next quiz mode. Don't reinvent layouts per feature.

---

## 4. Per-Feature Design Rules

### 4.1 Quiz (All Modes)

| Rule                    | Specification                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **Card background**     | `--surface-dark` with `--surface-border`                                                     |
| **No shadows on cards** | Quiz cards are flat — shadows add visual noise during focus                                  |
| **Character glyph**     | `--font-4xl` (32px) minimum, centered                                                        |
| **Question text**       | `--font-lg` (18px), `--text-primary`                                                         |
| **Timer**               | `--font-xl` (20px) bold, `--text-warning` when <5s                                           |
| **Correct feedback**    | Emerald glow: `--color-success` border + `--color-success-bg` background                     |
| **Incorrect feedback**  | Warm red pulse: `--color-error` border + `--color-error-bg` background                       |
| **Phase badge**         | Primary amber for active phase, muted for locked                                             |
| **Audio button**        | Ghost treatment — subtle, not competing with content                                         |
| **Answer input**        | `--surface-light-5` background, `--surface-border` border, focus ring uses `--color-primary` |

**Anti-patterns:**

- ❌ No shadows on quiz cards — flat surfaces only
- ❌ No glass/blur effects in quiz — they break focus
- ❌ No animated transitions between questions — instant swap
- ❌ No confetti/celebration on correct answers — a subtle green glow is enough
- ❌ Don't hide the timer behind styling — keep it visible and readable

### 4.2 Character Hub

| Rule                  | Specification                                                             |
| --------------------- | ------------------------------------------------------------------------- |
| **Container**         | Fixed dimensions (data-resilient shell), inner scroll if needed           |
| **Character display** | Largest element — `--font-5xl` (40px) minimum, centered, `--text-primary` |
| **Readings list**     | Ghost buttons for audio play, `--text-secondary` for pinyin text          |
| **Radical section**   | `--space-md` (16px) padding, subtle border separation                     |
| **Common words**      | Chip-style buttons with `--surface-light-10` background                   |
| **Etymology**         | `--text-tertiary` for descriptive text, smaller font (`--font-sm`)        |
| **Hub modal**         | `--surface-dark-alt` background, `--overlay-dark` backdrop                |

**Anti-patterns:**

- ❌ Don't over-decorate the hub — the character is the star
- ❌ No competing visual elements near the character display
- ❌ Don't use `max-height` on the hub container — use fixed `height`
- ❌ No automatic audio playback — user clicks to hear

### 4.3 Foundations (Pinyin, Tones, Strokes, Animations)

| Rule                  | Specification                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Tab headers**       | Use `Tabs` shared component, active tab uses `--color-primary` border                     |
| **Pinyin grid cells** | `--surface-dark` background, hover shows `--color-primary-bg-medium`                      |
| **Tone cards**        | Tone colors (`--tone-1` through `--tone-5`) for accent only — text stays `--text-primary` |
| **Stroke animations** | Full-width canvas, no competing UI near the stroke area                                   |
| **Section spacing**   | `--space-lg` (24px) between major sections, `--space-md` (16px) between related items     |

**Anti-patterns:**

- ❌ Don't animate tab transitions — instant swap
- ❌ No overlays on the stroke animation canvas
- ❌ Tone colors on backgrounds make text unreadable — use them as accents only

### 4.4 Content Browser (Characters, Words, Radicals)

| Rule               | Specification                                               |
| ------------------ | ----------------------------------------------------------- |
| **List items**     | Consistent height, `--surface-dark` background, hover state |
| **Selected state** | `--color-primary-border` left border indicator              |
| **Search input**   | Standard `Input` shared component                           |
| **Filter chips**   | `FilterChip` shared component, amber when active            |
| **Pagination**     | Use `gap-sm` between page buttons                           |

**Anti-patterns:**

- ❌ No horizontal scroll on list containers
- ❌ Don't mix content types in one list without clear visual separation

### 4.5 Progress & XP

| Rule                    | Specification                                               |
| ----------------------- | ----------------------------------------------------------- |
| **Progress bar**        | `ProgressBar` shared component — success gradient at 100%   |
| **XP display**          | `--color-xp` (#FBBF24) for XP values, `--font-sm` for label |
| **Pass/fail threshold** | Dynamic per strategy — not hardcoded                        |
| **Phase gate badge**    | `PhaseGateBadge` component, amber for pass                  |

**Anti-patterns:**

- ❌ No level-up animations, no particle effects, no fanfare
- ❌ Don't show XP in quiz — only in results/summary screens

---

## 5. Spacing & Layout Rhythm

### 5.1 Page-Level Spacing

| Context                                     | Token        | Value |
| ------------------------------------------- | ------------ | ----- |
| Between major sections                      | `--space-lg` | 24px  |
| Between related items within a section      | `--space-md` | 16px  |
| Between tightly grouped items (tags, chips) | `--space-sm` | 12px  |
| Between very dense items (grid cells)       | `--space-xs` | 8px   |
| Section padding (inside Box containers)     | `--space-md` | 16px  |
| Modal padding                               | `--space-lg` | 24px  |

### 5.2 Component Padding

| Component             | Padding                       | Notes                     |
| --------------------- | ----------------------------- | ------------------------- |
| Card content          | `--space-md` (16px)           | Standard across all cards |
| Dense toolbar/header  | `--space-sm` (12px)           | Tight packing             |
| Page-level containers | `--space-lg` (24px)           | Breathing room            |
| Modal/dialog          | `--space-lg` (24px)           | —                         |
| Chip/tag inner        | `--space-xs` (8px) horizontal | —                         |

### 5.3 Hierarchy Spacing Rule

```
Page section (gap-lg: 24px)
  ├── Section heading
  │
  ├── Subsection (gap-md: 16px from heading)
  │     ├── Content item
  │     └── Content item (gap-sm: 12px between items)
  │
  └── Next section (gap-lg: 24px from previous)
```

**Never use the same gap value at different hierarchy levels.** If sections and items all use `gap-md`, the hierarchy collapses visually.

---

## 6. Common Anti-Patterns (From Past Audits)

These have been caught in previous code reviews. Don't reintroduce them:

| #   | Anti-Pattern                                                         | Why It's Wrong                            | Fix                                                  |
| --- | -------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| 1   | **Hardcoded color** (`#xxx` or `rgba()` in TSX)                      | Breaks theming, can't be updated globally | Use CSS variable (`var(--color-*)`)                  |
| 2   | **Hardcoded spacing** (`gap: 4px`, `padding: 8px` in CSS)            | Inconsistent rhythm, token system ignored | Use `var(--space-*)`                                 |
| 3   | **Dead CSS class** (class in JSX, no definition anywhere)            | Dead code, confusing                      | Remove from JSX, use utilities only                  |
| 4   | **Custom CSS when utilities suffice** (single-property class)        | Bloats CSS files                          | Use utility classes (`gap-sm`, `text-primary`, etc.) |
| 5   | **Missing loading state** (component renders nothing while fetching) | Bad UX, layout jump when data arrives     | Add skeleton matching final dimensions               |
| 6   | **Missing empty state** (blank screen when no data)                  | User thinks app is broken                 | Show message: "No items found"                       |
| 7   | **Missing error state** (crash or console.log on API failure)        | Silent failure                            | Show ErrorScreen or inline error                     |
| 8   | **`console.log` in production code**                                 | Debug artifact                            | Remove before committing                             |
| 9   | **Inline styles** (`style={{...}}`)                                  | Hard to maintain, bypasses tokens         | Use CSS variables + utility classes                  |
| 10  | **Layout-shifting animation** (`animating width/height/top/left`)    | Causes CLS, bad performance               | Use `transform` + `opacity` only                     |
| 11  | **max-height on data container**                                     | Changes size with data — visual drift     | Use fixed `height` with `overflow-y: auto`           |
| 12  | **No aria-label on icon-only button**                                | Inaccessible                              | Add `aria-label="..."`                               |

---

## 7. Token Compliance Rules

### When to Use Which Token

| Need                      | Use                            | Don't Use                                               |
| ------------------------- | ------------------------------ | ------------------------------------------------------- |
| Primary action background | `--color-primary`              | Raw `#b45309`                                           |
| Card background           | `--surface-dark`               | `--surface-dark-alt` (that's for panels)                |
| Page background           | `--surface-dark-alt`           | `--surface-dark`                                        |
| Primary text              | `--text-primary` (95% white)   | `white` or `#fff`                                       |
| Secondary text            | `--text-secondary` (85% white) | `--text-primary` (would be too strong)                  |
| Hover background          | `--surface-hover`              | Manual `rgba()`                                         |
| Border on cards           | `--surface-border`             | `--color-primary-border` (that's for highlighted items) |
| Success feedback          | `--color-success`              | `--color-primary`                                       |
| Error feedback            | `--color-error`                | `--color-warning`                                       |

### Heirarchy of Spacing Tokens

```
Most spacious:  --space-2xl (40px)  — major page section gaps
                 --space-xl  (32px)  — hero/masthead padding
                 --space-lg  (24px)  — between major sections
                 --space-md  (16px)  — card padding, between related items
                 --space-sm  (12px)  — between tightly grouped items
Most compact:    --space-xs  (8px)   — grid cell gaps, chip spacing
```

---

## 8. Animation Philosophy

| Scenario           | Treatment                          | Duration | Easing        |
| ------------------ | ---------------------------------- | -------- | ------------- |
| Button hover       | Lift (`translateY(-2px)`) + shadow | 200ms    | `ease`        |
| Button active      | Return to original position        | 200ms    | `ease`        |
| Modal open         | Fade in overlay + content          | 300ms    | `ease`        |
| Progress fill      | Width transition                   | 300ms    | `ease-in-out` |
| Correct answer     | Green border/bg appear             | 200ms    | `ease`        |
| Incorrect answer   | Red border/bg appear               | 200ms    | `ease`        |
| Page transition    | Instant (no animation)             | 0ms      | —             |
| Tab switch         | Instant (no animation)             | 0ms      | —             |
| Skeleton → content | Instant swap (no crossfade)        | 0ms      | —             |
| Completion (100%)  | Gradient glow + subtle shadow      | 500ms    | `ease-in-out` |

### Animation Rules

- ✅ Use `transform` and `opacity` only — never `width`, `height`, `top`, `left`
- ✅ Respect `prefers-reduced-motion` — disable non-essential animations
- ✅ Keep micro-interactions in the 200-300ms range
- ❌ No staggered animations (items appearing one by one)
- ❌ No parallax, no scroll-triggered animations
- ❌ No spinning loaders — use skeleton or shimmer instead

---

## 9. Accessibility Baseline

| Requirement              | Standard                                                      | How to Verify                           |
| ------------------------ | ------------------------------------------------------------- | --------------------------------------- |
| Text contrast            | ≥4.5:1 for primary, ≥3:1 for large text                       | WCAG AA                                 |
| Focus states             | Visible `outline` or `box-shadow` on all interactive elements | Tab through the page                    |
| aria-labels              | All icon-only buttons, interactive icons                      | Check `<button>` without text content   |
| Screen reader order      | Matches visual order                                          | Use browser DevTools accessibility tree |
| Color independence       | Color is never the sole indicator                             | Check error states, status indicators   |
| `prefers-reduced-motion` | Animations disabled or reduced                                | Test with OS setting enabled            |
| Touch targets            | ≥44×44px for interactive elements                             | Measure in DevTools                     |
| Form labels              | Every input has a visible `<label>` or `aria-label`           | Visual scan                             |

---

## 10. Pre-Delivery Checklist

Before reporting any UI code as complete, verify every item:

### Token & Style Compliance

- [ ] Read this `design-reasoning.md` — does your design align with Warm Minimalism?
- [ ] No hardcoded colors — grep `#([0-9a-f]{3,6})\b` and `rgba(` in new `.tsx` files
- [ ] No hardcoded spacing — check CSS files for `gap:`, `padding:`, `margin:` with raw px values
- [ ] No hardcoded font sizes — check for `font-size:` with raw px
- [ ] Utility class preference — could 3+ utility classes replace a custom CSS class?

### States Coverage

- [ ] Loading state — skeleton matches final content dimensions exactly
- [ ] Empty state — handled with a message, not blank or crash
- [ ] Error state — ErrorScreen or inline error, not console.log
- [ ] Disabled state — visually clear (reduced opacity) and non-interactive

### Interaction

- [ ] All interactive elements have hover/press states
- [ ] All icon-only buttons have `aria-label`
- [ ] Animation uses `transform`/`opacity` only (not `width`/`height`/`top`/`left`)
- [ ] Clickable elements have `cursor: pointer`

### Layout

- [ ] Data-resilient shell — container uses fixed dimensions, inner scroll
- [ ] Verified at 320px, 768px, 1024px
- [ ] No horizontal scroll
- [ ] Spacing hierarchy correct — section gaps > item gaps

### Quality

- [ ] No `console.log`, no commented-out code, no TODO/FIXME comments
- [ ] Storybook story exists for new components (all visual states)
- [ ] `npx @google/design.md lint DESIGN.md` passes
- [ ] No new ESLint warnings or errors
- [ ] Existing tests still pass

---

## Appendix: Design Decision Records (ADR)

### ADR-001: Dark Mode Only — No Light Mode

**Date:** 2026-07-18  
**Context:** Learning app used in low-light study environments. Warm slate palette was chosen for the amber accents to pop.  
**Decision:** Dark theme exclusively — warm slate backgrounds, amber accents on dark.  
**Rationale:** Reduced eye strain during extended study sessions. Consistent visual identity. Amber-on-dark is the signature look.  
**Consequences:** All components must be tested on dark backgrounds only. New color tokens must work on dark surfaces.

### ADR-002: Fixed-Height Data Shells

**Date:** 2026-07-18  
**Context:** Storybook uses curated mock data (often larger datasets); production serves real data (may be smaller). If the component shell changes size based on data, visual drift occurs between environments.  
**Decision:** Container dimensions must be fixed (`height`/`width` on outer container), with inner scroll (`overflow-y: auto`) for overflow.  
**Rationale:** Prevents layout jumps and ensures Storybook verification is reliable against production.  
**Consequences:** Components need to reserve space for maximum expected content. Edge cases with very long text need explicit truncation or scroll handling.

### ADR-003: No Decorative Animation

**Date:** 2026-07-18  
**Context:** A common pattern in learning apps is celebratory animations (confetti, bounce, sparkle) on correct answers.  
**Decision:** Zero decorative animations. Animation is for feedback and transition only.  
**Rationale:** Mandarin learning requires focus. Decorative animations are distracting and add no learning value. The user's reward is learning, not visual stimulation.  
**Consequences:** The exception is the progress bar completion state (subtle gradient glow at 100%) — this is functional feedback, not decoration.

### ADR-004: Quiz Cards Are Flat (No Shadows)

**Date:** 2026-07-18  
**Context:** Earlier quiz implementations used elevated cards with shadows (`--shadow-md`).  
**Decision:** Quiz cards use `--surface-dark` with `--surface-border` — no shadows.  
**Rationale:** Shadows create visual depth that competes with the quiz content for attention. During a quiz, the user should focus on the question, not the card.
