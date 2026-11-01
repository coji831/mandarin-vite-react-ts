---
description: "Where React state and logic belong: the three-layer hierarchy, colocation, service and store placement. Read when building or refactoring a component."
applyTo: "apps/frontend/src/**/*.tsx"
---

# Component architecture

## The three layers

| Layer | Location | One job |
| --- | --- | --- |
| Thin page container | `src/pages/` | route target, minimal JSX, delegates to feature components |
| Feature components | `src/features/<name>/components/` | domain composition and feature-aware logic |
| Shared primitives | `src/shared/components/` | generic primitives, never feature-specific |

No feature logic in `shared/`, no raw HTML soup in a page. Props interfaces are named `XxxProps` when a
component takes more than two.

## State: colocate, derive, do not hoist

- Lift state to the **closest common ancestor**, and only when two or more siblings share it.
- **Derive, do not store.** A percentage computed from `answers` is computed in render, never held in
  state and synced.
- Server data goes through a **service called by a hook**: `usePassages` calls
  `passageService.fetchPassages()`. No inline `useEffect` fetch in new code.
- Cross-subtree state goes to a **store**, not to a chain of props.

## Logic: JSX is a pure projection

- Render computes and projects; it never fetches or mutates.
- Side effects live in event handlers. `useEffect` is the last resort, for synchronisation with
  something outside React.
- Reusable stateful behaviour becomes a custom hook in `shared/hooks/`.
- Stateless domain or API work becomes a service.

## Barrels re-export only

`index.ts` files re-export; they never define a type, a constant or logic inline. A consumer outside
the barrel directory imports through the barrel.

**Lint does not catch a bypass.** `no-restricted-imports` matches literal specifiers only, and a
relative-path import walks around it (`apps/frontend/eslint.config.js` says so). Read the import besides
the rule, because nothing else will.

## Store placement

| Scope | Store | Home |
| --- | --- | --- |
| one feature | Zustand, or Context + `useReducer` for complex transitions | `features/<name>/stores/` |
| cross-cutting | Zustand | `shared/store/` |
| one component | `useState` / `useReducer` | in the component |

A store never lives under a `components/` directory. Check: `ls -d **/components/**/*Store*` is empty.

## Token discipline and the design gates

`design-audit:foundation` catches page-scoped layout; a hardcoded value is not gated. See
`frontend-css-styling.instructions.md` for the rule and the CSS prohibitions. Do not restate them here.
