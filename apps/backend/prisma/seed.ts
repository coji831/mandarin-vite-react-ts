/**
 * @file apps/backend/prisma/seed.ts
 * @description Database seed script — Phase 3 bulk-insert pipeline.
 *
 * Reads per-table JSON files from content/seed/phase2/ and bulk-inserts
 * into the database using prisma.<model>.createMany().
 *
 * Run via: npx prisma db seed (from apps/backend) — uses "seed" config in package.json
 * Or:       npx tsx prisma/seed.ts (with DATABASE_URL set)
 *
 * Seed order (strict dependency):
 *   1. Character              ← no FK deps
 *   2. PinyinSyllable         ← no FK deps (clears + reinserts)
 *   3. MeasureWord            ← no FK deps
 *   4. Component              ← no FK deps (empty — skipped)
 *   5. Passage                ← no FK deps
 *   6. Word                   ← no FK deps
 *   7. StrokeCategory         ← no FK deps
 *   8. StrokeExtendedType     ← FK → StrokeCategory
 *   9. StrokeOrderRule        ← no FK deps
 *   10. StrokeCategoryOrderRule ← FK → StrokeCategory + StrokeOrderRule
 *   11. CharacterReading      ← FK → Character
 *   12. CharacterRadical      ← FK → Character
 *   13. CharacterHskLevel     ← FK → Character
 *   14. WordHskLevel          ← FK → Word
 *   15. WordCharacter         ← FK → Word + Character
 *   16. PinyinCharacterMapping ← FK → PinyinSyllable + Character
 *   17. MeasureWordWord       ← FK → MeasureWord + Word
 *   18. CharacterComponent    ← FK → Character + Component (empty — skipped)
 *   19. PhoneticCluster       ← FK → Component
 *   20. PhoneticClusterMember ← FK → PhoneticCluster + Character
 *   21. Test users            — dev only
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { prisma } from "../scripts/client.js";

// ── Paths ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHASE2_DIR = path.resolve(__dirname, "../../../content/seed/phase2/");

// ── Config ─────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 5_000;

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(PHASE2_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filename} — treating as empty`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
}

async function seedTable<T>(
  label: string,
  prismaModel: keyof typeof prisma,
  data: T[],
  options?: { chunkSize?: number },
): Promise<number> {
  if (data.length === 0) {
    console.log(`  ⏭️  ${label}: 0 records — skipping`);
    return 0;
  }

  const chunk = options?.chunkSize ?? CHUNK_SIZE;
  let total = 0;

  for (let i = 0; i < data.length; i += chunk) {
    const batch = data.slice(i, i + chunk);
    await (prisma[prismaModel] as any).createMany({
      data: batch,
      skipDuplicates: true,
    });
    total += batch.length;
  }

  console.log(`  ✅ ${label}: ${total} records`);
  return total;
}

// ── Data interfaces (Phase 2 file shapes) ──────────────────────────────────

interface Phase2Character {
  id: string;
  glyph: string;
  strokeCount: number;
  classification: string | null;
  etymology: string | null;
  readings: Array<{ pinyin: string; tone: number; type: string; coreMeaning?: string | null }>;
  hskLevel: number | null;
  frequencyRank: number | null;
  commonWords: string[] | null;
  phoneticComponentId: string | null;
  coreMeaning: string | null;
}

interface Phase2Passage {
  id: string;
  title: string;
  hskLevel: number;
  content: { sentences: Array<{ text: string; words: string[] }> };
  metadata: { wordCount: number; uniqueChars: number };
}

interface Phase2Word {
  id: string;
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number | null;
  frequencyRank: number | null;
  wordClass: string | null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed (Phase 3 — bulk-insert pipeline)...");
  console.log(`   Phase 2 directory: ${PHASE2_DIR}`);
  console.log("═══════════════════════════════════════════════\n");

  // ── Load all Phase 2 files ─────────────────────────────────────────────
  console.log("📂 Loading Phase 2 JSON files...");
  const phase2 = {
    characters: loadJson<Phase2Character>("characters.json"),
    pinyinSyllables: loadJson<any>("pinyin-syllables.json"),
    measureWords: loadJson<any>("measure-words.json"),
    componentEntries: loadJson<any>("component-entries.json"),
    demoPassages: loadJson<Phase2Passage>("demo-passages.json"),
    words: loadJson<any>("words.json"),
    characterReadings: loadJson<any>("character-readings.json"),
    characterRadicals: loadJson<any>("character-radicals.json"),
    characterHskLevels: loadJson<any>("character-hsk-levels.json"),
    wordHskLevels: loadJson<any>("word-hsk-levels.json"),
    wordCharacters: loadJson<any>("word-characters.json"),
    pinyinCharacterMappings: loadJson<any>("pinyin-character-mappings.json"),
    measureWordWords: loadJson<any>("measure-word-words.json"),
    characterComponents: loadJson<any>("character-components.json"),
    phoneticClusters: loadJson<any>("phonetic-clusters.json"),
    phoneticClusterMembers: loadJson<any>("phonetic-cluster-members.json"),
    strokeCategories: loadJson<any>("strokes-categories.json"),
    strokeExtendedTypes: loadJson<any>("strokes-extended-types.json"),
    strokeOrderRules: loadJson<any>("strokes-order-rules.json"),
    strokeCategoryRules: loadJson<any>("strokes-category-rules.json"),
  };
  const totalEntries = Object.values(phase2).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`   Loaded ${totalEntries} total entries across 20 files\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Character (103K — chunked) — no FK deps
  //    Map readings format and coreMeaning → definition
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📄 Step 1/17: Seeding Character...");
  // Note: phoneticComponentId contains glyphs (e.g., "从"), not character IDs.
  // Skipping until Phase 2 data is corrected to use character IDs.
  const characterData = phase2.characters.map((c) => ({
    id: c.id,
    glyph: c.glyph,
    strokeCount: c.strokeCount ?? 0,
    classification: c.classification,
    hskLevel: c.hskLevel,
    frequencyRank: c.frequencyRank,
    definition: c.coreMeaning || null,
    readings: (c.readings || []).map((r) => ({
      pinyin: r.pinyin,
      tone: r.tone,
      type: r.type,
      meaning: r.coreMeaning || null,
    })),
    etymology: c.etymology,
    commonWords: c.commonWords || [],
  }));
  await seedTable("Character", "character", characterData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PinyinSyllable (2K) — no FK deps (clear first for idempotency)
  //    Clears PinyinCharacterMapping too (FK depends on PinyinSyllable)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🎵 Step 2/17: Seeding PinyinSyllable...");
  await prisma.$executeRawUnsafe('DELETE FROM "PinyinCharacterMapping"');
  console.log("  🧹 Cleared PinyinCharacterMapping");
  await prisma.$executeRawUnsafe('DELETE FROM "PinyinSyllable"');
  console.log("  🧹 Cleared PinyinSyllable");
  await seedTable("PinyinSyllable", "pinyinSyllable", phase2.pinyinSyllables);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MeasureWord (52) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📏 Step 3/17: Seeding MeasureWord...");
  // Map Phase 2 fields: glyph→simplified, category, usageNote; drop hskLevel and nouns (go to MeasureWordWord)
  const measureWordData = phase2.measureWords.map((mw: any) => ({
    id: mw.id,
    simplified: mw.glyph,
    pinyin: mw.pinyin,
    meaning: mw.meaning,
    category: mw.category ?? null,
    usageNote: mw.usageNote ?? null,
  }));
  await seedTable("MeasureWord", "measureWord", measureWordData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Component (0 — deferred, skip gracefully) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🧩 Step 4/17: Seeding Component...");
  await seedTable("Component", "component", phase2.componentEntries);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Passage (6) — no FK deps
  //    Enrich with passageIndex, knownWordRatio, targetHskLevel, sentence index
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📖 Step 5/17: Seeding Passage...");
  const passageData = phase2.demoPassages.map((p, i) => {
    const enrichedSentences = (p.content?.sentences || []).map((s, si) => ({
      index: si,
      text: s.text,
      words: (s.words || []).map((w: string) => ({ glyph: w, wordId: null })),
    }));
    return {
      id: p.id,
      hskLevel: p.hskLevel,
      passageIndex: i,
      title: p.title,
      content: {
        sentences: enrichedSentences,
        metadata: {
          total_sentences: enrichedSentences.length,
          total_words: p.metadata?.wordCount || 0,
          unique_chars: [] as string[],
          vocab_hsk_levels: [p.hskLevel],
        },
      },
      wordCount: p.metadata?.wordCount || 0,
      knownWordRatio: 1.0,
      targetHskLevel: p.hskLevel,
    };
  });
  await seedTable("Passage", "passage", passageData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Word (11K — chunked) — no FK deps
  //    Strip extra fields not in Prisma model (characters[], sequenceOrder[], etc.)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📝 Step 6/17: Seeding Word...");
  const wordData: Phase2Word[] = phase2.words.map((w: any) => ({
    id: w.id,
    simplified: w.simplified,
    pinyin: w.pinyin,
    meaning: w.meaning,
    hskLevel: w.hskLevel,
    frequencyRank: w.frequencyRank,
    wordClass: w.wordClass,
  }));
  await seedTable("Word", "word", wordData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 7. StrokeCategory (5) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 7/21: Seeding StrokeCategory...");
  const strokeCategories = loadJson<any>("strokes-categories.json");
  await seedTable("StrokeCategory", "strokeCategory", strokeCategories);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 8. StrokeExtendedType (8) — FK → StrokeCategory
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 8/21: Seeding StrokeExtendedType...");
  const strokeExtendedTypes = loadJson<any>("strokes-extended-types.json");
  await seedTable("StrokeExtendedType", "strokeExtendedType", strokeExtendedTypes);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 9. StrokeOrderRule (5) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 9/21: Seeding StrokeOrderRule...");
  const strokeOrderRules = loadJson<any>("strokes-order-rules.json");
  await seedTable("StrokeOrderRule", "strokeOrderRule", strokeOrderRules);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 10. StrokeCategoryOrderRule (~10-15) — FK → StrokeCategory + StrokeOrderRule
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 10/21: Seeding StrokeCategoryOrderRule...");
  const categoryRules = loadJson<any>("strokes-category-rules.json");
  await seedTable("StrokeCategoryOrderRule", "strokeCategoryOrderRule", categoryRules);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 11. CharacterReading (15K — chunked) — FK → Character
  //    Pre-clear for idempotency (no unique constraint beyond id)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔤 Step 11/21: Seeding CharacterReading...");
  console.log("  🧹 Cleared CharacterReading (pre-clear for idempotency)");
  await prisma.characterReading.deleteMany();
  await seedTable("CharacterReading", "characterReading", phase2.characterReadings);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 12. CharacterRadical (2.8K) — FK → Character
  //    @@unique([characterGlyph, radicalId]) requires skip-duplicate logic
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 12/21: Seeding CharacterRadical...");
  const existingRadicals = new Set(
    (
      await prisma.characterRadical.findMany({
        select: { characterGlyph: true, radicalId: true },
      })
    ).map((r) => `${r.characterGlyph}_${r.radicalId}`),
  );
  const newRadicals = phase2.characterRadicals.filter(
    (r: { characterGlyph: string; radicalId: string }) =>
      !existingRadicals.has(`${r.characterGlyph}_${r.radicalId}`),
  );
  await seedTable("CharacterRadical", "characterRadical", newRadicals);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 13. CharacterHskLevel (3K) — FK → Character (@id on characterId)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏷️ Step 13/21: Seeding CharacterHskLevel...");
  await seedTable("CharacterHskLevel", "characterHskLevel", phase2.characterHskLevels, {
    chunkSize: 1_000,
  });
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 14. WordHskLevel (11K — chunked) — FK → Word (@id on wordId)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏷️ Step 14/21: Seeding WordHskLevel...");
  const wordHskData = phase2.wordHskLevels.map((whl: any) => ({
    wordId: whl.wordId,
    hskLevel: whl.hskLevel,
    hskVersion: whl.hskVersion || "3.0",
  }));
  await seedTable("WordHskLevel", "wordHskLevel", wordHskData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 15. WordCharacter (22K — chunked) — FK → Word + Character
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 15/21: Seeding WordCharacter...");
  await seedTable("WordCharacter", "wordCharacter", phase2.wordCharacters);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 16. PinyinCharacterMapping (11K — chunked) — FK → PinyinSyllable + Character
  //     PinyinCharacterMapping was already cleared in step 2, so just insert
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 16/21: Seeding PinyinCharacterMapping...");
  await seedTable(
    "PinyinCharacterMapping",
    "pinyinCharacterMapping",
    phase2.pinyinCharacterMappings,
  );
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 17. MeasureWordWord (135) — FK → MeasureWord + Word
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 17/21: Seeding MeasureWordWord...");
  await seedTable("MeasureWordWord", "measureWordWord", phase2.measureWordWords);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 18. CharacterComponent (0 — deferred, skip gracefully) — FK → Character + Component
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🧩 Step 18/21: Seeding CharacterComponent...");
  await seedTable("CharacterComponent", "characterComponent", phase2.characterComponents);
  console.log("");

  // ── 19. PhoneticCluster — FK → Component
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔊 Step 19/21: Seeding PhoneticCluster...");
  await seedTable("PhoneticCluster", "phoneticCluster", phase2.phoneticClusters);
  console.log("");

  // ── 20. PhoneticClusterMember — FK → PhoneticCluster + Character
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 20/21: Seeding PhoneticClusterMember...");
  await seedTable("PhoneticClusterMember", "phoneticClusterMember", phase2.phoneticClusterMembers);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 21. Test users (dev only)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👤 Step 21/21: Creating test users...");
  if (process.env.NODE_ENV !== "production") {
    await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test1234!", 10),
        displayName: "Test User",
      },
    });

    await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        passwordHash: await bcrypt.hash("Demo1234!", 10),
        displayName: "Demo User",
      },
    });

    console.log("  ✅ Test users created\n");
  } else {
    console.log("  ⏭️  Skipping test users (production)\n");
  }

  console.log("═══════════════════════════════════════════════");
  console.log("🎉 Database seed completed successfully!");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch((e: Error) => {
    console.error("❌ Seed failed:", (e as any).code || "ERROR", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
