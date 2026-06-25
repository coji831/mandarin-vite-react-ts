---
name: frontend-audit
description: "Run this skill when auditing frontend code. Covers CSS tokens, shared component reuse, API client rules, barrel files, store placement, accessibility, responsiveness, memoization, timer edge cases, console leftovers, and wireframe alignment."
user-invocable: true
---

# Frontend Audit Skill

## When to Use

- After implementing a frontend feature (self-audit by Frontend Engineer)
- During code review (Code Reviewer checking frontend changes)
- Before closing a story that touches UI components
- When debugging UI quality issues

## Always Check (in order of priority)

1. **Hardcoded CSS values** — any color, spacing, or typography value that should be a CSS variable (`var(--)`) or utility class? Use `DESIGN.md` tokens and `globals.css` classes.

2. **Shared component reuse** — any reimplementation of Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser instead of importing from `@/shared/components`?

3. **Direct apiClient calls** — any hook/component calling `apiClient.get/post/etc` directly instead of through a service layer?

4. **Store placement** — any store file inside a `components/` directory instead of `stores/`?

5. **Barrel files** — any `index.ts` defining types/constants/logic inline instead of re-exporting?

6. **CSS import bypass** — any `// eslint-disable-next-line no-restricted-imports` comment to bypass CSS import restrictions?

7. **Global CSS bleed** — component styles leaking via global `button`/`input`/`select` resets?

8. **Loading/error/empty states** — do async data-fetching components have timeout, retry, or proper loading/error/empty state transitions instead of "Loading..." indefinitely?

9. **React.memo gaps** — are frequently re-rendering components (ReviewCard, TonePairDrills, ToneChangeRules) missing `React.memo`?

10. **Responsive layout** — do grid layouts use `auto-fill`/`minmax` for responsiveness?

11. **Accessibility** — do interactive elements have `role`, `aria-label`, `tabIndex`, and keyboard handlers?

12. **Console.\* leftovers** — any debug `console.log`/`console.warn`/`console.error` still in production code?

13. **Wireframe alignment** — does the component structure match the expected card/section layout pattern from the design?

14. **Timer edge cases** — countdown timers must have an explicit "time's up" state transition, not silently stop

15. **Debounce edge cases** — auto-submit inputs must account for multi-syllable input (longer debounce or explicit submit button)

## Output Format

- Group findings by file path
- For each: file, description, severity (HIGH/MEDIUM/LOW), suggested fix
- End with summary: X violations found (Y high, Z medium)
