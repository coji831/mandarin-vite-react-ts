---
description: "Use when creating page components or Storybook stories for pages. Covers container-to-feature-component delegation, mocking connected components via MSW in stories, state parity between stories and production, and drift prevention."
applyTo: "apps/frontend/src/pages/**/*.tsx,**/*.stories.tsx"
---

# Storybook-Production Alignment

Prevents visual drift between Storybook-validated UI and the production page after business logic is added.

## Storybook Quick Commands

Use these commands when working with Storybook:

| Command                                                  | Purpose                                                                                    | Port |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| `npm run storybook --workspace=@mandarin/frontend`       | Start Storybook dev server                                                                 | 6006 |
| `npm run build-storybook --workspace=@mandarin/frontend` | Build static Storybook output                                                              | —    |
| `npm run test-storybook --workspace=@mandarin/frontend`  | Run story tests: vitest run --project storybook (via @storybook/addon-vitest), no coverage | —    |

**cwd note:** `storybook` / `test-storybook` / `build-storybook` live in the `@mandarin/frontend` workspace only. The table shows the canonical repo-root command forms with `--workspace=@mandarin/frontend` (as `storybook-checks.yml` does). Running bare `npm run storybook` at the root fails.

### How to View Stories in the Browser

After running `npm run storybook --workspace=@mandarin/frontend`, Storybook opens at `http://localhost:6006`. Use the `open_browser_page` tool to open this URL, then navigate to the story via the sidebar.

Story URLs follow this pattern:

```
http://localhost:6006/?path=/story/pages-dashboard--loading
http://localhost:6006/?path=/story/pages-learn-foundations--pinyin
```

Format: `/?path=/story/<lowercased-title-with-hyphens>--<story-export-name-lowercased>`

### Available Decorators

All defined in `.storybook/decorators/`:

- `withAppLayout(path)` — wraps story in full AppLayout with sidebar
- `withLearnLayout` — wraps story in LearnLayout with pill tabs
- `withGuestAuth` — overrides auth context to unauthenticated mode

### How to Verify a Story

1. Run `npm run storybook --workspace=@mandarin/frontend` (keep running in background)
2. Open `http://localhost:6006` in the browser
3. Navigate to the story via the sidebar or direct URL
4. Verify all visual states render correctly (default, loading, error, empty)
5. For page stories, verify the full layout chain is applied via decorators

## CDD Process Flow (Component-Driven Development)

