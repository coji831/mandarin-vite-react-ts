---
purpose: "Enable design decision-making — not just _what_ tokens exist, but _why_ and _when_ to use them"
status: active
last-verified: 2026-08-18
type: design
audience: agents
---

# PinyinPal Design Reasoning Guide

**Last Updated:** 2026-08-18  
**Audience:** AI Coding Agents  
**Purpose:** Enable design decision-making — not just _what_ tokens exist, but _why_ and _when_ to use them.

> **How to use this file:** Read it at the start of any UI task. It replaces guesswork with ground rules. If you make a non-obvious design choice, add an ADR entry (see Appendix).

---

## 0. UI Paradigm & Consistency (Focus-First)

**PinyinPal is a Focus-First app — a dual-mode consumer learning app.** Every minute the user is either **(a) choosing the next session (Browse)** or **(b) inside a session (Focus)**; there is no third kind of moment. The page archetype library in `docs/guides/design/page-archetypes.md` is the structural contract that makes consistency _by construction_: a finite set of named page skeletons, and every page is a parameterization of one archetype. The dual-mode rule, the 5 non-negotiables, the mode/page table, and all 8 archetype YAML blocks live there — read it before designing any page.

### Token Freeze (standing rule)

**New design tokens are only added via the `DESIGN.md` + `globals.css` + `design-audit` ADR path** (gates #8/#9 in `project-workflow.instructions.md` enforce token parity — this makes the rule explicit). Concretely:

- A new token must land in **both** `DESIGN.md` (spec) and `apps/frontend/src/styles/globals.css` (CSS var) — parity.
- It must pass `npx @google/design.md lint DESIGN.md` and `npm run design-audit`.
- It must be recorded as an ADR (see ADR-005). Never add a token unilaterally inside a feature.
- **No runtime theming** — direction exploration is pre-commit design selection only (see ADR-001: dark mode is a single identity); never build a runtime theme/accent switcher.

### Token change procedure

**Adding a new token** (see Token Freeze above — the ADR/gate path is mandatory):

1. Identify the gap (new color, spacing, etc.).
2. Add it to the `DESIGN.md` tokens section **and** the matching CSS variable in `apps/frontend/src/styles/globals.css` `:root` — parity.
3. Run `npx @google/design.md lint DESIGN.md` and `npm run design-audit`.
4. Check Storybook — all existing components still render correctly; add/update a story that showcases the new token.

**Modifying an existing token** — ⚠️ a changed value affects **every** component that uses it:

1. Grep all usages of the CSS variable across the project before changing.
2. Verify the new value works in ALL contexts (buttons, cards, icons, …).
3. Update `DESIGN.md` first, then `globals.css`.
4. Run Storybook → visually check ALL components using that token.
5. Run `npx @google/design.md lint DESIGN.md`.

> Folded from the retired `visual-design-workflow.md` (§1.3–1.4) in the 2026-08-18 tree-map N1 cleanup; its story/component rules were superseded by `storybook-production-alignment.instructions.md` + `frontend-css-styling.instructions.md` + `component-registry.json`.

### External Borrowing Protocol (patterns only — never code)

PinyinPal borrows **patterns and principles** from external sources, re-expressed in PinyinPal tokens + registry components through an explicit protocol. Never import code wholesale; import the _why_:

1. **Extract** — state the principle in one sentence, free of the source's visual language (e.g. "the rating decision must cost <1s and one glance").
2. **Translate** — map it onto `DESIGN.md`/`globals.css` tokens (`--space-*`, `--font-*`, `--color-*`) + registry components (`Button variant='rating-again/good/easy'`, `Card`, `ProgressBar`) — "none invented".
3. **Register + story + test + a11y** — if the pattern needs a new shared component, it takes the exact internal path: `component-registry.json` entry + story + states + tests + a11y.
4. **Gate** — `design-audit` · `check:registry-stories` · `check:page-inventory` · `test-storybook` · addon-a11y · pre-delivery · user preview. Record the borrow's origin in the design spec's `provenance:` field (`per-epic-design-spec.md`).

**Eligibility filter:** a borrow must map onto an existing archetype's anatomy/CTA-slot/composition map (or it forces an _archetype change_ = a bigger decision) and serve a Browse or Focus moment — anything that straddles or invents a third mode is rejected.

### Curated external-borrow shortlist

| Source                                   | Mine (the _why_)                                                                                                           | Reject                                               | PinyinPal landing                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Duolingo**                             | Session structure — one micro-task per screen, progress at top, next-action always visible; the retention loop             | Confetti, streak celebrations, mascot, candy palette | `focus-task` anatomy (progress → task → rating → next) — largely owned by `ReviewView` |
| **Anki**                                 | Rating-decision ergonomics — decisions must cost <1s and one glance                                                        | Bare utilitarian chrome                              | `ReviewView`'s `rating-again/good/easy` cluster                                        |
| **Quizlet / Memrise**                    | Study-mode switching; mnemonic + example pairing with the target                                                           | Busy layouts, gamification noise                     | `MnemonicCard` + library mode switching (`browse-index`)                               |
| **HelloChinese / Skritter**              | Consumer Chinese session flow; stroke-practice pacing (same domain as `CharacterStrokePlayer`/`AnimationCanvas`)           | Gamified candy aesthetics                            | practice-session pacing for epics 26/28/36                                             |
| **Pleco**                                | Word-detail _information hierarchy_ (a pure utility)                                                                       | —                                                    | word-hub / `ContentBrowser` detail layout                                              |
| **LingQ / Readlang**                     | Tap-word-to-reveal reading interaction                                                                                     | —                                                    | the readers feature's reading-detail surface                                           |
| **Linear / Stripe**                      | **Quality bar only**: focus-visible rings, hover/press states, empty states with a next step, microcopy, skeleton fidelity | Enterprise layout, density, command-bar chrome       | the polish bar applied to _every_ page                                                 |
| **shadcn/ui**                            | Component _API ergonomics_ (compound/controlled patterns) + the open-code registry model (which PinyinPal already mirrors) | Its Tailwind styling                                 | registry + component API design                                                        |
| **Radix**                                | **a11y behavioral specs** — focus management, keyboard nav, ARIA patterns                                                  | Its code (unless vendored via ADR)                   | the a11y checklists for `Modal`/`Dropdown`/`Tabs`                                      |
| **Material 3 / Apple HIG / Carbon docs** | Documentation _model_: per-component states, elevation, usage guidance                                                     | Their visual language                                | enriching the archetype YAML blocks + registry entries                                 |

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

### ADR-005: Token Freeze

**Date:** 2026-08-17  
**Context:** The design system's tokens (`--color-*`, `--space-*`, `--font-*`, `--surface-*`, `--shadow-*`) are 1:1 CSS variables enforced by `DESIGN.md ↔ globals.css` parity + `design-audit`. Generated/feature UI drifts by inventing ad hoc colors, spacing, or shadows, which silently re-opens the "many random colors" slop and the "AI glow" adjacency.  
**Decision:** New design tokens are added only through the `DESIGN.md` + `globals.css` + `design-audit` ADR path — recorded in an ADR, landed in both files in the same change, and gated by gates #8/#9. No runtime theming; direction exploration is pre-commit selection only, and the winner becomes the _only_ identity.  
**Rationale:** Theme-lock makes token discipline the single remaining valve against visual divergence. Explicitly freezing the token surface (with a clear addition path) prevents "exploration" that quietly becomes permanent random accents.  
**Consequences:** Any new token need must be raised via an ADR before it lands. Feature code must never introduce raw color/spacing/type values; the forbiddance list in §6 stands. `--shadow-xp-glow` is XP-completion-only; amber shadows (`--shadow-md/lg`) are restricted to elevated/hover surfaces only (glow restraint).

> **ADR-006** lives in its own file: [`docs/guides/adr/data-tiering-architecture.md`](../adr/data-tiering-architecture.md).

### ADR-007: North-Star Visual Identity (precision-minimal)

**Date:** 2026-08-18  
**Status:** Ratified (owner vote, 2026-08-18 — Wave-1 UIUX; previously pending)  
**Context:** Warm Minimalism was defined, but the two north-star exemplars (ReviewView = focus-task, DashboardPage = hub-launcher) were canonized by choice, never measured; resting Browse surfaces used the amber-tinted `--shadow-md/lg` (glow family), creating an "amber glow adjacency" on surfaces meant to read as neutral; the amber budget (≤1 filled amber per viewport) was policy prose only, enforced nowhere.  
**Decision:** Ratify the precision-minimal north-star identity: (a) a neutral elevation shadow family `--shadow-elevated-1/2/3` for all resting Browse surfaces; (b) `--surface-border-subtle` hairline on every elevated surface (elevation-no-hairline rule); (c) amber `--shadow-md/lg` + `--shadow-xp-glow` restricted to hover-lift feedback and XP-completion only (the Amber Restriction); (d) a single shared typography role map (DESIGN.md § Typography Role Map); (e) the saturation budget — ≤1 filled saturated element per viewport, extended to all hues (Q10). North-star exemplars are validated by the 8-gate canonization protocol, not declared.  
**Rationale:** Vercel-refined precision-minimalism keeps the content-first focus, removes the glow adjacency from resting surfaces, and makes "north star" a measured claim (rubric + a11y + visual baseline + owner sign-off) instead of a chosen one.  
**Consequences:** Resting amber shadows are forbidden (hover/XP only); new pages are built and reviewed against the exemplars; exemplar retro-validation is recorded in `verification-artifacts/northstar-canonization-review.md`; Vercel joins the curated external-borrow shortlist (quality-bar row, alongside Linear/Stripe).

### ADR-008: Text-Role Contrast Tiers

**Date:** 2026-08-18  
**Status:** Ratified (owner vote — Q4)  
**Context:** The `--text-*` ladder was a relative opacity scale (0.95/0.85/0.7/0.5/0.2/0.05) unverified against `--surface-dark` (#262321). `text-muted` (0.5 white) was used for information-bearing body meta in many features and likely landed ~3.5–4:1 → failed WCAG small-text AA. WCAG 2.2 SC 1.4.3 explicitly covers placeholder text, so a "placeholder-exempt" tier was not available.  
**Decision:** Reclassify text into **role tiers** — `text-primary`/`text-secondary` = body (≥4.5:1); `text-muted` = information-bearing meta, **bumped to ≥4.5:1** (`rgba(255,255,255,0.6)` ≈ 6.5:1 on `--surface-dark`); `text-subtle`/`text-ghost` = **decorative-only + large**, never placeholder text. Placeholder text must use `muted` (≥4.5:1).  
**Rationale:** Contrast is a token-pair property; every information-bearing text must meet AA. A small decorative-only tier is exempt by role (audited per usage), preserving the faint-text affordance where it carries no meaning.  
**Consequences:** Existing `text-subtle`/`text-ghost` usages are re-audited (decorative vs. information-bearing); the axe gate on `<Page>Full` stories (non-blocking → hard) enforces it; `text-muted` is now AA-safe.

### ADR-009: Fluid Display Type Scale

**Date:** 2026-08-18  
**Status:** Ratified (owner vote — Q5)  
**Context:** The typography scale was 10 fixed sizes (12–48px) with no shared role map (per-feature tables in `radicals`/`review`/`quiz` `docs/design.md`); hardcoded `line-height`/`font-weight` literals still slipped through (no audit rule); fixed-rem display sizes overflowed or shrank awkwardly at viewport extremes.  
**Decision:** Display tiers `--font-3xl..6xl` become **fluid `clamp()` values** (names stable, values scale with the viewport — Utopia-style). Consolidate the per-feature type tables into **one shared role map** in DESIGN.md § Typography Role Map (display/h1/h2/body/meta/micro → `--font-*` + `--lh-*` + `--fw-*` + `--tracking-tight` on Latin display). Line-height and font-weight must come from the `--lh-*` / `--fw-*` ladders. Pruning the 10-size ladder to ~6–7 role-mapped sizes is a **follow-up** (audit actual usage first — ADR-gated, do not silently delete).  
**Rationale:** Fluid display scales hold legibility across viewports; role-mapped weights (`fw-800` hero / `700` display / `600` semibold / `500` medium / `400` body) replace ad-hoc literals and match Polaris-style discipline.  
**Consequences:** `design-audit` gains `hardcoded-line-height` / `hardcoded-font-weight` error rules (Wave 1b FE); `--lh-1` / `--lh-1-3` / `--lh-1-4` legacy tiers are retained for existing surfaces only.

### ADR-010: Vibrancy Amplification (Tier 0/1)

**Date:** 2026-08-18  
**Status:** Ratified (owner vote — Q8/Q9/Q10)  
**Context:** Emoji served as the app's icon system (SideNav nav items, Review header, GuestUpsell); the gradient set was frozen at `--gradient-primary/success`; saturated fills (blue/green/purple) sat outside the amber budget with no check; no `Icon` component or icon contract existed.  
**Decision:** (Q8) Ship a **Lucide-wrapped `Icon` shared component** — `currentColor`, 1.5px stroke, 16–24px, `aria-hidden` when decorative, `role="img"` + `title` when meaningful; **emoji forbidden once a surface is covered**. (Q9) Sanction **gradient additions** (accent-underlay on the focal card + data-viz gradients) behind the existing whitelist; data-viz carries labels/values. (Q10) **≤1 filled saturated element per viewport** (all hues) as advisory + rubric, hardened later. Depth-via-color; motion stays consistent (transitions only).  
**Rationale:** A concentrated saturated accent + depth-via-color replaces decorative chrome while preserving precision-minimalism; Lucide is ISC/tree-shakable and keeps the icon set consistent and accessible.  
**Consequences:** FE implements `Icon/` and adds the `lucide-react` dependency (Tier 0); emoji migrates surface-by-surface in the same change as coverage; the saturation budget is advisory + rubric today, hard gate later; gradient additions stay behind the token/whitelist path (ADR-005).

### Wave-1 UIUX ratification (2026-08-18)

**Status:** Ratified (owner vote — all 12 Qs as recommended). This file anchors the ratified decisions in the committed tree (see `.github/decision-log.json` entries `UIUX-Q1..Q12` + `UIUX-W1`).

| Q#  | Decision (owner-confirmed 2026-08-18)                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Visual regression — **Chromatic free tier** (Visual Tests addon, CI on `push`, TurboSnap after 10 builds)                                      |
| Q2  | **Radix primitives at epic 31**; no `useFocusTrap` extraction now; a11y gate covers current Modal/Dropdown (deferred — epic-31-gated)          |
| Q3  | a11y-gate scope — `<Page>Full` + registered `Full` states; fix-first `'todo'` markers; `runOnly` → WCAG 2.2; Chromatic a11y = regression layer |
| Q4  | **Text ladder** — `text-muted` ≥4.5:1, decorative-only tier documented, placeholders ≥4.5:1 (**ADR-008**)                                      |
| Q5  | **Type ladder** — ~6–7 role-mapped sizes + fluid `clamp()` display tiers (**ADR-009**); audit usage first                                      |
| Q6  | Epic-close consistency snapshot — DW runs/records; CR reviews; template ships now; Owner signs at close                                        |
| Q7  | Visual QA loop — baseline evidence = Chromatic accept history; Playwright = supported fallback only                                            |
| Q8  | **Lucide-wrapped `Icon` component**; ban emoji fallback once covered (**ADR-010**)                                                             |
| Q9  | Gradient additions via the Vibrancy ADR, behind the whitelist (**ADR-010**)                                                                    |
| Q10 | ≤1 filled saturated element per viewport (all hues) — advisory + rubric now (**ADR-007/010**)                                                  |
| Q11 | Retro-validation — keep 2 exemplars (ReviewView, DashboardPage); browse-index canonization at epic 36/37                                       |
| Q12 | Baseline acceptance — routine PR diffs self-accept; exemplar baselines + canonization + quarterly = Owner preview + sign-off                   |
