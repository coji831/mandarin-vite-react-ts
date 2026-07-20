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

2. **Shared component reuse** — any reimplementation of Button, Input, LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, or ContentBrowser instead of importing from `shared/components`?

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

16. **Visual drift (trace to page)** — For any modified feature component (in `features/*/components/`):
    - Was the corresponding page-level `.stories.tsx` file updated to reflect the changes?
    - Search `pages/` for imports of the modified component
    - If found, verify the page story was also updated
    - Severity: HIGH if a modified feature component has no corresponding page story update

17. **Visual drift (Storybook vs production)** — For any page-level changes:
    - Open the Storybook page story in browser
    - Open the production page in browser
    - **Wait for both to fully render** (loading spinners must resolve)
    - Verify both are showing the **same state**: compare loading↔loading, error↔error, data↔data — never compare a loading state to a data state
    - **Verify data parity**: compare visible content — same number of rows/columns/cards/items? If Storybook shows 12 columns and production shows 5, flag it as a data source mismatch
    - Compare screenshots: is the layout, spacing, colors, and component structure consistent?
    - Severity: HIGH if visual discrepancies found between Storybook and production
    - Severity: MEDIUM if data content differs significantly (different dataset sizes)

18. **Visual overflow** — after rendering in the browser, check container boundaries:
    - For any element with dynamic content, evaluate `scrollWidth > clientWidth` or `scrollHeight > clientHeight`
    - Look for text clipping, content spilling outside parent borders, or horizontal scrollbars on containers that shouldn't scroll
    - Pay special attention to: animated/staggered content, dynamically loaded sections, and responsive breakpoints
    - Severity: HIGH if content is clipped or spills outside its visible container
    - Severity: MEDIUM if horizontal overflow creates unexpected scrollbars

19. **Component patterns in globals.css** — any multi-property component pattern (`.btn-*`, `.input-*`, `.card-*`, `.alert-*`, `.overlay`, `.hover-*`, `.progress-*`) defined in `globals.css` instead of `styles/components.css`? Only single-property utilities belong in `globals.css`.

20. **Utility duplication** — run `npm run design-audit` to detect local CSS that duplicates global utility classes without a clarifying comment.

21. **Layout hierarchy & spacing** — evaluate the rendered layout against the design system:
    - Identify the primary focal point (CTA, main heading). Is it visually dominant (larger, brighter, bolder)?
    - Check that spacing between sibling sections uses consistent `gap-*` or `var(--space-*)` tokens — no raw `margin` values
    - Verify the content-to-edge padding on cards/panels matches the `Box` variant's token (e.g. `padding="md"` → `var(--space-md)`)
    - Check for "visual noise": are there competing elements that fight for attention without clear hierarchy?
    - Severity: MEDIUM if spacing uses raw values instead of tokens
    - Severity: LOW if hierarchy is present but could be clearer

## Output Format

- Group findings by file path
- For each: file, description, severity (HIGH/MEDIUM/LOW), suggested fix
- End with summary: X violations found (Y high, Z medium)