This instruction enforces the **Component-Driven Development (CDD)** workflow — an industry-standard methodology used by Airbnb, BBC, Shopify, Microsoft, and others (see [componentdriven.org](https://componentdriven.org/)).

Follow these phases **in order**:

### Phase A: Design

Consume or create the design spec. Define layout, states, tokens.  
**Output:** Design reference (Figma, sketch, or `docs/design.md`)

### Phase B: UI Build

Build the page as a **container component** (`*Page.tsx`) that:

- Defines the layout, state handling, and data requirements
- Delegates rendering to **feature-level components** (`features/*/components/`)
- Feature components receive data via props only — no hooks, no API calls
- Business logic hooks are imported directly into the container
  **Output:** `*Page.tsx` + any new feature components

### Phase C: Storybook

Create stories targeting the container `*Page.tsx` covering ALL visual states:

- Default (happy path — API returns data)
- Loading
- Error (with retry)
- Empty / No Data
- Edge cases (long text, boundary values)

**Use MSW (Mock Service Worker) to simulate API responses for each state.**
**Use decorators (`withAppLayout`, `withLearnLayout`) to provide layout context.**

❌ No business logic in stories (no hooks, no API calls, no router)
❌ No `*PageContent.tsx` split needed — the container itself IS the story target

**Gate:** Stories are reviewed against the design. Each page story must include the full layout chain via decorators (e.g., `withAppLayout`) and use `parameters: { layout: "fullscreen" }`. Only once confirmed, proceed to Phase D.

### Phase D: Logic Injection

Add business logic hooks directly into the container (`*Page.tsx`):

- Import and call hooks (`usePhaseGate`, `useRadicals`, etc.)
- Compute derived data from hook results and pass as props to feature components
- Handle ALL the same states that the stories cover (state parity)
  **Stories remain untouched** — MSW handlers simulate the same API responses that hooks will return at runtime.

## 1. Container Delegates to Feature Components

A page container (`*Page.tsx`) contains business logic and delegates rendering to feature-level components.

| Layer                         | Role                   | Contains                                                                 |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `*Page.tsx`                   | **Container**          | Hooks, state management, API calls, routing — renders feature components |
| `features/*/components/*.tsx` | **Feature components** | Receive data via props, zero hooks, zero API calls                       |

### ✅ DO

```tsx
// DashboardPage.tsx — container with business logic
function DashboardPage() {
  const { phaseGate, isLoading: phaseLoading } = usePhaseGate();
  // ... compute derived data ...
  if (phaseLoading) return <LoadingScreen message="Loading..." />;
  if (currentPhase === 1) return <DashboardWelcome userName={user?.displayName} />;
  return <DashboardSections phase={currentPhase} />;
}
```

```tsx
// features/dashboard/components/DashboardWelcome.tsx — feature component, props only
interface DashboardWelcomeProps {
  userName?: string;
}
function DashboardWelcome({ userName }: DashboardWelcomeProps) {
  return <h1>Welcome, {userName}!</h1>;
}
```

### ❌ DON'T

```tsx
// DON'T: Mix business logic with presentation in a single massive component
export function DashboardPage() {
  const { user } = useAuth(); // logic
  const [stats, setStats] = useState(); // logic
  const [isLoading, setIsLoading] = useState(true); // logic
  // JSX mixed with state management
  if (isLoading) return <LoadingScreen />;
  // ...
}
```

## 2. Stories Target Containers with MSW

Storybook stories MUST target the container `*Page.tsx`. Use MSW handlers and decorators to simulate API responses and provide layout context.

### ✅ DO

```tsx
// DashboardPageFull.stories.tsx
import { DashboardPage } from "./DashboardPage";
import { withAppLayout } from "../../../.storybook/decorators";
import { mswHandlers } from "../../../.storybook/msw-handlers";

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  decorators: [withAppLayout("/")],
  parameters: { layout: "fullscreen" },
};

export const Loading: Story = {
  parameters: { msw: { handlers: [mswHandlers.progression.phaseGate()] } },
};
export const Phase1Welcome: Story = {
  parameters: { msw: { handlers: [mswHandlers.progression.phaseGate(1)] } },
};
export const Phase2Active: Story = {
  parameters: { msw: { handlers: [mswHandlers.progression.phaseGate(2)] } },
};
```

### ❌ DON'T

```tsx
// DON'T: Stories target a presentational wrapper
import { DashboardPageContent } from "./DashboardPageContent";
```

### MSW Handler Composition (DRY Mock Data)

Organize MSW handler factories in `.storybook/msw-handlers.ts` so each visual state is expressed with minimal code:

```tsx
// ✅ DO: Composed MSW handlers
export const Default: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.default()] } },
};
export const Empty: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.empty()] } },
};
export const Loading: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.loading()] } },
};
export const Error: Story = {
  parameters: { msw: { handlers: [mswHandlers.radicals.error()] } },
};
```

## 3. State Parity Rule

Every story state (MSW handler variant) MUST have a corresponding code path in the container.

### Story-to-Container Mapping

| Story State             | MSW Handler Produces | Container Must Handle      |
| ----------------------- | -------------------- | -------------------------- |
| `Default` (data loaded) | API returns data     | Hook returns data          |
| `Loading`               | API is pending       | Hook's initial loading     |
| `Error`                 | API returns 500      | Hook catches exception     |
| `Empty` (no data)       | API returns `[]`     | Hook returns empty/default |

### ✅ DO

```tsx
export function DashboardPage() {
  const { stats, isLoading, error, refetch } = useDashboardStats();
  // Each loading/error/empty path maps to an MSW story variant
  if (isLoading) return <LoadingScreen message="Loading..." />;
  if (error) return <ErrorScreen message={error} onRetry={refetch} />;
  if (!stats) return <EmptyState />;
  return <DashboardSections stats={stats} />;
}
```

### ❌ DON'T

```tsx
// Container hardcodes a value, making a story state unreachable
export function DashboardPage() {
  return <DashboardSections stats={someData} />; // No loading/error path
}
```

## 4. Story Organization — Three-Category Hierarchy

Organize all `.stories.tsx` files into exactly **three categories**. No exceptions.

| Category    | Contents                                                                                                                    | Story `title` prefix | File location                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------ |
| **Pages**   | Page-level stories covering full user flows. Feature-specific components are verified through page stories, not standalone. | `"Pages/..."`        | `apps/frontend/src/pages/**/*.stories.tsx`             |
| **Layouts** | App and feature layout components. Layouts are reusable structural wrappers.                                                | `"Layouts/..."`      | `apps/frontend/src/shared/layouts/*.stories.tsx`       |
| **Shared**  | Predefined, reusable UI components from `shared/components/` — Button, Input, Card, Dropdown, etc.                          | `"Shared/..."`       | `apps/frontend/src/shared/components/**/*.stories.tsx` |

### ✅ DO — Page-level stories for feature verification

```tsx
// pages/dashboard/DashboardPageFull.stories.tsx
const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  // ...
};
export const Phase1Welcome: Story = {/* ... */};
export const Phase2Active: Story = {/* ... */};
export const Guest: Story = { decorators: [withGuestAuth] };
```

```tsx
// shared/components/Button.stories.tsx
const meta: Meta<typeof Button> = {
  title: "Shared/Button",
  component: Button,
  // ...
};
```

```tsx
// shared/layouts/AppLayout.stories.tsx
const meta: Meta<typeof AppLayout> = {
  title: "Layouts/AppLayout",
  component: AppLayout,
  // ...
};
```

### ❌ DON'T — Feature-level component stories (anti-patterns)

```tsx
// ❌ features/dashboard/components/DashboardGuest.stories.tsx — covered by Pages/Dashboard > Guest
const meta: Meta<typeof DashboardGuest> = {
  title: "Dashboard/DashboardGuest", // ❌ Wrong category, wrong level
};

// ❌ features/quiz/components/results/PhaseGateBadge.stories.tsx — covered by Pages/Practices/Quiz > GuestResultsPassed/Failed
const meta: Meta<typeof PhaseGateBadge> = {
  title: "Quiz/Results/PhaseGateBadge", // ❌ Feature-level story
};

// ❌ features/quiz/components/QuizCard.stories.tsx — covered by Pages/Practices > GuestMode / Phase1
const meta: Meta<typeof QuizCard> = {
  title: "Quiz/QuizCard", // ❌ Feature-level story
};

// ❌ features/review/components/ReviewPromptCard.stories.tsx — covered by Pages/Practices > GuestMode
const meta: Meta<typeof ReviewPromptCard> = {
  title: "Review/ReviewPromptCard", // ❌ Feature-level story
};
```

---

## 5. Trace to Page Rule

When modifying an existing feature component (in `features/*/components/`):

1. **Identify all page containers** that import this component — search `pages/` for imports
2. **Update the page-level `.stories.tsx` file(s)** to reflect the visual changes made to the sub-component
3. **Verify** the story still renders correctly by opening it in Storybook

### ✅ DO

```tsx
// Before editing features/foundations/components/pinyin/DetailPanel.tsx
// Step 1: Search pages/ for usage → finds pages/learn/FoundationsPage.tsx
// Step 2: Update pages/learn/FoundationsPage.stories.tsx Pinyin story variant
// Step 3: Open Storybook → verify Pinyin story matches new DetailPanel layout
```

### ❌ DON'T

```tsx
// Don't edit a sub-component and leave its page story stale
// Edit DetailPanel.tsx → skip FoundationsPage.stories.tsx →
// Storybook shows old layout while production shows new layout
```

### Rationale

Page-level stories are the visual source of truth. When a sub-component changes, all pages that render it must have their stories updated to match. This prevents visual drift between Storybook and production.

### Exception — Genuinely Reusable Components

If a feature-level component becomes genuinely reusable across multiple features, **move it to `shared/components/` first**, then create its `.stories.tsx` under the `"Shared/..."` prefix.

```tsx
// ✅ DO: Move reusable component first, then add stories
// Step 1: Move from features/quiz/components/QuizCard.tsx → shared/components/QuizCard.tsx
// Step 2: Create shared/components/QuizCard.stories.tsx
const meta: Meta<typeof QuizCard> = {
  title: "Shared/QuizCard",
  component: QuizCard,
};
```

### Rationale

- **CDD alignment** — Stories target containers, not isolated feature parts; this matches the Component-Driven Development methodology described in the CDD Process Flow above.
- **Reduced drift** — When stories test the same containers that production renders, business logic and visual states stay in sync automatically.
- **Fewer files** — Eliminates ~4+ story files per page. States are expressed as story variants, not separate feature-level story files.
- **Industry standard** — Leading Storybook projects (Storybook itself, Chakra UI, Radix UI, Adobe React Spectrum) organize by reusable component library + page-level integration stories.

## 6. Design Confirmation Gate

Before adding any business logic to the container, the Storybook stories must be **confirmed** against the design:

- [ ] All visual states are represented as stories (Default, Loading, Error, Empty, edge cases)
- [ ] Story `title:` follows the three-category hierarchy (`Pages/...`, `Layouts/...`, `Shared/...`)
- [ ] No `.stories.tsx` file exists for feature-level components (`features/*/components/*`)
- [ ] Feature-level component states are verified through the page stories that compose them
- [ ] Each story renders correctly with the `withAppLayout` / `withLearnLayout` decorators
- [ ] Design tokens (colors, spacing, typography) match the design spec
- [ ] Responsive behavior is verified at target breakpoints
- [ ] Accessibility basics are present (ARIA labels, roles, keyboard navigation)

**When confirmed:** Stories become the frozen visual contract. The container must match these states exactly.

**If changes are needed:** Update the container's feature components + stories first, reconfirm, then proceed to logic.

## 7. Post-Logic Verification Checklist

After adding business logic to a container, run this checklist:

- [ ] **Map story states** — For every story/MSW state, trace the container's code path
- [ ] **Verify MSW handlers produce realistic data** — Handler responses must match the API contract
- [ ] **Check for orphaned states** — A story state the container cannot produce is "orphaned"
- [ ] **Screenshot comparison** — Capture production page and compare against Storybook story

## 8. No Business Logic in Stories

Story files must never contain:

- ❌ Hook calls (`useAuth`, `useState`, `useEffect`, custom hooks)
- ❌ API calls (`apiClient.get`, `fetch`)
- ❌ Router imports (`useNavigate`, `useLocation`, `useParams`)
- ❌ State management (`useStore`, `dispatch`)

### ✅ DO

```tsx
export const Default: Story = {
  parameters: { msw: { handlers: [mswHandlers.dashboard.default()] } },
};
export const Loading: Story = {
  parameters: { msw: { handlers: [mswHandlers.dashboard.loading()] } },
};
export const Error: Story = {
  parameters: { msw: { handlers: [mswHandlers.dashboard.error()] } },
};
```

### ❌ DON'T

```tsx
export const Default: Story = {
  render: () => {
    const { user } = useAuth(); // ❌ hook in story
    const [data] = useState(); // ❌ state in story
  },
};
```

## 9. Story Test Isolation

`localStorage` and module singletons **leak between stories** — state written by one story
survives into the next and corrupts the render. Real case: `localStorage.treeMode` persisted
by a phonetic-tree story leaked into radical-tree stories, so a story rendered the wrong tree.

Rule:

- Reset `localStorage` (and any module-level singletons the component reads/writes) in a
  per-story `beforeEach` so every story starts deterministic.
- Use a factory helper instead of repeating raw `localStorage` calls:
  ```tsx
  function treeModeBeforeEach(mode: "radical" | "phonetic") {
    return async () => {
      localStorage.setItem("treeMode", mode);
    };
  }
  // meta/stories use: beforeEach: treeModeBeforeEach("radical")
  ```
- ❌ Never rely on story execution order to "clean up" after itself.

## 10. Drift Detection During Code Review

When reviewing a PR that touches page files:

1. Verify stories target the container `*Page.tsx`, not a presentational wrapper
2. Check that MSW handlers exist for every visual state (Loading, Default, Error, Empty)
3. Check that every story state has a corresponding container code path
4. Flag any `error={null}` or `isLoading={false}` hardcodings in container that orphan a story state
5. Verify the MSW handler responses match the shape expected by the container's hooks

## 11. Which Components Get Stories (Decision Table)

This decision table is the **source of truth** for which component gets a story
and at which target. It formalizes the three-category hierarchy in §4 and is
machine-checkable via the registry contract below.

| Category                  | Story rule                                                                                                                                               | Target                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Pages/*`                 | Every page container `*Page.tsx` gets one `<Name>Full.stories.tsx` (all states, MSW)                                                                     | `*Page.tsx` — never a `*PageContent.tsx` split         |
| `Layouts/*`               | Every real layout gets a story rendering the ACTUAL layout via provider decorators                                                                       | real `AppLayout` / `LearnLayout` — no inline stand-ins |
| `Shared/*`                | Every shared component in `component-registry.json` gets its own `.stories.tsx`                                                                          | the component                                          |
| `features/*/components/*` | NO individual stories — feature components are exercised via their page-container story. Reusable candidates must graduate to `shared/components/` first | —                                                      |

### Registry Contract (machine-checkable)

Every shared component in `.github/component-registry.json` must carry a
`storybook` block:

```jsonc
"storybook": { "storyFile": "<repo-relative path to .stories.tsx>", "states": ["variant-catalog", "default", "loading", "error", "empty", "disabled", "edge"] }
```

- `storyFile` — repo-relative path to the component's `.stories.tsx`.
- `states` — the visual states the story file must expose; pick tokens from the
  Canonical STATE MATRIX (§12) that apply to the component.
- **Enforced by** `scripts/check-registry-stories.mjs` and the frontend-audit
  skill. A registry entry without a `storybook` block — or with a `storyFile`
  that does not exist, or `states` the story file does not expose — fails the check.

## 12. Canonical STATE MATRIX (Required States)

This section is the **source of truth** for which visual states every story
surface must expose. It complements the story→container mapping in §3, the
three-category rules in §4, and the story-who decision table in §11.

### Required States by Surface

| Surface                            | Required states                                                                                    | Mechanism                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| Page containers                    | Default + Loading + Error + Empty (+ edge where the container has one)                             | MSW only                   |
| Layouts                            | Authenticated / guest + active-route (sidebar/pill) variants                                       | provider decorators        |
| Shared presentational (props-only) | Variant catalog (`AllVariants`) + component-relevant states (disabled/loading/empty if they exist) | props; no MSW              |
| Shared stateful (hooks/context)    | Default / Loading / Error / Empty                                                                  | MSW or provider decorators |

### State Parity Rule (normative)

Extends the mapping in §3 to be **bidirectional**:

- Every story state MUST have a corresponding real container code path.
- Every container code path that renders a distinct visual state MUST have a
  corresponding story state. The only escapes are the explicit exemptions below
  and states annotated as exempt in the story file.

### MSW-Only Rule for Page Containers

- Page-container story states are simulated with **MSW only**.
- Store-injection (Zustand `setState` in a story) is **prohibited** for
  simulating API-data states (default/loading/error/empty).
- Store/context injection is allowed ONLY inside decorators, and only for
  context (auth/guest, layout) — never for data-fetch states.

### Static-Page Exemption Clause

- A page container that performs NO initial data fetch on mount may ship a
  **Default-only** story; justify the exemption in the story file.
- Any page that fetches on mount MUST have Default/Loading/Error/Empty.
- Approved exemption list:
  - `LoginPage`, `RegisterPage` (form pages, no initial fetch) — **EXEMPT** (Default-only).
  - `LibraryPage`, `ProgressPage` (fetch on mount) — **REQUIRE** full states.

### No-Business-Logic Rule (enforces §8)

- Stories must not define parallel implementations (e.g. inline wrappers that
  re-implement a container's hooks/effects) to reach a state a container code
  path already produces.
- Business/timing behavior belongs in **integration tests** (see
  `testing-standards.instructions.md`), not in stories.

### KNOWN DEFERRED EXCEPTIONS (tech debt — migration deferred)

The following existing `Features/...` story files violate the decision table in
§11. Their migration into page-container stories is **DEFERRED** by decision —
they are flagged as tech debt:

- `features/radicals/components/RadicalHub.stories.tsx`
- `features/character-hub/components/CharacterHub/CharacterHub.stories.tsx`
- `features/lexical-hub/components/LexicalHubRouter.stories.tsx`

❌ **No NEW `Features/...` story files may be added.** New feature surfaces are
exercised via their page-container story (see §11).

---

**See also:** `frontend-visual-design-protocol.instructions.md` (design pipeline) • `frontend-pre-delivery-checklist.instructions.md` (UI gate) • `project-workflow.instructions.md` (commit gates)
