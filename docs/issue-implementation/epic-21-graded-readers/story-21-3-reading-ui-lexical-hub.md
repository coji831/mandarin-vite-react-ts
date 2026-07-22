# Implementation 21-3: Reading UI + LexicalHub Phase 1

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-3-reading-ui-lexical-hub.md`

## Technical Scope

Build the entire learner-facing reading experience: ReadersPage, ReaderLibrary, ReadingView, inline WordPopover, generalized hubStore, LexicalHubRouter, and WordHubContent.

**Files:**

- `apps/frontend/src/features/readers/` — Entire feature module (components/, hooks/, services/, stores/, types/, docs/, index.ts)
- `apps/frontend/src/pages/learn/ReadersPage.tsx` — Page container
- `apps/frontend/src/pages/learn/ReadersPageFull.stories.tsx` — Storybook page story
- `apps/frontend/src/router/LearnRoutes.tsx` — Replace ContentPlaceholderPage with ReadersPage
- `apps/frontend/.storybook/msw-handlers.ts` — Add readers handlers (6 levels)
- `apps/frontend/src/shared/store/hubStore.ts` — generalized (was character-only)
- `apps/frontend/src/shared/hooks/useEntityHub.ts` — new (replaces useCharacterHub)
- `apps/frontend/src/shared/types/hub.ts` — new: EntityType, EntityRef types
- `apps/frontend/src/shared/components/HubEntityCard/` — new (from HubIdentityCard)
- `apps/frontend/src/shared/components/HubProgressActions/` — new (from HubProgressActions)
- `apps/frontend/src/shared/components/HubEntityRelationList/` — new (from HubCommonWords)
- `apps/frontend/src/features/lexical-hub/` — new feature folder
- `apps/frontend/src/features/lexical-hub/components/LexicalHubRouter.tsx` — new
- `apps/frontend/src/features/lexical-hub/components/WordHubContent.tsx` — new
- `apps/frontend/src/features/lexical-hub/components/CharacterHubContent.tsx` — moved from character-hub/
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
    └── AudioControlBar (play/pause, speed, progress) (from Story 21.4)
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

- `useEntityHub().openHub(glyph, pinyin)` still works for all existing CharacterHub callers
- Existing component imports continue to function via barrel re-exports
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
[Story 21.2: Reading UI + LexicalHub Phase 1]
├── ReadersPage → feature/readers/
├── LexicalHub → feature/lexical-hub/
│   ├── LexicalHubRouter
│   ├── WordHubContent (new)
│   └── CharacterHubContent (moved)
├── Shared → hubStore (generalized), useEntityHub, HubEntityCard, etc.
├── Services → apiClient → Story 21.2 backend API
```

## Technical Challenges & Solutions

```
Problem: CharacterHub is deeply integrated across features. Generalizing to
         LexicalHub must not break existing code.
Solution: Create useEntityHub as a backward-compatible wrapper. Existing
         useCharacterHub calls forward to useEntityHub internally. Barrel
         re-exports maintain import paths.

Problem: Inline WordPopover must not interfere with reading flow.
Solution: Popover appears on tap (not hover). Audio pauses when popover is
         open. Popover closes on tap outside. "Open in Word Hub" navigates
         to full detail in LexicalHub.
```
