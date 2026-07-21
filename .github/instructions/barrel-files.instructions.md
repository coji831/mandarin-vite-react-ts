---
description: "Use when editing barrel (index.ts) files. Barrels must only re-export — never define types, constants, or logic inline."
applyTo: "**/index.ts"
---

# Barrel File Rules

## How To Create a Barrel (Numbered Steps)

1. **Check if the symbol needs a barrel export** — Is this a public symbol used outside the module? If yes, it needs a barrel re-export. If it's internal-only, skip the barrel.
2. **Create the symbol in its proper file** — Never define types, constants, or logic directly in `index.ts`. Create: `types/myTypes.ts`, `constants.ts`, `utils/helpers.ts`, then re-export.
3. **Add the re-export** — Add `export { Symbol } from "./path/to/file";` or `export type { Type } from "./path/to/types";`
4. **Verify** — Run `npm run lint` — the `no-restricted-imports` rule catches barrel bypasses. Run `grep -n "^export (interface|type|const|function)" **/index.ts` to confirm no inline definitions.

```typescript
// Step 3 example: features/myfeature/index.ts
export { MyComponent } from "./components/MyComponent"; // From component file
export { useMyHook } from "./hooks/useMyHook"; // From hook file
export type { MyType } from "./types/myTypes"; // From types file (re-export)
```

## ❌ Inline Definitions (Don't)

```typescript
// ❌ BAD — Types/constants defined inline in barrel
export interface MyType { id: string; name: string; }
export const CONSTANT = "value";
export function helper() { ... }
```

## Import Rule (Consumers)

Files outside the barrel directory MUST import shared components through the barrel, NOT through direct file paths. The ESLint `no-restricted-imports` rule enforces this.
---

**See also:** `frontend-api-client.instructions.md` • `testing-standards.instructions.md`

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
