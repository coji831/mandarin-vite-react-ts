---
description: "Use when editing barrel (index.ts) files. Barrels must only re-export — never define types, constants, or logic inline."
applyTo: "**/index.ts"
---

# Barrel File Rules

## Rule

Barrel files (`index.ts`) must ONLY re-export symbols from other modules. They must NEVER define types, constants, functions, or any logic inline.

## ✅ DO

```typescript
// features/myfeature/index.ts — Only re-exports
export { MyComponent } from "./components/MyComponent";
export { useMyHook } from "./hooks/useMyHook";
export type { MyType } from "./types/myTypes";
```

## ❌ DON'T

```typescript
// ❌ BAD — Types defined inline in barrel
export interface MyType { id: string; name: string; }
export const CONSTANT = "value";
export function helper() { ... }
```

## If you have types/constants

1. Create dedicated file: `types/myTypes.ts`, `constants.ts`
2. Export from there
3. Re-export through barrel: `export type { MyType } from './types/myTypes';`
