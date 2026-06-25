---
description: "Use when creating or moving state stores (Zustand, Context). Stores must live in stores/ directories, never inside components/."
applyTo: "**/store/*.ts,**/stores/*.ts,**/components/**/hubStore*"
---

# Store Placement Rules

## Rule

State stores (Zustand, Context+Reducer) must live in dedicated `stores/` directories:

- Cross-cutting (used by multiple features): `shared/store/<name>Store.ts`
- Feature-specific: `features/<name>/stores/<name>Store.ts`

NEVER place a store inside a `components/` directory.

## ✅ DO

```
shared/store/hubStore.ts              ← cross-cutting store
features/quiz/stores/quizSessionStore.ts  ← feature-specific store
```

## ❌ DON'T

```
shared/components/CharacterDetailHub/hubStore.ts  ← ❌ Store inside components/
```

## Reasoning

- Stores manage state, not UI — placing them in components/ violates separation of concerns
- Other features can't import from inside a component folder
- Follows existing patterns: `uiStore.ts`, `userStore.ts`, `listStore.ts` all in `shared/store/`
