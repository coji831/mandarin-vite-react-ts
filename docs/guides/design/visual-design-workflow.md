# Visual Design Workflow — Agent Operations Guide

**Last Updated:** 2026-08-02
**Audience:** AI Coding Agents (GitHub Copilot)
**Purpose:** Concrete, repeatable workflows for designing UI with Storybook as the single source of truth: (1) define tokens in DESIGN.md, (2) build shared components with Storybook stories, (3) compose feature pages, and (4) verify via Playwright screenshots.

> ⚠️ **SUPERSEDED for story rules** by `.github/instructions/storybook-production-alignment.instructions.md`.
> The 3-category rule (Pages/Layouts/Shared) overrides "every component has a `.stories.tsx`";
> feature-component stories (`Features/...`) are **PROHIBITED**. This file is kept for its
> non-story workflow content (e.g. token-change procedure).

> ⚠️ **SUPERSEDED for component selection & styling** — Component selection and styling
> conventions are authoritative in `.github/instructions/frontend-css-styling.instructions.md`.
> The component catalog is `.github/component-registry.json` + `DESIGN.md` (NOT the stale
> catalog in §2.1 below). This file is retained only for the §1.3–1.4 token-change procedure.

---

## Quick Reference: Decision Tree

```
User asks for a UI feature
│
├─ STEP 1: Define tokens in DESIGN.md
│   ├─ Choose colors → update DESIGN.md → update globals.css
│   └─ Run `npx @google/design.md lint DESIGN.md`
│
├─ STEP 2: Build in Storybook
│   ├─ Check shared components first (barrel: shared/components/index.tsx)
│   ├─ Missing component? Create it in shared/components/ with .stories.tsx
│   ├─ Existing component? Create story variant for new use case
│   └─ Write Storybook story covering ALL visual states
│
├─ STEP 3: Compose feature pages
│   ├─ Compose shared components into feature components
│   ├─ Implement with CSS variables only (never hardcoded values)
│   └─ Verify through the page-container story (no standalone Features/... stories)
│
└─ STEP 4: Verify & maintain
    ├─ Screenshot via Playwright → compare to Storybook stories
    ├─ Run `npx @google/design.md lint DESIGN.md`
    ├─ Audit: grep for hardcoded colors (#, rgb() without var())
    └─ Run story tests: `npm run test-storybook`
```

---

## Part 1: Design Tokens — The Foundation

### 1.1 Source of Truth Hierarchy

```
┌──────────────────────────────────────────────────┐
│  DESIGN.md  ←  HUMAN-AUTHORITATIVE               │
│  Canonical list of ALL design tokens.             │
│  What gets linted. What the agent references.     │
├──────────────────────────────────────────────────┤
│  apps/frontend/src/styles/globals.css             │
│  CSS variable definitions + utility classes.      │
│  What the browser actually uses.                  │
├──────────────────────────────────────────────────┤
│  Shared Component CSS + Storybook stories         │
│  Storybook IS the visual source of truth.         │
│  Stories: Shared/ + Pages/ + Layouts/ only        │
│  (see storybook-production-alignment rule)        │
├──────────────────────────────────────────────────┤
│  Feature Component CSS files                      │
│  Use CSS variables + shared component patterns.   │
└──────────────────────────────────────────────────┘
```

### 1.2 Token Reference

| Category       | CSS Variable Pattern                    | DESIGN.md Section         |
| -------------- | --------------------------------------- | ------------------------- |
| Primary action | `var(--color-primary)`                  | `tokens.colors.primary`   |
| Background     | `var(--surface-dark)`                   | `tokens.colors.surface`   |
| Card border    | `var(--surface-border)`                 | `tokens.colors.surface`   |
| Primary text   | `var(--text-primary)`                   | `tokens.colors.text`      |
| Spacing        | `var(--space-xs)` through `--space-2xl` | `tokens.spacing`          |
| Border radius  | `var(--radius-sm/md/lg/pill)`           | `tokens.radii`            |
| Shadow         | `var(--shadow-sm/md/lg)`                | `tokens.shadows`          |
| Font size      | `var(--font-xs)` through `--font-5xl`   | `tokens.typography.sizes` |
| Gradient       | `var(--gradient-primary/success)`       | `tokens.gradients`        |
| Transition     | `var(--transition-fast/normal)`         | `tokens.transitions`      |

