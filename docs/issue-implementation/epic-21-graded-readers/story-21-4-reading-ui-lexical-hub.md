# Implementation 21-4: Reading UI + LexicalHub Phase 1

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-4-reading-ui-lexical-hub.md`

## Technical Scope

Build the entire learner-facing reading experience: ReadersPage, ReaderLibrary, ReadingView, inline WordPopover, generalized hubStore, LexicalHubRouter, and WordHubContent.

**Files:**

- `apps/frontend/src/features/readers/` — Entire feature module (components/, hooks/, services/, stores/, types/, docs/, index.ts)
- `apps/frontend/src/pages/learn/readers/ReadersPage.tsx` — Page container
- `apps/frontend/src/pages/learn/ReadersPageFull.stories.tsx` — Storybook page story
- `apps/frontend/src/router/LearnRoutes.tsx` — Replace ContentPlaceholderPage with ReadersPage
- `apps/frontend/.storybook/msw-handlers.ts` — Add readers handlers (6 levels)
- `apps/frontend/src/shared/store/hubStore.ts` — generalized (was character-only)
- `apps/frontend/src/shared/hooks/useEntityHub.ts` — ~~new (replaces useCharacterHub)~~ **REMOVED during implementation** — consolidated into a single `openHub()` entry point in `shared/hub-entry/hubEntryPoint.ts` (see Post-Implementation Evolution #1)
- `apps/frontend/src/shared/types/hub.ts` — new: EntityType, EntityRef types
- `apps/frontend/src/shared/types/index.ts` — new barrel
- `apps/frontend/src/shared/components/HubEntityCard/` — ~~NEW generalized wrapper. Delegates to HubIdentityCard (character-hub/) for character entities; renders word identity inline for word entities.~~ **REMOVED — dead code (zero consumers), superseded by the entityHub registry** (see Post-Implementation Evolution #5)
- `apps/frontend/src/shared/components/HubProgressActions/` — ~~NEW generalized wrapper. Delegates to HubActions (character-hub/) for character entities.~~ **REMOVED — dead code (zero consumers), superseded by the entityHub registry** (see Post-Implementation Evolution #5)
- `apps/frontend/src/shared/components/HubEntityRelationList/` — ~~NEW generalized wrapper. Delegates to HubCommonWords (character-hub/) for character entities.~~ **REMOVED — dead code (zero consumers), superseded by the entityHub registry** (see Post-Implementation Evolution #5)
- `apps/frontend/src/features/lexical-hub/` — new feature folder
- `apps/frontend/src/features/lexical-hub/components/LexicalHubRouter.tsx` — new
- `apps/frontend/src/features/lexical-hub/components/WordHubContent.tsx` — new
- `apps/frontend/src/features/lexical-hub/components/CharacterHubContent.tsx` — NEW adapter wrapping CharacterHub (NOT a move — see §Issue 2)
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — updated to use LexicalHubRouter

## Implementation Details

### Component Architecture

```
ReadersPage (container)
├── ReaderLibrary (level selector + passage card grid)
│   ├── HSKLevelPills (filter pills)
│   ├── PassageCardGrid (3-col desktop, 2-col tablet, 1-col mobile)
│   └── PassageCard (title, HSK badge, known-word ratio, bookmark indicator)
└── ReadingView (sentence-by-sentence reader)
    ├── SentenceDisplay (highlighted text, pinyin below)
    ├── WordPopover (inline: glyph, pinyin, meaning, "Open in Word Hub" button)
    └── AudioControlBar (play/pause, speed, progress) (from Story 21.5)
```

### hubStore Types

```typescript
type EntityType = "character" | "word" | "radical" | "chengyu" | "grammar" | "phoneticCluster";

interface EntityRef {
  entityType: EntityType;
  entityId: string;
  label?: string;
}

