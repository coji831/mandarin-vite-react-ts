---
description: "Use when creating or moving state stores (Zustand, Context). Stores must live in stores/ directories, never inside components/."
applyTo: "**/store/*.ts,**/stores/*.ts,**/components/**/hubStore*"
---

# Store Placement Rules

## How To Create a Store (Numbered Steps)

1. **Determine the scope** — Is the state used by a single feature or across multiple features?
   - Single feature → `features/<name>/stores/`
   - Cross-cutting (multiple features) → `shared/store/`
2. **Decide store type** — Use this guide:
   - **Zustand**: Global state shared across components (user, UI theme, hub state)
   - **Context + useReducer**: Feature-specific state with complex transitions (quiz session, review flow)
   - **Local useState/useReducer**: State only used within one component (form inputs, dropdown open/close)
3. **Create the store file** — `features/<name>/stores/<name>Store.ts` or `shared/store/<name>Store.ts`
4. **Export from barrel** — Add re-export in the feature's `index.ts` or `shared/store/index.ts`
5. **Verify** — Confirm the store file is NOT inside a `components/` directory — run `ls -d **/components/**/*Store*` to check

## ✅ DO

```
shared/store/hubStore.ts                    ← cross-cutting store
features/quiz/stores/quizSessionStore.ts    ← feature-specific store
```

## ❌ DON'T

```
shared/components/CharacterDetailHub/hubStore.ts  ← ❌ Store inside components/
features/quiz/components/QuizEngine/quizStore.ts  ← ❌ Store inside components/
```

## Reasoning

- Stores manage state, not UI — components/ is for UI only
- Other features can't import from inside a component folder
- Follows existing patterns: `uiStore.ts`, `userStore.ts`, `listStore.ts` in `shared/store/`

---

**See also:** `frontend-api-client.instructions.md` (service layer) • `testing-standards.instructions.md` (store tests) • `barrel-files.instructions.md` (barrel re-exports)