### 1.3 Adding a New Token

```
1. Identify the gap (new color, spacing, etc.)
2. Add to DESIGN.md tokens section
3. Add CSS variable to globals.css :root section
4. Run lint: npx @google/design.md lint DESIGN.md
5. Check Storybook: ALL existing components still look correct
6. Update any stories that should showcase the new token
```

### 1.4 Modifying an Existing Token

⚠️ **DANGER:** Changing a token value affects EVERY component that uses it.

```
BEFORE changing:
1. grep_search for all usages of the CSS variable across the project
2. Verify the new value works in ALL contexts (buttons, cards, icons, etc.)
3. Update DESIGN.md first, then globals.css
4. Run Storybook → visually check ALL components using that token
5. Run lint: npx @google/design.md lint DESIGN.md
```

---

## Part 2: Components as Design Building Blocks

### 2.1 Shared Component Catalog

| Component        | Variants                                          | When to Use               |
| ---------------- | ------------------------------------------------- | ------------------------- |
| `Button`         | primary, secondary; sm, md, lg; loading, disabled | Any clickable action      |
| `Input`          | text, email, password; error state                | Any form field            |
| `Card`           | Default, WithIcon, WithBadge, Locked, Minimal     | Any card container        |
| `Modal`          | Small, Medium, Large, Interactive                 | Any overlay/dialog        |
| `Tabs`           | Default, ActiveTab, WithLocked, Scrollable        | Tab navigation            |
| `Grid`           | WithItems, Loading, Empty, PaginationStates       | Grid layouts              |
| `SearchInput`    | Empty, WithQuery, CustomPlaceholder               | Search fields             |
| `FilterControls` | Default, WithSelections, Single, ManyFilters      | Filter UI                 |
| `RadioGroup`     | Vertical, Horizontal, WithSelection, WithDisabled | Option selection          |
| `Skeleton`       | Line, Card, Circle, MixedLayout, GridLayout       | Loading placeholders      |
| `LoadingScreen`  | (full-page)                                       | Page-level loading        |
| `ErrorScreen`    | (full-page with retry)                            | Page-level error          |
| `ProgressBar`    | (with celebration animation)                      | Progress indication       |
| `FilterChip`     | (toggleable)                                      | Filter tags               |
| `ToggleSwitch`   | (binary)                                          | On/off toggles            |
| `Dropdown`       | (select menu)                                     | Dropdown selection        |
| `ContentBrowser` | (content navigation)                              | Browsing learning content |

### 2.2 Component Selection Hierarchy

```
Design element (e.g., a submit button)
│
├─ STEP 1: Is there a shared component?
│   Check: shared/components/index.tsx barrel
│   │
│   ├─ YES, exact match → USE IT with variant/size props
│   │   <Button variant="primary" size="md">Submit</Button>
│   │
│   ├─ YES, close match → USE IT with variant/size props;
│   │   extend with new props; NEVER override via CSS cascade
│   │   <Card>...</Card>
│   │
│   └─ NO → Continue to Step 2
│
├─ STEP 2: Is this a feature-specific composition?
│   └─ Create in features/<feature>/components/<Name>.tsx
│      Composed of shared components, not HTML primitives
│
└─ STEP 3: Is this a truly new primitive?
    └─ Create in shared/components/<Name>/ with:
        <Name>.tsx, <Name>.css, <Name>.stories.tsx
```

### 2.3 Storybook Story Pattern

Every component needs a `.stories.tsx` covering ALL visual states:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "@storybook/test";
import { MyComponent } from "./MyComponent";