interface HubState {
  isOpen: boolean;
  currentEntity: EntityRef | null;
  navigationStack: EntityRef[];
  context?: string; // e.g., passageId where this was opened
}
```

### Backward Compatibility

- `useEntityHub().openHub(glyph, pinyin)` still works for all existing CharacterHub callers via the legacy `open` overload
- `HubEntityCard`, `HubProgressActions`, `HubEntityRelationList` are ~~**new** shared components — they do not replace or rename existing `HubIdentityCard`, `HubActions`, `HubCommonWords`~~ — **NOTE: all three were later removed as dead code during implementation; see Post-Implementation Evolution #5**
- `CharacterHub` stays in `features/character-hub/components/CharacterHub/` — existing imports from `features/character-hub/components` continue to work
- `CharacterHubContent` is a new adapter in `features/lexical-hub/` — only consumed by `LexicalHubRouter`
- No backward-compat barrel re-exports needed at the old `features/character-hub/` location
- No regressions in radical, quiz, or other features using CharacterHub

### LexicalHubRouter

Thin router that checks `entityType` and renders the correct content component:

- `word` → `WordHubContent`
- `character` → `CharacterHubContent`
- `radical` → `RadicalHubContent` (existing)
- Default: `CharacterHubContent`

### Storybook/MSW

- MSW handlers for all 6 HSK levels
- Stories covering: loading (skeleton), empty (CTA), error (retry), populated (real data)
- Page-level story: `ReadersPageFull.stories.tsx`
- Component-level stories for all child components

## Architecture Integration

```
[Story 21.4: Reading UI + LexicalHub Phase 1]
├── ReadersPage → feature/readers/
├── LexicalHub → feature/lexical-hub/
│   ├── LexicalHubRouter
│   ├── WordHubContent (new)
│   └── CharacterHubContent (adapter → CharacterHub in character-hub/)
├── Shared → hubStore (generalized), openHub()/closeHub() (shared/hub-entry), entityHubRegistry
├── Services → apiClient → Story 21.3 backend API
```

## Technical Challenges & Solutions

```
Problem: LexicalHub must remain backward-compatible with existing useCharacterHub callers while generalizing to support Word, Character, and Radical entity types.
Solution: Create a generalized hubStore with entityType, entityId, context, and navigationStack. Wrap the existing useCharacterHub API surface as a backward-compatible adapter that delegates to the new store.
```

## Architecture Review Clarifications

### §Issue 1: Component Refactoring Ambiguity — HubEntityCard / HubProgressActions / HubEntityRelationList

**Decision:** These are **new generalized wrapper components** in `shared/components/`, NOT refactored/renamed versions of the existing character-hub components.

Each wrapper composes entity-type-agnostic presentation logic while delegating entity-specific rendering to the existing character-hub components:

| New Shared Component    | For character entities, delegates to                 | For word entities                                        |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `HubEntityCard`         | `HubIdentityCard` (passes `entityId` as `character`) | Renders word identity (glyph, pinyin, definition) inline |
| `HubProgressActions`    | `HubActions` (passes `entityId` as `character`)      | Renders entity-agnostic action buttons                   |
| `HubEntityRelationList` | `HubCommonWords` (passes glyph from entity)          | Renders relations from word API data                     |

**Why not refactor existing components?** `HubIdentityCard`, `HubActions`, and `HubCommonWords` are tightly coupled to `useCharacterDetail(character)` and `character: string` props. Refactoring them to be entity-type-agnostic would create high-risk changes across established epic-19/20 code. The wrapper pattern keeps existing code stable while providing the generalized surface LexicalHubRouter needs.

**How to implement:**

1. Create each wrapper in `shared/components/<Name>/<Name>.tsx` with its own CSS
2. Accept `EntityRef` as primary prop
3. For `entityType === "character"`: import and delegate to the corresponding character-hub component
4. For `entityType === "word"`: render equivalent content using word-entity API data
5. Export from `shared/components/index.tsx`

### Post-Implementation Evolution

The following architectural changes were made during implementation that differ from the original design:

1. **`useEntityHub` hook removed** — Instead of creating a convenience hook wrapper, the architecture consolidated to a single `openHub()` entry point in `shared/hub-entry/hubEntryPoint.ts`. Consumers call `openHub(entityRef)` directly. This eliminated an unnecessary abstraction layer.

2. **`CharacterHubContent` adapter eliminated** — Instead of creating a thin adapter in `features/lexical-hub/`, `CharacterHub` was refactored to accept `EntityHubProps` (`entityId`/`entityLabel`) directly. Both `WordHub` and `CharacterHub` now share the same normalized props interface, enabling direct use in the registry without any adapter.

3. **Pure routing LexicalHubRouter** — Refactored from a `switch` statement to an exhaustive `Record<EntityType, ComponentType<EntityHubProps>>` registry (`entityHubRegistry.tsx`) with `React.lazy()` for code-splitting. TypeScript errors at compile time if a new `EntityType` is added without a handler.

4. **hubStore simplified** — `openExternal`/`navigateTo`/`pushNavigation`/`popNavigation` consolidated to a single `open(entityRef, resetStack)` + `back()` pattern. The public API is `openHub()`/`closeHub()` from `shared/hub-entry`.

5. **Dead wrappers removed** — `HubEntityCard`, `HubEntityRelationList`, `HubProgressActions` were deleted as dead code (zero consumers). The registry pattern superseded their role.

6. **`characterData` prop removed** — MSW handlers now provide mock data for Storybook stories, eliminating the need for the `characterData` prop on `CharacterHub`.

7. **`CharacterHubEntityAdapter` eliminated** — `CharacterHub` now accepts `EntityHubProps` directly. `onClose` removed from props — defaults to `hubStore.close()` internally.

---

### §Issue 2: CharacterHubContent Move — Import Breakage Risk

**Decision:** Keep `CharacterHub` **in its original location** at `features/character-hub/components/CharacterHub/CharacterHub.tsx`. Create `CharacterHubContent` as a **new thin adapter** at `features/lexical-hub/components/CharacterHubContent.tsx`.

**Why NOT move:** Moving `CharacterHub` would break the existing import in `AppLayout.tsx` (`import { CharacterHub } from "features/character-hub/components"`) and any other references throughout the codebase. Backward-compat barrel re-exports at the old location add indirection and confusion.

**Adapter pattern for `CharacterHubContent.tsx`:**

```typescript
import { useHubStore } from "shared/store";
import { CharacterHub } from "features/character-hub/components";

