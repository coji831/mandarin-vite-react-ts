# Implementation 20-3: Character Decomposition Data

**Last Updated:** July 20, 2026

## Implementation Status

- **Status**: Planned
- **PR**: TBD

## Technical Scope

Import Make Me a Hanzi (MIT-licensed) decomposition and etymology JSON data into the existing `CharacterRadical` Prisma table, building a dynamic glyph-to-radical-ID mapping from `content/radicals/*.json`. This provides the radical breakdown context needed by the Gemini prompt in Story 20.1.

**Files to create:**

- `scripts/import-decomposition-data.js` — Node.js script that reads Make Me a Hanzi JSON, maps radical glyphs to `rad_XXXX` IDs, and upserts into `CharacterRadical`

**Files to modify:**

- (none — `CharacterRadical` table already exists in Prisma schema)

## Implementation Details

### Import Script Pattern

```javascript
// scripts/import-decomposition-data.js
// Source: Make Me a Hanzi (pinned commit)
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function buildGlyphToIdMap() {
  const radicalsDir = path.join(__dirname, "../content/radicals");
  const files = fs.readdirSync(radicalsDir).filter((f) => f.endsWith(".json"));
  const map = new Map();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(radicalsDir, file), "utf-8"));
    map.set(data.glyph, data.id);
  }

  return map;
}

async function importDecomposition() {
  const glyphToId = await buildGlyphToIdMap();
  const mmahData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/make-me-a-hanzi/decompositions.json"), "utf-8"),
  );

  let processed = 0;
  let warnings = [];

  for (const entry of mmahData) {
    const { character, radicals } = entry;

    for (const radicalGlyph of radicals) {
      const radicalId = glyphToId.get(radicalGlyph);

      if (!radicalId) {
        warnings.push({ character, radicalGlyph });
        continue;
      }

      await prisma.characterRadical.upsert({
        where: {
          characterGlyph_radicalId: {
            characterGlyph: character,
            radicalId,
          },
        },
        update: {},
        create: {
          characterGlyph: character,
          radicalId,
        },
      });
    }

    processed++;
  }

  console.log(`Processed ${processed} characters`);
  console.log(`Unmapped radicals: ${warnings.length}`);
  warnings.forEach((w) =>
    console.warn(`  Warning: unmapped radical "${w.radicalGlyph}" in character "${w.character}"`),
  );
}

importDecomposition()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Idempotent Upsert

```javascript
// Prisma upsert with compound unique key [characterGlyph, radicalId]
// Safe to run multiple times — no duplicates or errors
await prisma.characterRadical.upsert({
  where: {
    characterGlyph_radicalId: {
      characterGlyph: character,
      radicalId,
    },
  },
  update: {},
  create: { characterGlyph: character, radicalId },
});
```

## Architecture Integration

```
Make Me a Hanzi (MIT, pinned commit)
  ↓ (parsed by import-decomposition-data.js)
CharacterRadical table (Prisma, upsert)
  ↓ (queried by MnemonicsService)
Gemini prompt builder → MnemonicsService.generate()
  ↓
MnemonicStory (displayed in HubMnemonicSection)
```

## Technical Challenges & Solutions

### Challenge: Radical Glyph ID Mapping Mismatches

**Problem:** Make Me a Hanzi uses Unicode radical glyphs (e.g., "⺮" for bamboo radical). Our `content/radicals/*.json` uses the standard Kangxi form ("竹"). Some glyph representations differ between the two datasets.

**Solution:** Log mismatches as warnings (not errors) so the script continues processing all characters. The warning output at the end provides a summary of unmapped items for manual review.

### Challenge: Make Me a Hanzi Format Drift

**Problem:** The JSON format could change between versions, silently breaking the import script.

**Solution:** Pin the source commit hash in a comment at the top of the script. Add a validation step that checks for expected JSON structure before processing.

### Challenge: Script Idempotency

**Problem:** Running the script multiple times must not create duplicate entries.

**Solution:** Use Prisma `upsert` with the compound unique key `[characterGlyph, radicalId]`. If an entry already exists, the `update: {}` is a no-op.

## Testing Implementation

- **Manual verification**: Run `node scripts/import-decomposition-data.js` and confirm exit code 0
- **Database query**: `SELECT COUNT(*) FROM "CharacterRadical"` — verify non-zero entries
- **Pictograph check**: Query entries for the 20 pictograph characters — each should have decomposition entries
- **Idempotency**: Run script twice — verify no duplicate entries
