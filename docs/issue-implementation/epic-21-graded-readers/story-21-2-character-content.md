# Implementation 21-2: Character Content Generation

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-2-character-content.md`

## Technical Scope

Import Make Me a Hanzi decomposition data, infer phonetic components, populate character classification and CharacterRadical.decompositionType, create CharacterComponent model, and generate the pinyin→character reverse index.

**Files:**

- `apps/backend/prisma/schema.prisma` — add CharacterComponent model, update Character.classification and Character.phoneticComponentId fields
- `apps/backend/prisma/migrations/` — new migration for CharacterComponent table and Character field additions
- `apps/backend/prisma/seeds/seed-character-enrichment.ts` — NEW: import Make Me a Hanzi decomposition, classify characters, infer phonetic components
- `apps/backend/scripts/database/populate-decomposition-types.ts` — Populate CharacterRadical.decompositionType
- `apps/backend/scripts/database/generate-pinyin-index.ts` — Generate PinyinCharacterMapping records
- `apps/backend/scripts/database/classify-characters.ts` — Classification inference script
- `content/characters/` — Regenerated aggregate files with classification data

## Implementation Details

### CharacterComponent Model

```prisma
model CharacterComponent {
  id           String @id @default(uuid())
  characterId  String                        // The composed character (e.g., 请)
  componentId  String                        // The component (e.g., 青)
  role         String?                       // "phonetic" | "semantic" | "positional" | null
  position     String?                       // "left" | "right" | "top" | "bottom" | "surround" | null
  character    Character @relation("ComposedCharacter", fields: [characterId], references: [id])
  component    Character @relation("ComponentCharacter", fields: [componentId], references: [id])

  @@unique([characterId, componentId])
  @@index([characterId])
  @@index([componentId])
}
```

### Classification Inference

Characters are classified using a heuristic pipeline:

1. **Pictographs** (象形): Characters that visually represent objects (日, 月, 山, 水). Curated list from Make Me a Hanzi dataset.
2. **Ideographs** (指事): Abstract concept indicators (上, 下, 一, 二). Curated list.
3. **Phono-semantic** (形声): Characters with a phonetic component + semantic radical (most common type, ~80% of characters). Identified by detecting a component that shares pronunciation with the composed character.
4. **Compound ideographs** (会意): Characters formed from multiple meaning components (休 = 人 + 木, "person by tree" = rest).

### Phonetic Component Inference

For phono-semantic characters, the phonetic component is the sub-component whose pinyin most closely matches the full character's pinyin (accounting for tone changes and initial/final variations).

```typescript
function inferPhoneticComponent(
  character: Character,
  components: CharacterComponent[],
): string | null {
  for (const comp of components) {
    const compChar = getCharacter(comp.componentId);
    if (!compChar?.pinyin) continue;

    // Check if component pinyin matches character pinyin
    // (allowing for tone differences: mā vs má vs ma)
    if (normalizePinyin(compChar.pinyin) === normalizePinyin(character.pinyin)) {
      return compChar.id; // This component is the phonetic indicator
    }

    // Check partial match (initial/final matches)
    if (shareInitialOrFinal(compChar.pinyin, character.pinyin)) {
      return compChar.id; // Likely phonetic component
    }
  }
  return null;
}
```

### Decomposition Type Population

`CharacterRadical.decompositionType` is populated based on the radical's relationship to the character:

- `"semantic"` — Radical contributes meaning (e.g., 扌 in 打, 提)
- `"phonetic"` — Radical indicates pronunciation (rare for Kangxi radicals)
- `"remaining"` — Residual stroke component (e.g., 丿 in 系)
- `null` — Unknown or unclassified

### PinyinCharacterMapping Generation

```typescript
// For each Character with readings, create PinyinCharacterMapping records
for (const character of characters) {
  for (const reading of character.readings) {
    const syllable = await prisma.pinyinSyllable.findFirst({
      where: {
        syllable: normalizeSyllable(reading.pinyin),
        tone: reading.tone,
      },
    });

    if (syllable) {
      await prisma.pinyinCharacterMapping.create({
        data: {
          pinyinSyllableId: syllable.id,
          characterId: character.id,
        },
      });
    }
  }
}
```

### Seed Idempotency

```typescript
// All operations use upsert patterns
await prisma.characterComponent.createMany({
  data: characterComponents,
  skipDuplicates: true,
});
```

## Architecture Integration

```
[Story 21.2: Character Content Generation]
├── Prisma → CharacterComponent model (new), Character.classification + phoneticComponentId
├── Seeds → seed-character-enrichment.ts (Make Me a Hanzi import, classification)
├── Scripts → populate-decomposition-types.ts, generate-pinyin-index.ts, classify-characters.ts
└── Content → regenerated characters.json with classification data

Dependencies: Story 21.1 (Character table, schema foundation)
Consumed by: Story 21.4 (Reading UI — frequency badges, HSK pills, phonetic layout)
             Story 21.6 (Phonetic Clusters — DB-driven clusters)
```

## Technical Challenges & Solutions

```
Problem: Make Me a Hanzi dataset uses different character IDs than our ch_XXXX system.
Solution: Map by glyph (Unicode code point). The dataset indexes by character, so we
         join on the glyph field. Any character not in the dataset is classified as null.

Problem: Phonetic component inference is non-trivial — some characters share no phonetic
         relationship with their components despite being classified as phono-semantic.
Solution: Use a tiered approach: (1) exact pinyin match, (2) initial/final match,
         (3) manual override list for known exceptions. The seed script logs all
         inference results for manual review.
```
