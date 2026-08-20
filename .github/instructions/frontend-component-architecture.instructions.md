---
description: "Use when building or refactoring React components. Covers state colocation, logic placement (hooks/services/stores), and the three-layer component hierarchy."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Component Architecture Conventions

The always-on ruleset for **where state lives**, **where logic runs**, **how JSX is decomposed**, **how the design system stays in sync**, and **how barrels/stores are structured** — the companion to the `frontend-audit` skill (procedure) and `frontend-css-styling.instructions.md` (styling). Read before writing or refactoring any `.tsx` component.

## How To Decide (Numbered Steps)

1. **Where does the state live?** → [State-Aware](#state-aware) — colocate, compute, URL, store-scope
2. **Where does the logic run?** → [Logic-Aware](#logic-aware) — render projection vs handlers vs hooks/services/stores
3. **How many layers?** → [Hierarchy-Aware](#hierarchy-aware) — thin container → feature components → shared primitives

---

## State-Aware

### Colocate state with usage (closest common ancestor)

- ✅ Lift state only when **≥2 siblings share it**. `QuizResults` and `CategoryBreakdown` share the attempt's `answers`/`score`: both read them from the feature-scoped `quizSessionStore` on the results screen — nothing is lifted to a global store.
- ❌ Hoisting per-screen state "just in case" — lift to the closest common ancestor, not to the top.

### Minimal / derivable state — compute, don't store

- ✅ `CategoryBreakdown` computes `useBackend` (`categoryBreakdown != null && (total ?? 0) > 0`) and `denominator` inline from props — never stored in state.
- ❌ Storing a derived value (`pct`) in state and syncing it with `answers` — derive it in render: `const pct = total > 0 ? Math.round((correct / total) * 100) : 0`.

### Server / data state — services + `use()`/Suspense; never `useEffect`-fetch for new code

- ✅ Data fetching is wrapped in a hook over the service layer, never inline in JSX: `usePassages` calls `passageService.fetchPassages()`; `usePassageDetail` calls `passageService.fetchPassageDetail(id)`.
- ❌ `useEffect(() => { apiClient.get(...) }, [])` fetch inside a new component — put it behind a service + hook; prefer `use()`/Suspense for new data flows.

### URL-as-state for shareable / filterable state

- ✅ Use `useSearchParamState` so views are deep-linkable and reload-safe: `FoundationsPage` (`?tab=`), `RadicalsPage` (`?view=trees&mode=phonetic`), `QuizPage`/`ReviewPage` (`?type=`, `?filter=`).
- ❌ Resetting a selected tab/filter to default on reload instead of syncing it to the URL.

### Global store ONLY for cross-cutting state

- ✅ Cross-cutting state lives in `shared/store/`: `useUserStore` (userId/preferences), `useUiStore` (loading/error/selected list), device identity.
- ❌ Per-screen state in a global store — `useQuizSessionStore` (quiz) and `useReadingStore` (readers) stay feature-scoped in `features/<name>/stores/`; never put them in `uiStore`.

## Logic-Aware

### JSX is a pure projection

- ✅ Render only computes and projects state → JSX (e.g. `CategoryBreakdown` maps `answers` to bars).
- ❌ Fetching or mutating during render — `saveProgress()` or `fetchPassages()` inside JSX.

### Side effects in event handlers; `useEffect` is last resort

- ✅ `onClick={handleAnswer}` → `useQuizSessionStore.getState().submitAnswer(...)`.
- ❌ A `useEffect` for work that belongs in a click handler or an explicit action.

### Reusable stateful behavior → custom hook

- ✅ `usePhaseGate` (phase gating), `useAudioManager` (audio orchestration), `useSearchParamState` (URL state) — shared hooks in `shared/hooks/`.
- ❌ Copy-pasting the same `useState` + `useEffect` block across components.

### Stateless domain/API → service

- ✅ `passageService` (`fetchPassages`, `fetchPassageDetail`, `fetchPassageAudio`, `generatePassage`), `wordService` (`loadWordData`, `loadMeasureWords`) — the service layer owns HTTP.
- ❌ Calling `apiClient` directly from a component — see `frontend-api-client.instructions.md`.

### Cross-subtree shared state → store

- ✅ `useQuizSessionStore`, `useReadingStore` — feature Zustand stores in `features/<name>/stores/`.

### Complex flows → reducer/reducer+context or store with explicit actions

- ✅ `quizSessionStore` exposes named actions (`submitAnswer`, `retry`) — components dispatch actions, never raw state mutations.

## Hierarchy-Aware

### Three layers: thin page container → feature components → shared primitives

| Layer                   | Location                          | Responsibility                                                                                             |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Thin page container** | `src/pages/`                      | Route target; minimal JSX (≤ ~100 lines); delegates to feature components (`QuizPage` → `QuizSessionPage`) |
| **Feature components**  | `src/features/<name>/components/` | Domain compositions + feature-aware logic/state (`CategoryBreakdown`, `ReadingView`)                       |
| **Shared primitives**   | `src/shared/components/`          | Framework-agnostic primitives — `Button`, `Box`, `ProgressBar`; never feature-specific                     |

- **One concern per level.** Pages compose only; features own domain logic; shared primitives stay generic. No feature logic in `shared/`, no raw-HTML soup in a page.

### Named `XxxProps` for >2 props

- ✅ `CategoryBreakdownProps`, `ProgressBarProps`, `QuizProgressBarProps`.
- ❌ An inline destructure `{ label, correct, total, color }` on a component with 3+ props — name the type.

### Data down / `onXxx` up; composition over prop-drilling

- ✅ Pass data via props, surface events via callbacks. When props pass through unchanged, compose (the feature component renders the shared primitive itself) instead of threading them through.

### Extract at ~50–80 JSX lines / new state / props-that-change-together

- ✅ `CategoryBar` is extracted inside `CategoryBreakdown` — it owns the single bar's `label`/`correct`/`total`/`color` rendering.
- ❌ Letting a file under `components/` drift past ~250 lines — the `large-component` audit advisory fires as a decomposition prompt.

### A new shared primitive requires registry + story + test

- ✅ Register it in `.github/component-registry.json`, write a Storybook story, add a test — per the Design-System Drift rule below + `storybook-production-alignment.instructions.md`.
- ❌ Adding a component to `src/shared/components/` without a registry entry, story, or test.

### Compose via sub-parts — Props Down, Events Up, never parent-injected styles

- ✅ Compose a complex surface from sub-parts: the parent owns data + events (`onXxx` callbacks); each sub-part owns its own internals (state, DOM, styling). Pass data down, surface events up.
- ❌ Parent-injected styles into a child's internals — styling a child's internal element from the parent's CSS (parent-prefixed selectors like `.parent .child__part`) couples the child's DOM to the parent and breaks as soon as the child refactors. Style it inside the child; extend via a prop or a new variant (see `frontend-css-styling.instructions.md` — never override shared components via CSS cascade).

### Progressive disclosure — advanced options behind a reveal

- ✅ The default view shows the focused task + primary path; advanced options (settings, filters, secondary modes) live behind a reveal (expand/collapse, settings panel), never stacked on the shell. This is the rubric's per-page cognitive-load criterion.
- ❌ Every option on the surface at once — it raises working memory and dilutes the primary CTA (Hick's law).

### ≤3 nesting depth + the squint test

- ✅ Keep the composition tree ≤3 levels deep (thin page container → feature component → shared primitive; a shared primitive may contain its own small sub-parts).
- ✅ **Squint test** — blur/zoom-out the rendered page: the top 3 visible elements must be the intended hierarchy. If not, hierarchy is wrong (weight/color over size; depth sparingly). Rubric per-page squint criterion.

### Vibrancy & hierarchy note

- **≤1 filled saturated element per viewport.** Amber and all saturated fills (XP gold `--color-xp`, status blue/green/purple) are for interaction affordances only — active nav, selected filter, primary CTA, progress fill at 100%, streak/XP moments. One filled saturated element per viewport, max; beyond that, demote to borders/neutral elevation instead of adding more color (rubric one-CLA / warm-minimalism).

## Design-System Drift Prevention

> Folded in from the retired `design-system-drift.instructions.md`. Applies when editing shared components, `DESIGN.md`, or `component-registry.json`.

**Rule:** any change to a shared component's public API (props, variants, file path) or the design token set must be reflected in both `DESIGN.md` and `.github/component-registry.json` **in the same commit**.

### When to update `.github/component-registry.json`

- **New component** added to `shared/components/index.tsx` → add an entry with `importPath: "shared/components"`, description, all public props
- **New prop / renamed / removed prop** → add / update / remove the prop entry
- **Variant values changed** → update the `values` array
- **Component removed** → remove the entry

Entry format — always verify it matches the actual TypeScript type definition, do not guess:

```json
"ComponentName": {
  "description": "One-sentence purpose.",
  "importPath": "shared/components",
  "props": {
    "propName": { "type": "typeString", "required": true, "description": "Optional detail" },
    "optionalProp": { "type": "enum", "values": ["a", "b"], "default": "a" }
  }
}
```

### When to update `DESIGN.md`

- **`components:` list** — new shared component / behavior changed / file path changed / removed → add / update / remove the `- name`, `file`, `description` entry
- **`tokens:` section** — new CSS custom property in `:root`, token removed/renamed, or token value changed in `apps/frontend/src/styles/globals.css` → update; the token values in `DESIGN.md` must match the `var(--*)` values in `globals.css` **exactly**

## Barrel File Rules

> Folded in from the retired `barrel-files.instructions.md`. Applies to `**/index.ts`.

**Rule:** `index.ts` files **re-export only** — never define types, constants, or logic inline.

1. **Check if the symbol needs a barrel export** — a public symbol used outside the module needs a re-export; internal-only symbols skip the barrel.
2. **Create the symbol in its proper file** — `types/myTypes.ts`, `constants.ts`, `utils/helpers.ts`, then re-export from the barrel.
3. **Add the re-export** — `export { Symbol } from "./path/to/file";` or `export type { Type } from "./path/to/types";`
4. **Verify** — `npm run lint` (the `no-restricted-imports` rule catches barrel bypasses); `grep -n "^export (interface|type|const|function)" **/index.ts` confirms no inline definitions.

```typescript
// ✅ DO — re-export from the source file
import { MyComponent } from "./components/MyComponent";
export { MyComponent };
export type { MyType } from "./types/myTypes";

// ❌ BAD — types/constants/logic defined inline in the barrel
export interface MyType {
  id: string;
}
export const CONSTANT = "value";
```

**Import rule (consumers):** files outside the barrel directory MUST import through the barrel, never through direct file paths — `import { Button } from "shared/components"` (✅), never `import { Button } from "../shared/components/Button/Button"` (❌).

## Store Placement Rules

> Folded in from the retired `store-placement.instructions.md`. Applies to `**/store/*.ts`, `**/stores/*.ts`, `**/components/**/hubStore*`.

1. **Determine the scope** — state used by a single feature → `features/<name>/stores/`; cross-cutting (multiple features) → `shared/store/`.
2. **Decide the store type** — **Zustand** for global state shared across components (user, UI theme, hub); **Context + `useReducer`** for feature-specific state with complex transitions (quiz session, review flow); **local `useState`/`useReducer`** for state used only within one component.
3. **Create the store file** — `features/<name>/stores/<name>Store.ts` or `shared/store/<name>Store.ts`.
4. **Export from the barrel** — add the re-export in the feature's `index.ts` or `shared/store/index.ts`.
5. **Verify** — the store file is NOT inside a `components/` directory (`ls -d **/components/**/*Store*` should be empty).

```text
shared/store/hubStore.ts                    ✅ cross-cutting store
features/quiz/stores/quizSessionStore.ts    ✅ feature-specific store
shared/components/CharacterDetailHub/hubStore.ts  ❌ store inside components/
```

## Cross-References

- `.github/component-registry.json` — the allowed shared-component catalog
- `DESIGN.md` — design tokens
- `docs/guides/design/page-archetypes.md` — page-level structure
- `docs/guides/design/uiux-fundamentals.md` — the 12 fundamentals + AI-slop checklist
- `docs/guides/conventions/state-management.md` — stores, reducers, selectors
- `frontend-css-styling.instructions.md` — styling + inline-style rules
- `.github/skills/frontend-audit/SKILL.md` — the audit/decomposition procedure
