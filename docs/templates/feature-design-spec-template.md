# Feature: [Feature Name] — Design Spec

**Last Updated:** YYYY-MM-DD
**Status:** Draft / Reviewed / Approved

---

## Storybook Reference

- **Shared components used:** [List components from `shared/components/index.tsx`]
- **Feature stories:** [Storybook story titles, e.g., `Features/Auth/LoginForm`]
- **Last Verified:** YYYY-MM-DD

---

## Layout

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| Page structure    | [e.g., header / sidebar / main / footer] |
| Max content width | [e.g., 1200px]                           |
| Grid system       | [e.g., 12-column grid, gap 24px]         |
| Breakpoints       | 320px, 768px, 1024px                     |

---

## Components

| Component        | Source                     | Notes                          |
| ---------------- | -------------------------- | ------------------------------ |
| [Component name] | `shared/components/Button` | Reuse with `variant="primary"` |
| [Component name] | Custom in `components/`    | New component, described below |
| ...              |                            |                                |

### Custom Component: [Name]

**Props:**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| ...  |      |         |             |

**States:** Default / Hover / Active / Disabled / Error / Loading

---

## Design Tokens Used

### Colors

| Token        | CSS Variable           | Figma Value | Notes |
| ------------ | ---------------------- | ----------- | ----- |
| Primary      | `--color-primary`      | `#4A90D9`   |       |
| Surface BG   | `--color-bg-surface`   | `#FFFFFF`   |       |
| Text Primary | `--color-text-primary` | `#1A1A2E`   |       |
| ...          |                        |             |       |

### Spacing

| Token           | CSS Variable   | Value |
| --------------- | -------------- | ----- |
| Section padding | `--spacing-lg` | 24px  |
| Card gap        | `--spacing-md` | 16px  |
| ...             |                |       |

### Typography

| Element   | CSS Variable       | Size | Weight | Line Height |
| --------- | ------------------ | ---- | ------ | ----------- |
| Heading 1 | `--font-size-h1`   | 32px | 700    | 1.2         |
| Body      | `--font-size-body` | 16px | 400    | 1.5         |
| ...       |                    |      |        |             |

### Shadows / Borders

| Token         | CSS Variable    | Value                       |
| ------------- | --------------- | --------------------------- |
| Card shadow   | `--shadow-card` | `0 2px 8px rgba(0,0,0,0.1)` |
| Border radius | `--radius-md`   | 8px                         |
| ...           |                 |                             |

---

## Visual Acceptance Criteria

- [ ] Layout matches Figma frame dimensions and structure
- [ ] All colors match design tokens (no hardcoded hex values)
- [ ] All components reuse shared components where applicable
- [ ] Responsive layout works at 320px, 768px, 1024px
- [ ] WCAG AA contrast ratios maintained
- [ ] Proper ARIA labels on all interactive elements
- [ ] Loading, empty, and error states accounted for
- [ ] Verified via Playwright browser screenshot
- [ ] Storybook story created with all visual states

---

## References

- **Visual Design Workflow:** `docs/guides/visual-design-workflow.md` — step-by-step agent operations
- **Figma Token Mapping:** `docs/guides/figma-token-mapping.md` — exact Figma→CSS mappings
- **Design Tokens:** `DESIGN.md` — canonical token reference
- **CSS Variables:** `apps/frontend/src/styles/globals.css` — `:root {}` definitions
- **Shared Components:** `apps/frontend/src/shared/components/index.tsx` — barrel file
- **Component Decomposition:** `.github/skills/component-decomposition/SKILL.md` — hierarchy rules
