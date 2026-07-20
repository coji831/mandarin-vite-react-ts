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

## Import Rule (Consumers)

Files outside the barrel directory MUST import shared components through the barrel, NOT through direct file paths.

### ✅ DO

```typescript
// Import from barrel — single source of truth
import { Button, LoadingScreen, ErrorScreen } from "shared/components";
import { Card } from "../shared/components";
```

### ❌ DON'T

```typescript
// Direct file path bypasses barrel
import { LoadingScreen } from "../shared/components/LoadingScreen/LoadingScreen";
import { ErrorScreen } from "../shared/components/ErrorScreen/ErrorScreen";
```

## Reasoning

Barrel files exist as a single entry point for a module. Bypassing them with direct file paths:

1. Circumvents the barrel's versioning and re-export logic
2. Makes refactoring harder (moving a component requires updating all import paths)
3. Creates inconsistency — some imports use the barrel, others don't
4. Bypasses any lint rules or transforms configured on the barrel
