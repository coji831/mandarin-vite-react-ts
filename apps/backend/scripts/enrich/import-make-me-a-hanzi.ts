/**
 * @file apps/backend/scripts/database/import-make-me-a-hanzi.ts
 * @description Import Make Me a Hanzi dictionary.txt to enrich Character data
 *   with classification, etymology, phoneticComponentId, and CharacterRadical.
 *
 * MMAH format (JSONL — one JSON object per line):
 *   {"character":"好","definition":"...","pinyin":["hǎo","hào"],
 *    "decomposition":"⿰女子","etymology":{"type":"pictophonetic","hint":"...","phonetic":"子"},
 *    "radical":"女","matches":[...]}
 *
 * Part A: Character enrichment (classification, etymology, phoneticComponentId, radical)
 * Part B (Component + CharacterComponent) is deferred to Story 21.6.
 *
 * Idempotent: skips characters that already have classification set.
 *
 * Run: cd apps/backend && npx tsx scripts/database/import-make-me-a-hanzi.ts
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { prisma } from "../client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "make-me-a-hanzi", "dictionary.txt");
const RADICALS_DIR = path.join(PROJECT_ROOT, "content", "radicals");

const BATCH_SIZE = 500;

// ── Types ──

interface MmahEtymology {
  type?: string;
  hint?: string;
  phonetic?: string;
  semantic?: string;
}

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: MmahEtymology;
  radical?: string;
  matches?: Array<number[] | null>;
}

// ── Classification Mapper ──

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

// ── Radical Glyph Map Builder ──

function buildRadicalGlyphMap(): Map<string, string> {
  const glyphToId = new Map<string, string>();

  if (!fs.existsSync(RADICALS_DIR)) {
    console.warn(`  ⚠️ Radicals directory not found: ${RADICALS_DIR}`);
    return glyphToId;
  }

  // First try: use index.json glyphToId map directly (fast path)
  const indexFile = path.join(RADICALS_DIR, "index.json");
  if (fs.existsSync(indexFile)) {
    const indexData = JSON.parse(fs.readFileSync(indexFile, "utf-8"));
    if (indexData.glyphToId) {
      for (const [glyph, id] of Object.entries(indexData.glyphToId)) {
        glyphToId.set(glyph, id as string);
      }
      console.log(`  📄 Loaded ${glyphToId.size} glyph mappings from index.json`);
      return glyphToId;
    }
  }

  // Second try: parse radicals.json array (contains alternateGlyphs)
  const radicalsFile = path.join(RADICALS_DIR, "radicals.json");
  if (fs.existsSync(radicalsFile)) {
    const radicals: Array<{
      id: string;
      glyph: string;
      alternateGlyphs?: string[];
    }> = JSON.parse(fs.readFileSync(radicalsFile, "utf-8"));

    for (const radical of radicals) {
      if (!radical.id || !radical.glyph) continue;
      glyphToId.set(radical.glyph, radical.id);

      const alternates = radical.alternateGlyphs ?? [];
      for (const altGlyph of alternates) {
        if (!glyphToId.has(altGlyph)) {
          glyphToId.set(altGlyph, radical.id);
        }
      }
    }

    console.log(`  📄 Loaded ${glyphToId.size} glyph mappings from radicals.json`);
    return glyphToId;
  }

  console.warn(`  ⚠️ No radical data found in ${RADICALS_DIR}`);
  return glyphToId;
}

// ── Main ──

async function main(): Promise<void> {
  console.log("📦 Make Me a Hanzi Import Pipeline");
  console.log("═══════════════════════════════════\n");

  // ── Step 1: Build lookup maps ──

  console.log("🔍 Building lookup maps...");

  // Character map: glyph → { id, classification, etymology, phoneticComponentId }
  const allChars = await prisma.character.findMany({
    select: { id: true, glyph: true, classification: true },
  });
  const charByGlyph = new Map<string, { id: string; classification: string | null }>();
  for (const c of allChars) {
    charByGlyph.set(c.glyph, { id: c.id, classification: c.classification });
  }
  console.log(`  📄 ${charByGlyph.size} characters in DB`);

  // Radical glyph map
  const radicalGlyphToId = buildRadicalGlyphMap();
  console.log(`  📄 ${radicalGlyphToId.size} radical glyph mappings`);

  // ── Step 2: Check data file ──

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`  ❌ Data file not found: ${DATA_FILE}`);
    console.error(
      "  Download from: https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt",
    );
    console.error("  And place at: data/make-me-a-hanzi/dictionary.txt");
    process.exit(1);
  }

  // ── Step 3: Stream and process MMAH entries ──

  console.log("\n📖 Streaming MMAH dictionary.txt...");

  const fileStream = fs.createReadStream(DATA_FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  // Accumulators for batch operations
  const charUpdates: Array<{
    id: string;
    classification: string | null;
    etymology: string | null;
    phoneticComponentId: string | null;
  }> = [];

  const radicalRecords: Array<{
    characterGlyph: string;
    characterId: string;
    radicalId: string;
    decompositionType: string | null;
  }> = [];

  // Track unmapped radical glyphs for reporting
  const unmappedRadicals = new Map<string, Set<string>>();

  let totalLines = 0;
  let parseErrors = 0;
  let matchedEntries = 0;
  let skippedAlreadyClassified = 0;
  let skippedNoMatch = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    totalLines++;

    // Parse JSON
    let entry: MmahEntry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      parseErrors++;
      continue;
    }

    // Must have a character field
    if (!entry.character) {
      parseErrors++;
      continue;
    }

    // Check if this character exists in our DB
    const dbChar = charByGlyph.get(entry.character);
    if (!dbChar) {
      skippedNoMatch++;
      continue;
    }

    matchedEntries++;

    // ── Classification ──
    let classification: string | null = null;
    if (entry.etymology?.type) {
      classification = mapClassification(entry.etymology.type);
    }

    // Skip if already classified (idempotent on classification)
    // We skip only if classification is already set AND we'd set the same value
    // Update if different or if not set
    const shouldSkipClassify =
      dbChar.classification !== null &&
      classification !== null &&
      dbChar.classification === classification;

    if (shouldSkipClassify) {
      skippedAlreadyClassified++;
    }

    // ── Etymology ──
    const etymology = entry.etymology?.hint || null;

    // ── PhoneticComponentId ──
    let phoneticComponentId: string | null = null;
    if (entry.etymology?.phonetic) {
      const phoneticChar = charByGlyph.get(entry.etymology.phonetic);
      if (phoneticChar) {
        phoneticComponentId = phoneticChar.id;
      }
    }

    // Accumulate character update
    const existingUpdate = charUpdates.find((u) => u.id === dbChar.id);
    if (existingUpdate) {
      // Merge: prefer non-null values
      if (classification !== null) existingUpdate.classification = classification;
      if (etymology !== null) existingUpdate.etymology = etymology;
      if (phoneticComponentId !== null) existingUpdate.phoneticComponentId = phoneticComponentId;
    } else {
      charUpdates.push({
        id: dbChar.id,
        classification,
        etymology,
        phoneticComponentId,
      });
    }

    // ── CharacterRadical ──
    if (entry.radical) {
      const radicalId = radicalGlyphToId.get(entry.radical);
      if (radicalId) {
        // Check if this radical record already exists (deduplication within this batch)
        const exists = radicalRecords.some(
          (r) => r.characterGlyph === entry.character && r.radicalId === radicalId,
        );
        if (!exists) {
          radicalRecords.push({
            characterGlyph: entry.character,
            characterId: dbChar.id,
            radicalId,
            decompositionType: null, // We can't infer semantic/phonetic/remaining reliably
          });
        }
      } else {
        if (!unmappedRadicals.has(entry.radical)) {
          unmappedRadicals.set(entry.radical, new Set());
        }
        unmappedRadicals.get(entry.radical)!.add(entry.character);
      }
    }

    // Progress reporting
    if (matchedEntries % 1000 === 0) {
      console.log(
        `  Progress: ${matchedEntries} characters matched, ${charUpdates.length} updates pending`,
      );
    }
  }

  console.log(`\n  📄 File lines: ${totalLines}`);
  console.log(`  🔤 Matched characters: ${matchedEntries}`);
  console.log(`  ⏭️  Skipped (already classified): ${skippedAlreadyClassified}`);
  console.log(`  ⏭️  Skipped (no DB match): ${skippedNoMatch}`);
  console.log(`  ⚠️  Parse errors: ${parseErrors}`);

  // ── Step 4: Batch update Characters ──

  console.log("\n💾 Updating Character records...");

  let charUpdatedCount = 0;
  for (let i = 0; i < charUpdates.length; i += BATCH_SIZE) {
    const batch = charUpdates.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((u) =>
        prisma.character.update({
          where: { id: u.id },
          data: {
            ...(u.classification !== null ? { classification: u.classification } : {}),
            ...(u.etymology !== null ? { etymology: u.etymology } : {}),
            ...(u.phoneticComponentId !== null
              ? { phoneticComponentId: u.phoneticComponentId }
              : {}),
          },
        }),
      ),
    );

    charUpdatedCount += batch.length;

    if (charUpdatedCount % 2000 === 0 || charUpdatedCount === charUpdates.length) {
      console.log(`  Progress: ${charUpdatedCount}/${charUpdates.length} characters updated`);
    }
  }

  // ── Step 5: Batch insert CharacterRadical records ──

  console.log("\n🔗 Inserting CharacterRadical records...");

  // First, clear existing CharacterRadical records for the characters we're updating,
  // so we can insert fresh ones cleanly
  const affectedCharIds = [...new Set(radicalRecords.map((r) => r.characterId))];

  if (affectedCharIds.length > 0) {
    const deleted = await prisma.characterRadical.deleteMany({
      where: { characterId: { in: affectedCharIds } },
    });
    console.log(`  🗑️  Cleared ${deleted.count} existing radical records`);
  }

  let radicalInserted = 0;
  for (let i = 0; i < radicalRecords.length; i += BATCH_SIZE) {
    const batch = radicalRecords.slice(i, i + BATCH_SIZE);
    await prisma.characterRadical.createMany({
      data: batch,
      skipDuplicates: true,
    });
    radicalInserted += batch.length;

    if (radicalInserted % 2000 === 0 || radicalInserted === radicalRecords.length) {
      console.log(
        `  Progress: ${radicalInserted}/${radicalRecords.length} radical records inserted`,
      );
    }
  }

  // ── Summary ──

  const withClassification = await prisma.character.count({
    where: { classification: { not: null } },
  });
  const withEtymology = await prisma.character.count({
    where: { etymology: { not: null } },
  });
  const withPhonetic = await prisma.character.count({
    where: { phoneticComponentId: { not: null } },
  });
  const radicalCount = await prisma.characterRadical.count();

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ Make Me a Hanzi Import Complete");
  console.log("══════════════════════════════════════════════\n");
  console.log(`  Characters updated:       ${charUpdatedCount}`);
  console.log(`  Radical records inserted: ${radicalInserted}`);
  console.log(`  Characters with classification: ${withClassification}`);
  console.log(`  Characters with etymology:      ${withEtymology}`);
  console.log(`  Characters with phoneticComponentId: ${withPhonetic}`);
  console.log(`  Total CharacterRadical records:  ${radicalCount}`);

  if (unmappedRadicals.size > 0) {
    console.log(`\n  ⚠️  Unmapped radical glyphs: ${unmappedRadicals.size}`);
    const sortedGlyphs = [...unmappedRadicals.keys()].sort();
    for (const glyph of sortedGlyphs.slice(0, 20)) {
      const chars = unmappedRadicals.get(glyph)!;
      const examples = [...chars].slice(0, 5).join(", ");
      console.log(
        `    "${glyph}" → examples: ${examples}${chars.size > 5 ? `, ... (${chars.size} total)` : ""}`,
      );
    }
    if (sortedGlyphs.length > 20) {
      console.log(`    ... and ${sortedGlyphs.length - 20} more unmapped glyphs`);
    }
  }

  console.log("");
}

main()
  .catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