const meta: Meta<typeof MyComponent> = {
  title: "Shared/MyComponent", // or "Pages/MyPage" or "Layouts/..."
  component: MyComponent,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {}; // ✅ Required
export const Loading: Story = {}; // ✅ If loading state exists
export const Error: Story = {}; // ✅ If error state exists
export const Empty: Story = {}; // ✅ If empty state exists
export const LongContent: Story = {}; // ✅ Edge case
export const AllVariants: Story = {}; // ✅ Visual overview
```

**Storybook title conventions (3-category rule — see `storybook-production-alignment`):**

- Shared components: `"Shared/<ComponentName>"`
- Pages: `"Pages/<PageName>"`
- Layouts: `"Layouts/<LayoutName>"`
- Feature components have NO standalone `Features/...` stories — they are verified through
  their page-container story.

---

## Part 3: Design → Code Verification Flow

### 3.1 The Verification Loop

```
1. Define tokens in DESIGN.md + globals.css
2. Build/update component with Storybook story
3. npm run storybook → visually verify all states
4. Use Playwright to screenshot the rendered page
5. Compare Storybook story vs Playwright screenshot
6. Audit: grep for hardcoded values
7. Run story tests
```

### 3.2 Audit Commands

```bash
# 1. Token integrity
npx @google/design.md lint DESIGN.md

# 2. Find hardcoded colors
grep_search "#[0-9a-fA-F]{3,6}" --includePattern "apps/frontend/src/**/*.css"

# 3. Find hardcoded px spacing (should use --space-*)
grep_search "[0-9]+px" --includePattern "apps/frontend/src/**/components/**/*.css"

# 4. Check for inline styles (often contain hardcoded values)
grep_search "style=\{\{" --includePattern "apps/frontend/src/**/*.tsx"

# 5. Verify all shared components have stories
file_search "apps/frontend/src/shared/components/**/*.stories.tsx"

# 6. Run Storybook tests
npm run test-storybook --workspace=@mandarin/frontend
```

### 3.3 Verification Checklist

- [ ] All colors use CSS variables (no hardcoded hex/rgb)
- [ ] All spacing uses `--space-*` variables
- [ ] All font sizes use `--font-*` variables
- [ ] All shadows use `--shadow-*` variables
- [ ] Shared components reused where possible (no reimplementation)
- [ ] Storybook story covers: default, loading, error, empty, edge cases
- [ ] Responsive at 320px, 768px, 1024px
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on interactive elements

---

## Part 4: Styling Maintenance

### 4.1 CSS File Organization

| File                                       | What Goes There                                                                                                            | What Does NOT Go There                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `globals.css`                              | CSS variables (`:root {}`), single-property utility classes (`.gap-*`, `.p-*`, `.text-*`, `.fw-*`, `.flex-*`, etc.), reset | Component patterns, feature-specific styles |
| `styles/components.css`                    | Multi-property component patterns (`.btn-base`, `.input-base`, `.card-interactive`, `.hover-lift`, `.overlay`, `.alert-*`) | One-off overrides                           |
| `shared/components/<Name>/<Name>.css`      | Styles for that specific shared component                                                                                  | Feature-specific overrides                  |
| `features/<feature>/components/<Name>.css` | Feature-specific component styles                                                                                          | Redefining CSS variables, global resets     |

### 4.2 Commands

| Command                                                 | Purpose                            |
| ------------------------------------------------------- | ---------------------------------- |
| `npm run storybook`                                     | Start Storybook (port 6006)        |
| `npm run test-storybook --workspace=@mandarin/frontend` | Run all Storybook tests            |
| `npx @google/design.md lint DESIGN.md`                  | Validate DESIGN.md token integrity |
| `npm run dev`                                           | Start dev server (port 5173)       |
| `npm run build`                                         | Type-check + bundle                |
| `npm run lint`                                          | ESLint (0 errors required)         |
