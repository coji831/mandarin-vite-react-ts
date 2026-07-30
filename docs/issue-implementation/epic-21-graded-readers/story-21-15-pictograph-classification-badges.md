# Implementation 21-15: Pictograph Classification Badges

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-15-pictograph-classification-badges.md`

## Technical Scope

Add classification badges to the Radical Detail Card example character grid, with special styling for pictographs. Create a reusable badge component. Update backend `RadicalCharacterService` to include `classification` and `etymology` in the API response.

**Files:**

- `apps/backend/src/modules/radicals/services/RadicalCharacterService.ts` — update: add `classification` (and `etymology`) to `RadicalCharacterEntry` interface + Prisma query `.map()`
- `apps/frontend/src/shared/components/ClassificationBadge.tsx` — **NEW**: reusable badge component
- `apps/frontend/src/shared/components/ClassificationBadge.css` — **NEW**: badge styles
- `apps/frontend/src/shared/components/index.tsx` — update: export new component
- `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx` — update: pass classification/etymology to `ExampleCharGrid`
- `apps/frontend/src/features/radicals/components/ExampleCharGrid.tsx` — update: pass classification/etymology to each `ExampleCharCell`
- `apps/frontend/src/features/radicals/components/ExampleCharCell.tsx` — update: render badge + pictograph golden border styling
- `apps/frontend/src/features/radicals/components/ExampleCharCell.css` — update: pictograph border styles
- `apps/frontend/src/features/radicals/components/__tests__/RadicalDetailCard.test.tsx` — update: tests for badge rendering
- `apps/frontend/src/features/radicals/components/__stories__/RadicalDetailCard.stories.tsx` — update: stories covering badge variants
- `.github/component-registry.json` — update: add `ClassificationBadge` entry

## Component Design

### ClassificationBadge Component

```typescript
interface ClassificationBadgeProps {
  classification: "pictograph" | "phono_semantic" | "compound_ideograph" | "ideograph" | null;
  etymology?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}
```

Renders:

| Classification       | Emoji | Label              | Color                 |
| -------------------- | ----- | ------------------ | --------------------- |
| `pictograph`         | 🖼️    | Pictograph         | `var(--color-xp)`     |
| `phono_semantic`     | 🔤    | Phono-semantic     | `var(--color-blue)`   |
| `compound_ideograph` | 🧩    | Compound ideograph | `var(--color-green)`  |
| `ideograph`          | ⚡    | Simple ideograph   | `var(--color-purple)` |

### ExampleCharCell Integration

The badge is rendered inside `ExampleCharCell` (not as a separate layer), so data flows through the component chain:

```typescript
// RadicalDetailCard → passes enriched data to ExampleCharGrid
<ExampleCharGrid characters={exampleCharacters} />

// ExampleCharGrid → passes to each ExampleCharCell
{characters.map(char => (
  <ExampleCharCell
    key={char.glyph}
    glyph={char.glyph}
    pinyin={char.pinyin}
    meaning={char.meaning}
    classification={char.classification}
    etymology={char.etymology}
  />
))}

// ExampleCharCell → renders badge + golden border for pictographs
<div
  className={`example-char-cell ${classification === 'pictograph' ? 'example-char-cell--pictograph' : ''}`}
  title={classification === 'pictograph' ? 'This character originated as a pictograph — a visual representation of the object it depicts.' : undefined}
>
  <span className="example-char-cell__glyph">{glyph}</span>
  <span className="example-char-cell__pinyin">{pinyin}</span>
  <span className="example-char-cell__meaning">{meaning}</span>
  {classification && (
    <ClassificationBadge classification={classification} etymology={etymology} size="sm" />
  )}
</div>
```

### Etymology Preview (Option A — Recommended)

For pictograph characters, the backend passes `etymology: string | null` through to `ExampleCharCell`. On hover, a preview of the etymology text is shown via a tooltip or a small preview area within the cell, helping learners understand the visual origin of pictographs.

## Architecture Integration

```
[Story 21.15: Pictograph Classification Badges]
├── Shared Components
│   └── ClassificationBadge — reusable badge with emoji + label + color
├── Feature: Radicals
│   └── RadicalDetailCard — badges added to example character grid
│       └── Golden border + tooltip for pictographs
└── Downstream Consumers (future)
    ├── 21.18 IME Hints — score breakdown by type
    ├── 21.19 Phonetic Tree — badge on character nodes
    └── 21.20 Mnemonic UI — badge pill in card header
```

## Architecture Decisions

| Decision                 | Choice                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Badge component location | `shared/components/ClassificationBadge.tsx`                                                                                    |
| Badge rendered inside    | `ExampleCharCell` (not a separate layer)                                                                                       |
| Golden border on         | The cell row (not the badge itself)                                                                                            |
| Golden border token      | `var(--color-xp)`                                                                                                              |
| Null classification      | Hide badge                                                                                                                     |
| Etymology data flow      | Option A — backend passes `etymology: string \| null`                                                                          |
| Emoji + label mapping    | 🖼️ pictograph, 🔤 phono_semantic, 🧩 compound_ideograph, ⚡ ideograph                                                          |
| Color tokens per type    | pictograph = `--color-xp`, phono_semantic = `--color-blue`, compound_ideograph = `--color-green`, ideograph = `--color-purple` |

✅ Implemented (July 30, 2026)