export function CharacterHubContent() {
  const { currentEntity, close } = useHubStore();

  if (!currentEntity || currentEntity.entityType !== "character") return null;

  return (
    <CharacterHub
      character={currentEntity.entityId}
      pinyin={currentEntity.label ?? null}
      onClose={close}
    />
  );
}
```

**Zero import breakage:** All existing imports from `features/character-hub/components` and `features/character-hub` remain valid. No barrel re-exports needed.

---

### §Issue 3: AppLayout HubModal → LexicalHubRouter Replacement — Store State Transformation

**Current `hubStore` state:**

```typescript
type HubState = {
  isOpen: boolean;
  character: string | null;
  pinyin: string | null;
  triggerPosition?: { x: number; y: number };
  open: (character: string, pinyin?: string, position?: { x: number; y: number }) => void;
  close: () => void;
};
```

**Target `hubStore` state:**

```typescript
type HubState = {
  isOpen: boolean;
  currentEntity: EntityRef | null;
  navigationStack: EntityRef[];
  context?: string;

  // Generalized open — accepts entity ref
  open: (ref: EntityRef, context?: string) => void;
  // Legacy overload — backward compat for existing callers
  open: (glyph: string, pinyin?: string, position?: { x: number; y: number }) => void;
  close: () => void;
  pushNavigation: (ref: EntityRef) => void;
  popNavigation: () => EntityRef | undefined;
};
```

**Backward-compatible `open` overload implementation:**

```typescript
open: (arg1: EntityRef | string, arg2?: string, arg3?: { x: number; y: number }) => {
  if (typeof arg1 === "string") {
    // Legacy: open(glyph, pinyin, position)
    set({
      isOpen: true,
      currentEntity: { entityType: "character", entityId: arg1, label: arg2 },
      navigationStack: [],
      context: undefined,
    });
  } else {
    // New: open(entityRef, context)
    set({
      isOpen: true,
      currentEntity: arg1,
      navigationStack: [],
      context: arg2,
    });
  }
},
```

**AppLayout change:**

```tsx
// BEFORE
function HubModal() {
  const { isOpen, character, pinyin, close } = useHubStore();
  return (
    <Modal isOpen={isOpen} onClose={close} size="lg" title={character || "Character Detail"}>
      <CharacterHub character={character ?? ""} pinyin={pinyin} onClose={close} />
    </Modal>
  );
}

// AFTER
function HubModal() {
  const { isOpen, currentEntity, close } = useHubStore();
  return (
    <Modal isOpen={isOpen} onClose={close} size="lg" title={currentEntity?.label ?? "Detail"}>
      <LexicalHubRouter />
    </Modal>
  );
}
```

**All existing callers** (`BranchNode.tsx`, `TreeRootNode.tsx`, `PinyinTab.tsx`, `StrokeAnimationTab.tsx`) call `openHub(char, pinyin)` → `open(char, pinyin)` — they match the legacy overload signature and require zero changes.

---

### §Issue 4: `shared/types/` Directory Creation

**Create the following directory and files:**

```
apps/frontend/src/shared/types/
├── index.ts       → barrel re-export
└── hub.ts         → EntityType, EntityRef type definitions
```

**`shared/types/hub.ts`:**

```typescript
/**
 * @file shared/types/hub.ts
 * @description Shared type definitions for the LexicalHub system.
 * Entity-agnostic types consumed by hubStore, useEntityHub, LexicalHubRouter,
 * HubEntityCard, HubProgressActions, and HubEntityRelationList.
 */

export type EntityType =
  "character" | "word" | "radical" | "chengyu" | "grammar" | "phoneticCluster";

export interface EntityRef {
  entityType: EntityType;
  entityId: string;
  /** Optional human-readable label (e.g., pinyin for characters, definition for words) */
  label?: string;
}
```

**`shared/types/index.ts`:**

```typescript
export type { EntityType, EntityRef } from "./hub";
```

**Implementation order:** Create `shared/types/` first, before any other new file in this story, since all other components depend on these type definitions.

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
