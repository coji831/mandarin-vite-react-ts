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

2. **Shared component reuse** — no reimplementation of any shared component (Button, Input,
   LoadingScreen, ErrorScreen, ProgressBar, FilterChip, ToggleSwitch, ContentBrowser, etc.) instead
   of importing from `shared/components`. A raw native element carrying shared-component classes
   (`btn-*`, `input-*`, `card-*`) is a violation — e.g. a past violation was `<button
className="btn btn-sm btn-outline">` in `features/radicals/` (migrated to
   `<Button variant="secondary" size="sm">` on 2026-08-02). Use the shared `<Button variant size>`
   and extend via new props; never CSS-cascade overrides on shared components. Severity: HIGH.

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

22. **Flex-shrink overflow clip** — any flex item with `overflow: hidden` / dynamic content
    that can be shrunk below its content height (`min-height: auto → 0`)? Growing children need
    `flex-shrink: 0`; there must be ONE unified `flex:1; min-height:0; overflow-y:auto` scroll
    container, not nested per-item `overflow-y:auto`/`max-height`. Severity: HIGH if content is
    clipped (present in DOM but invisible).

23. **Async-enrich / display-data rendering** — for components that enrich fetched data
    (e.g. `displayFamily = enriched ?? raw`), does the render map over the _display_ shape, not
    the raw fetch shape? Severity: HIGH if derived/enriched fields (badges, classification) are
    read from the raw object and therefore never render.

24. **Story test isolation** — do stories that read/write `localStorage` or module singletons
    reset them in a per-story `beforeEach`? Severity: HIGH if one story's persisted state leaks
    into another and changes the rendered output.

25. **State matrix per container** — for page-container stories, verify Default/Loading/Error/Empty
    are ALL present (mocked via MSW), unless the static-page exemption applies (no initial fetch on
    mount — Login/Register are exempt). Library/Progress/Dashboard/Practices require the full state
    set where the code paths exist. Severity: HIGH if a fetching container lacks a state.

26. **Layout stories target the real layout** — page stories must use the real layout component
    (`AppLayout`/`LearnLayout`) as `component:`, not an inline stand-in wrapper. Severity: HIGH if
    a page story renders a hand-rolled layout instead of the shared one.

27. **No `Features/...` stories** — no NEW story files under `features/**` with `Features/...`
    titles. The 3 grandfathered stories (RadicalHub, CharacterHub, LexicalHubRouter) are tracked
    as TD-001..003 in `docs/guides/testing/known-failures.md` — do NOT flag them, do NOT extend
    them; any NEW `Features/...` story is HIGH severity.

28. **MSW-only for page containers** — page-container data states must be mocked via MSW, not
    Zustand store-injection. Store/context injection is allowed ONLY inside decorators for
    auth/guest/layout purposes. Severity: HIGH if a data state is produced by injecting a store
    directly.

29. **No business logic in stories** — stories must not re-implement container hooks/effects in
    inline wrapper components (no home-grown data fetching/state machines inside a story). Stories
    are thin visual shells over real data flow. Severity: HIGH if a story duplicates container
    logic.

30. **Registry storybook metadata** — every shared component declares `storybook.storyFile` (path
    exists on disk) + `states` (non-empty, valid enum). Enforced via **gate 7** in
    `project-workflow.instructions.md` (`npm run check:registry-stories`) — not CI. Severity:
    MEDIUM if metadata is missing/stale; HIGH if the checker fails.

31. **Doc↔code truth-check** — for changed components/features, verify the feature `docs/design.md` +
    BR/impl still match (renamed components reflected, removed behaviors gone, endpoints accurate).
    Severity: HIGH if a doc describes structure that no longer exists.

## Output Format

- Group findings by file path
- For each: file, description, severity (HIGH/MEDIUM/LOW), suggested fix
- End with summary: X violations found (Y high, Z medium)
