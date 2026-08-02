# Implementation 21-2: Character Content Generation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-2-character-content.md`
> **Last Updated:** 2026-08-01
> **Status:** ✅ Complete

## Technical Scope

Seed the remaining two tables — `Component` and `CharacterComponent` — by building two new enrich scripts that parse Make Me a Hanzi IDS decomposition data. Most of the original ACs (classification, phoneticComponentId, decompositionType, PinyinCharacterMapping, PinyinSyllable, content regeneration, seed idempotency) were already delivered by Story 21.1's 3-phase pipeline.

**Files — NEW:**

- `apps/backend/scripts/enrich/build-component-entries.ts` — Parse MMAH IDS decompositions → extract unique component glyphs → `content/seed/phase2/component-entries.json`
- `apps/backend/scripts/enrich/build-character-components.ts` — Parse MMAH IDS → create CharacterComponent junction records → `content/seed/phase2/character-components.json`

**Files — EXISTING (already delivered by Story 21.1, referenced here):**

- `apps/backend/prisma/schema.prisma` — `Component` model (line ~655), `CharacterComponent` model (line ~674) — already created
- `apps/backend/prisma/seed.ts` — Step 4 (Component) and Step 14 (CharacterComponent) already ready with `createMany` + `skipDuplicates: true`; just need non-empty JSON
- `apps/backend/scripts/enrich/build-character-entries.ts` — Already populates `Character.classification` and `Character.phoneticComponentId` from MMAH etymology
- `apps/backend/scripts/enrich/build-character-radicals.ts` — Already populates `CharacterRadical.decompositionType`
- `apps/backend/scripts/enrich/build-pinyin-mappings.ts` — Already generates `PinyinCharacterMapping` records
- `apps/backend/scripts/verify/verify-pipeline.ts` — Phase 2 + Phase 3 checks
- `content/seed/phase2/component-entries.json` — Currently `[]` (empty — target for this story)
- `content/seed/phase2/character-components.json` — Currently `[]` (empty — target for this story)

## Implementation Details

### Component Model (Existing)

From `schema.prisma` (line ~655):

```prisma
model Component {
  id        String   @id                // "cmp_001"
  glyph     String   @unique            // "氵", "口", "青", "可"
  meaning   String?                     // "water", "mouth", "blue/green", "able"
  type      String?                     // "radical" | "phonetic" | "both"
  variantOf String?                     // References another Component ID (e.g., 氵 is variant of 水)
  strokes   Int?                        // Stroke count for this component
  characters CharacterComponent[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### CharacterComponent Model (Existing)

From `schema.prisma` (line ~674):

```prisma
model CharacterComponent {
  id            String   @id @default(uuid())
  characterId   String                 // FK to Character.id (e.g., the composed character 请)
  componentId   String                 // FK to Component.id (e.g., the component 青)
  position      String?                // "left" | "right" | "top" | "bottom" | "outside" | "inside" | "center"
  function      String?                // "semantic" | "phonetic" | "remaining"
  character     Character @relation(fields: [characterId], references: [id])
  component     Component @relation(fields: [componentId], references: [id])

  @@unique([characterId, componentId])
  @@index([characterId])
  @@index([componentId])
  @@index([function])
}
```

Note: `function` (not `role`) is the field name. Both FKs do NOT point to `Character` — `characterId` → `Character`, `componentId` → `Component`.

### Classification — Actual Pipeline

Classification is determined by `build-character-entries.ts` using MMAH's `etymology.type` field mapped via a `CLASSIFICATION_MAP`:

```typescript
const CLASSIFICATION_MAP: Record<string, string> = {
  pictographic: "pictograph",
  pictophonetic: "phono_semantic",
  ideographic: "ideograph",
};

function mapClassification(mmahType: string | undefined): string | null {
  if (!mmahType) return null;
  const lower = mmahType.toLowerCase().trim();
  return CLASSIFICATION_MAP[lower] || null;
}
```

No heuristic pinyin matching or curated lists are involved. The MMAH dataset provides the classification directly; this script simply maps the MMAH type names to the project's enum values.

### Phonetic Component — Actual Pipeline

Phonetic component resolution uses MMAH's `etymology.phonetic` field directly — no pinyin matching:

```typescript
// Step 1: Store the raw glyph from MMAH
if (mmah.etymology?.phonetic) {
  phoneticComponentId = mmah.etymology.phonetic; // e.g., "从"
}

// Step 2: Second pass — resolve glyph → character ID
for (const ch of characters) {
  if (!ch.phoneticComponentId) continue;
  if (ch.phoneticComponentId.startsWith("ch_")) continue; // Already resolved
  const resolvedId = glyphToIdMap.get(ch.phoneticComponentId);
  if (resolvedId) {
    ch.phoneticComponentId = resolvedId;
  } else {
    ch.phoneticComponentId = null; // Glyph not found in our dataset
  }
}
```

The glyph-to-ID map is built from all known characters (existing + new), so any glyph in MMAH that maps to a character in the pipeline gets resolved. Characters without a matching MMAH entry remain `null`.

### Decomposition Type — Actual Pipeline

`CharacterRadical.decompositionType` is populated by `build-character-radicals.ts`, which infers it from MMAH `etymology.type`:

- If etymology type is `"pictophonetic"` → radical function is `"semantic"` (the radical is the meaning component)
- Otherwise → `null`

This covers 2,798 records.

### build-component-entries.ts — NEW Script Design

Parses MMAH IDS (Ideographic Description Sequence) decomposition strings to extract unique component glyphs:

```
Input: content/seed/phase1/mmah-entries.json  (has `decomposition` field with IDS strings)
       content/radicals/radicals.json          (existing radicals for dedup)

