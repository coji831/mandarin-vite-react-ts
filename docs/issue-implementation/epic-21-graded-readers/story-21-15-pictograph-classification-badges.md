# Implementation 21-15: Pictograph Classification Badges

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-15-pictograph-classification-badges.md`

## Technical Scope

Add classification badges to the Radical Detail Card example character grid, with special styling for pictographs. Create a reusable badge component.

**Files:**

- `apps/frontend/src/shared/components/ClassificationBadge.tsx` — **NEW**: reusable badge component
- `apps/frontend/src/shared/components/index.ts` — update: export new component
- `apps/frontend/src/features/radicals/components/RadicalDetailCard.tsx` — update: add badges to character grid, golden border for pictographs
- `apps/frontend/src/features/radicals/components/__tests__/RadicalDetailCard.test.tsx` — update: tests for badge rendering
- `apps/frontend/src/features/radicals/components/__stories__/RadicalDetailCard.stories.tsx` — update: stories covering badge variants

## Component Design

### ClassificationBadge Component

```typescript
interface ClassificationBadgeProps {
  classification:
    "pictograph" | "phono-semantic" | "compound-ideograph" | "simple-ideograph" | string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}
```

Renders:

| Classification       | Emoji | Label              | Color                 |
| -------------------- | ----- | ------------------ | --------------------- |
| `pictograph`         | 🖼️    | Pictograph         | `var(--color-gold)`   |
| `phono-semantic`     | 🔤    | Phono-semantic     | `var(--color-blue)`   |
| `compound-ideograph` | 🧩    | Compound ideograph | `var(--color-green)`  |
| `simple-ideograph`   | ⚡    | Simple ideograph   | `var(--color-purple)` |

### RadicalDetailCard Integration

```typescript
// In RadicalDetailCard — example character grid
{exampleCharacters.map(char => (
  <div
    key={char.glyph}
    className={`character-cell ${char.classification === 'pictograph' ? 'character-cell--pictograph' : ''}`}
    title={char.classification === 'pictograph' ? 'This character originated as a pictograph — a visual representation of the object it depicts.' : undefined}
  >
    <span className="character-cell__glyph">{char.glyph}</span>
    <ClassificationBadge classification={char.classification} size="sm" />
    {char.classification === 'pictograph' && (
      <span className="character-cell__etymology-preview">{char.etymologyDescription}</span>
    )}
  </div>
))}
```

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