Logic:
  1. For each MMAH entry with a `decomposition` field, parse the IDS string
     to extract all component glyphs (characters that are not IDS operators).
  2. IDS operators to strip: ⿰ (left-right), ⿱ (top-bottom), ⿲ (left-mid-right),
     ⿳ (top-mid-bottom), ⿴ (full surround), ⿵ (surround from above),
     ⿶ (surround from below), ⿷ (surround from left), ⿸ (surround from upper left),
     ⿹ (surround from upper right), ⿺ (surround from lower left),
     ⿻ (overlaid), 〾 (variation indicator), etc.
  3. Cross-reference extracted glyphs against existing Kangxi radicals
     (content/radicals/radicals.json) to avoid creating duplicate entries.
     Radical glyphs that appear as components are linked by `variantOf`.
  4. Assign each unique non-radical component a `cmp_XXX` ID (zero-padded integer).
  5. Assign `type` ("radical" | "phonetic" | "both") based on whether the component
     also appears as a phonetic indicator in MMAH etymology data.
  6. Write to: content/seed/phase2/component-entries.json

Output shape:
  [
    { "id": "cmp_001", "glyph": "氵", "meaning": null, "type": "radical",
      "variantOf": "cmp_water", "strokes": null },
    { "id": "cmp_002", "glyph": "青", "meaning": null, "type": "phonetic",
      "variantOf": null, "strokes": null }
  ]
```

### build-character-components.ts — NEW Script Design

Parses the same MMAH IDS strings to create CharacterComponent junction records:

```
Input: content/seed/phase1/mmah-entries.json       (decomposition field)
       content/seed/phase2/characters.json          (character ID lookup)
       content/seed/phase2/component-entries.json   (component ID lookup)

Logic:
  1. For each MMAH entry with a `decomposition` field, parse the IDS string.
  2. Determine position from the IDS operator:
     - ⿰ → "left" / "right" (first operand is left, second is right)
     - ⿱ → "top" / "bottom"
     - ⿴ → "outside" / "inside"
     - etc.
  3. Determine function from MMAH etymology.type:
     - "pictophonetic" → first component is "semantic", second is "phonetic"
     - Otherwise → both are null
  4. Resolve component glyphs → Component IDs via the phase2/component-entries.json index.
  5. Write to: content/seed/phase2/character-components.json

Output shape:
  [
    { "id": "auto-uuid", "characterId": "ch_1001", "componentId": "cmp_042",
      "position": "left", "function": "semantic" },
    { "id": "auto-uuid", "characterId": "ch_1001", "componentId": "cmp_007",
      "position": "right", "function": "phonetic" }
  ]
```

### Seed Pipeline Integration

Both new scripts must be added to:

1. **`package.json` `script:enrich-all`** — Add the two new scripts to the enrich pipeline chain
2. **`prisma/seed.ts`** — Steps 4 (Component) and 14 (CharacterComponent) already use `createMany` + `skipDuplicates: true` — no code changes needed, just need non-empty JSON files

### Seed Idempotency

All operations use `skipDuplicates: true`:

```typescript
await prisma.component.createMany({
  data: componentEntries,
  skipDuplicates: true,
});

await prisma.characterComponent.createMany({
  data: characterComponents,
  skipDuplicates: true,
});
```

## Architecture Integration

```
[Story 21.2: Character Content Generation]
├── Phase 1 (Generate)
│   └── mmah-entries.json ← scripts/generate/mmah-entries.ts
├── Phase 2 (Enrich) — NEW scripts
│   ├── build-component-entries.ts → component-entries.json
│   └── build-character-components.ts → character-components.json
├── Phase 3 (Seed)
│   ├── seed.ts Step 4: Component ← component-entries.json
│   └── seed.ts Step 14: CharacterComponent ← character-components.json
└── Verify
    └── verify-pipeline.ts — phase2 + phase3 checks (extended for new tables)

Dependencies: Story 21.1 (Character table, 3-phase pipeline, MMAH data,
              Component + CharacterComponent schema models, classification,
              phoneticComponentId, decompositionType, PinyinCharacterMapping)
Consumed by: Story 21.4 (Reading UI — decomposition display, component layout)
             Story 21.6 (Deferred — phonetic clusters)
```

## Technical Challenges & Solutions

```
Problem: MMAH decomposition uses IDS format (e.g., ⿰女子 for 好) — need a parser.
Solution: Write an IDS parser that:
          (1) Recognizes IDS operators (⿰, ⿱, ⿲, ⿳, ⿴, ⿵, ⿶, ⿷, ⿸, ⿹, ⿺, ⿻, 〾)
          (2) Recursively extracts all leaf glyphs (CJK characters), ignoring operators
          (3) Maps position from the operator (left-right → "left"/"right", etc.)
          (4) Handles nested IDS (e.g., ⿰⿱宀⿱罒巾⿱㇒⿱㇏𠃋㇕ for 應 → extracts 宀, 罒, 巾, ㇒, ㇏, 𠃋, ㇕)

Problem: Component entries must not duplicate existing Kangxi radicals.
Solution: Cross-reference against content/radicals/radicals.json before creating
          new Component records. When a decomposition glyph matches an existing
          radical, set `variantOf` to link the component entry to the radical,
          and use `type: "radical"`.

Problem: Some IDS decompositions are partial or missing for certain characters.
Solution: Skip characters without a `decomposition` field. The seed script
          logs statistics on how many characters have/pass decompositions for
          manual gap analysis.

Problem: CharacterComponent needs position inference from IDS operator type,
          but nested IDS makes this non-trivial (e.g., left side may itself be
          a two-component compound).
Solution: Only assign top-level position from the outermost IDS operator.
          Nested components get `position: null`. The `function` field is
          inferred from MMAH etymology.type when available.
```

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
