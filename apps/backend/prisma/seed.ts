/**
 * @file apps/backend/prisma/seed.ts
 * @description Database seed script — Phase 3 bulk-insert pipeline.
 *
 * Reads per-table JSON files from content/seed/phase2/ and bulk-inserts
 * into the database using the hash-gated delta sync (syncTable / syncDerived /
 * syncGrammar) — see sync-helpers.ts. Steady-state re-runs write 0 rows.
 *
 * Run via: npx prisma db seed (from apps/backend) — uses "seed" config in package.json
 * Or:       npx tsx prisma/seed.ts (with DATABASE_URL set)
 *
 * Seed order (strict dependency):
 *   1. Character              ← no FK deps
 *   2. Radical                ← no FK deps (20 records)
 *   3. Tone                   ← no FK deps (5 records)
 *   4. PinyinPhoneme          ← no FK deps (50 records)
 *   5. TonePair               ← no FK deps (6 records)
 *   6. ToneRule               ← no FK deps (3 records)
 *   7. PinyinSyllable         ← no FK deps (hash-gated delta sync)
 *   8. MeasureWord            ← no FK deps
 *   9. Component              ← no FK deps (1,777 records)
 *   10. Passage               ← no FK deps
 *   11. Word                  ← no FK deps
 *   12. StrokeCategory        ← no FK deps
 *   13. StrokeExtendedType    ← FK → StrokeCategory
 *   14. StrokeOrderRule       ← no FK deps
 *   15. StrokeCategoryOrderRule ← FK → StrokeCategory + StrokeOrderRule
 *   16. CharacterReading      ← FK → Character
 *   17. CharacterRadical      ← FK → Character + Radical
 *   18. CharacterHskLevel     ← FK → Character
 *   19. WordHskLevel          ← FK → Word
 *   20. WordCharacter         ← FK → Word + Character
 *   21. PinyinCharacterMapping ← FK → PinyinSyllable + Character
 *   22. MeasureWordWord       ← FK → MeasureWord + Word
 *   23. CharacterComponent    ← FK → Character + Component (15,742 records)
 *   24. PhoneticCluster       ← FK → Component
 *   25. PhoneticClusterMember ← FK → PhoneticCluster + Character
 *   26. Test users            — dev only
 *   27. GrammarPattern          ← no FK deps (21 KB-sourced patterns; unique content_id "gr_XXXX")
 *   28. GrammarExample          ← FK → GrammarPattern.content_id ("gr_XXXX_exN")
 *   29. GrammarPatternRelation  ← FK → GrammarPattern.content_id (both ends)
 *   30. Chengyu                 ← no FK deps (50+ CC-CEDICT-extracted + curated idioms; unique content_id "cy_XXXX")
 *   31. ChengyuExample          ← FK → Chengyu.content_id ("cy_XXXX_exN")
 *   32. ChengyuRelation         ← FK → Chengyu.content_id (both ends)
 *
 *   Post-seed: VALIDATE "CharacterRadical_radicalId_fkey" (created NOT VALID by
 *   migration 20260731045648_add_reference_tables — see docs/guides/data/seed-pipeline.md §2).
 *   Post-seed: Grammar verification (patterns ≥ 21 / examples ≥ 63 / relations ≥ 0
 *   + FK-orphan check) — see the SQL block near the end of main().
 *   Post-seed: Chengyu verification (idioms ≥ 50 / examples ≥ 50 / relations ≥ 0
 *   + FK-orphan check) — see the SQL block near the end of main().
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { prisma } from "../scripts/client.js";
import {
  syncTable,
  syncDerived,
  syncCharacter,
  syncGrammar,
  syncChengyu,
  mapWordHskLevels,
  mapWordRows,
  wordCfg,
  characterRadicalCfg,
  componentCfg,
  derivedConfigs,
  measureWordCfg,
  measureWordWordCfg,
  passageCfg,
  phoneticClusterCfg,
  pinyinPhonemeCfg,
  pinyinSyllableCfg,
  radicalCfg,
  strokeCategoryCfg,
  strokeCategoryOrderRuleCfg,
  strokeExtendedTypeCfg,
  strokeOrderRuleCfg,
  toneCfg,
  tonePairCfg,
  toneRuleCfg,
} from "./sync-helpers.js";

// ── Paths ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHASE2_DIR = path.resolve(__dirname, "../../../content/seed/phase2/");

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(PHASE2_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filename} — treating as empty`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
}

function loadJsonObject<T>(filename: string): T | null {
  const filePath = path.join(PHASE2_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filename} — treating as empty`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
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

// ── Phase 2 grammar file shape (Epic 22 — Story 22.1) ──
// grammar-patterns.json = { patterns: GrammarPatternRow[], relations: GrammarRelationRow[] }
// where each pattern nests its own examples (GrammarExampleRow). The seed flattens
// these into the three Prisma tables in dependency order.
interface GrammarPatternRow {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  examples?: GrammarExampleRow[];
}

interface GrammarExampleRow {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: unknown[];
}

interface GrammarRelationRow {
  fromPatternContentId: string;
  toPatternContentId: string;
  relationType: string;
  metadata?: Record<string, unknown> | null;
}

// ── Phase 2 chengyu file shape (Epic 23 — Story 23.1) ──
// chengyu.json = { idioms: ChengyuRow[], relations: ChengyuRelationRow[] }
// where each idiom nests its own modern-usage examples (ChengyuExampleRow). The
// seed flattens these into the three Prisma tables in dependency order via
// syncChengyu (hash-gated delta sync, mirroring syncGrammar).
interface ChengyuExampleRow {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: unknown[];
}

interface ChengyuRow {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  examples?: ChengyuExampleRow[];
}

interface ChengyuRelationRow {
  fromChengyuContentId: string;
  toChengyuContentId: string;
  relationType: string;
  metadata?: Record<string, unknown> | null;
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
    radicals: loadJson<any>("radicals.json"),
    tones: loadJson<any>("tones.json"),
    pinyinPhonemes: loadJson<any>("pinyin-phonemes.json"),
    tonePairs: loadJson<any>("tone-pairs.json"),
    toneRules: loadJson<any>("tone-rules.json"),
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
  console.log(`   Loaded ${totalEntries} total entries across 25 files\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Character (103K — bulk hash-gate) — no FK deps.
  //    Routed through syncCharacter: syncTable's bulk path (>5K threshold →
  //    chunked raw INSERT ... ON CONFLICT DO UPDATE gated on content_hash),
  //    then the deferred 2-pass phonetic linking (which does NOT touch
  //    content_hash). Map readings format and coreMeaning → definition.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📄 Step 1/29: Syncing Character (hash-gated delta sync)...");
  await syncCharacter(prisma, phase2.characters);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Radical (20) — no FK deps. Reference table (all-in-DB).
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📛 Step 2/29: Syncing Radical...");
  await syncTable(prisma, radicalCfg, phase2.radicals);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Tone (5) — no FK deps. Reference table.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🎼 Step 3/29: Syncing Tone...");
  await syncTable(prisma, toneCfg, phase2.tones);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PinyinPhoneme (50) — no FK deps. Reference table (18 init + 32 fin).
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔡 Step 4/29: Syncing PinyinPhoneme...");
  await syncTable(prisma, pinyinPhonemeCfg, phase2.pinyinPhonemes);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 5. TonePair (6) — no FK deps. Tone-sandhi example pairs.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🎚️ Step 5/29: Syncing TonePair...");
  await syncTable(prisma, tonePairCfg, phase2.tonePairs);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 6. ToneRule (3) — no FK deps. Tone-sandhi rules (examples as Json).
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📐 Step 6/29: Syncing ToneRule...");
  await syncTable(prisma, toneRuleCfg, phase2.toneRules);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 7. PinyinSyllable (2K) — no FK deps (hash-gated delta sync)
  //    (PinyinCharacterMapping is a Bucket-B derived projection, rebuilt at step 21)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🎵 Step 7/29: Syncing PinyinSyllable...");
  // No pre-clear needed — the hash-gated diff handles additions/edits, and
  // PinyinCharacterMapping (a Bucket-B derived projection) is rebuilt at step 21.
  await syncTable(prisma, pinyinSyllableCfg, phase2.pinyinSyllables);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 8. MeasureWord (52) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📏 Step 8/29: Syncing MeasureWord...");
  // Map Phase 2 fields: glyph→simplified, category, usageNote; drop hskLevel and nouns (go to MeasureWordWord)
  const measureWordData = phase2.measureWords.map((mw: any) => ({
    id: mw.id,
    simplified: mw.glyph,
    pinyin: mw.pinyin,
    meaning: mw.meaning,
    category: mw.category ?? null,
    usageNote: mw.usageNote ?? null,
  }));
  await syncTable(prisma, measureWordCfg, measureWordData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Component (1,777) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🧩 Step 9/29: Syncing Component...");
  await syncTable(prisma, componentCfg, phase2.componentEntries);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Passage (6) — no FK deps
  //    Enrich with passageIndex, knownWordRatio, targetHskLevel, sentence index
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📖 Step 10/29: Seeding Passage...");
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
  await syncTable(prisma, passageCfg, passageData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Word (11K) — no FK deps.
  //     Hash-gated delta sync. First run backfills content_hash (bulk path —
  //     10,943 > 5,000 threshold); steady state writes 0.
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📝 Step 11/29: Syncing Word (hash-gated delta sync)...");
  const wordData = mapWordRows(phase2.words);
  await syncTable(prisma, wordCfg, wordData);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 12. StrokeCategory (5) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 12/29: Syncing StrokeCategory...");
  const strokeCategories = loadJson<any>("strokes-categories.json");
  await syncTable(prisma, strokeCategoryCfg, strokeCategories);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 13. StrokeExtendedType (8) — FK → StrokeCategory
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 13/29: Syncing StrokeExtendedType...");
  const strokeExtendedTypes = loadJson<any>("strokes-extended-types.json");
  await syncTable(prisma, strokeExtendedTypeCfg, strokeExtendedTypes);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 14. StrokeOrderRule (5) — no FK deps
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 14/29: Syncing StrokeOrderRule...");
  const strokeOrderRules = loadJson<any>("strokes-order-rules.json");
  await syncTable(prisma, strokeOrderRuleCfg, strokeOrderRules);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 15. StrokeCategoryOrderRule (~10-15) — FK → StrokeCategory + StrokeOrderRule
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔴 Step 15/29: Syncing StrokeCategoryOrderRule...");
  const categoryRules = loadJson<any>("strokes-category-rules.json");
  await syncTable(prisma, strokeCategoryOrderRuleCfg, categoryRules);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 16. CharacterReading (15K — chunked) — FK → Character
  //    Pre-clear for idempotency (no unique constraint beyond id)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔤 Step 16/29: Syncing CharacterReading (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.characterReading, phase2.characterReadings);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 17. CharacterRadical (2.8K) — FK → Character
  //    @@unique([characterGlyph, radicalId]) requires skip-duplicate logic
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 17/29: Syncing CharacterRadical (composite key)...");
  await syncTable(prisma, characterRadicalCfg, phase2.characterRadicals);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 18. CharacterHskLevel (3K) — FK → Character (@id on characterId)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏷️ Step 18/29: Syncing CharacterHskLevel (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.characterHskLevel, phase2.characterHskLevels);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 19. WordHskLevel (11K — chunked) — FK → Word (@id on wordId)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏷️ Step 19/29: Syncing WordHskLevel (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.wordHskLevel, mapWordHskLevels(phase2.wordHskLevels));
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 20. WordCharacter (22K — chunked) — FK → Word + Character
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 20/29: Syncing WordCharacter (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.wordCharacter, phase2.wordCharacters);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 21. PinyinCharacterMapping (11K — chunked) — FK → PinyinSyllable + Character
  //     Bucket-B derived projection — SeedCheckpoint-gated delete+rebuild (no pre-clear needed)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 21/29: Syncing PinyinCharacterMapping (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.pinyinCharacterMapping, phase2.pinyinCharacterMappings);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 22. MeasureWordWord (135) — FK → MeasureWord + Word
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 22/29: Syncing MeasureWordWord (composite key)...");
  await syncTable(prisma, measureWordWordCfg, phase2.measureWordWords);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 23. CharacterComponent (15,742) — FK → Character + Component
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🧩 Step 23/29: Syncing CharacterComponent (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.characterComponent, phase2.characterComponents);
  console.log("");

  // ── 19. PhoneticCluster — FK → Component
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔊 Step 24/29: Syncing PhoneticCluster...");
  await syncTable(prisma, phoneticClusterCfg, phase2.phoneticClusters);
  console.log("");

  // ── 20. PhoneticClusterMember — FK → PhoneticCluster + Character
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔗 Step 25/29: Syncing PhoneticClusterMember (derived rebuild)...");
  await syncDerived(prisma, derivedConfigs.phoneticClusterMember, phase2.phoneticClusterMembers);
  console.log("");

  // ──────────────────────────────────────────────────────────────────────────
  // 26. Test users (dev only)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👤 Step 26/29: Creating test users...");
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

  // ──────────────────────────────────────────────────────────────────────────
  // 22. Grammar (Epic 22 — Story 22.1) — Steps 27–29 via the hash-gated delta
  //     sync (syncGrammar). Patterns → Examples → Relations in ONE interactive
  //     transaction. Replaces the blind createMany skipDuplicates path (which
  //     silently kept stale edits — the Story 22.1 bug) with a content-hash
  //     diff: unchanged rows write 0, edited rows propagate + bump
  //     content_version, NULL-hash rows reconcile without a version bump.
  // ──────────────────────────────────────────────────────────────────────────
  const grammar = loadJsonObject<{
    patterns: GrammarPatternRow[];
    relations: GrammarRelationRow[];
  }>("grammar-patterns.json");

  if (grammar) {
    console.log("📚 Steps 27–29/29: Syncing Grammar (Pattern → Example → Relation)...");
    await syncGrammar(prisma, grammar);
    console.log("");
  } else {
    console.log("  ⏭️  grammar-patterns.json not found — skipping grammar sync\n");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 30–32. Chengyu (Epic 23 — Story 23.1) via the hash-gated delta sync
  //     (syncChengyu). Idioms → Examples → Relations in ONE interactive
  //     transaction. Mirrors syncGrammar: unchanged rows write 0, edited rows
  //     propagate + bump content_version, NULL-hash rows reconcile without a
  //     version bump. Post-seed SQL verification (counts + FK integrity) below.
  // ──────────────────────────────────────────────────────────────────────────
  const chengyu = loadJsonObject<{
    idioms: ChengyuRow[];
    relations: ChengyuRelationRow[];
  }>("chengyu.json");

  if (chengyu) {
    console.log("📚 Steps 30–32/32: Syncing Chengyu (Idiom → Example → Relation)...");
    await syncChengyu(prisma, chengyu);
    console.log("");
  } else {
    console.log("  ⏭️  chengyu.json not found — skipping chengyu sync\n");
  }

  // ── Post-seed chengyu verification (counts + FK integrity) ──
  // Counts are informational — the seed stays safe to re-run regardless. The
  // FK-orphan check must return 0 rows or the seed data has a referential bug.
  console.log("📊 Post-seed: Chengyu counts + FK integrity...");
  const chengyuCounts = await prisma.$queryRaw<
    Array<{
      idiomCount: bigint;
      exampleCount: bigint;
      relationCount: bigint;
      orphanCount: bigint;
    }>
  >`
    SELECT
      (SELECT COUNT(*) FROM "Chengyu") AS "idiomCount",
      (SELECT COUNT(*) FROM "ChengyuExample") AS "exampleCount",
      (SELECT COUNT(*) FROM "ChengyuRelation") AS "relationCount",
      (SELECT COUNT(*) FROM "ChengyuExample" e
        LEFT JOIN "Chengyu" c ON e."chengyuContentId" = c."content_id"
        WHERE c."content_id" IS NULL) AS "orphanCount"
  `;
  const cc = chengyuCounts[0] ?? {
    idiomCount: 0n,
    exampleCount: 0n,
    relationCount: 0n,
    orphanCount: 0n,
  };
  if (Number(cc.idiomCount) < 50 || Number(cc.exampleCount) < 50) {
    console.warn(
      `  ⚠️  Chengyu below authoring targets (idioms=${Number(cc.idiomCount)}, examples=${Number(cc.exampleCount)}) — expected ≥50 / ≥50`,
    );
  } else {
    console.log(
      `  ✅ Chengyu counts OK: idioms=${Number(cc.idiomCount)}, examples=${Number(cc.exampleCount)}, relations=${Number(cc.relationCount)}`,
    );
  }
  if (Number(cc.orphanCount) > 0) {
    console.warn(
      `  ⚠️  ${Number(cc.orphanCount)} orphan ChengyuExample rows (chengyuContentId has no Chengyu)`,
    );
  } else {
    console.log("  ✅ Chengyu FK integrity OK: 0 orphan examples\n");
  }

  // ── Post-seed grammar verification (counts + FK integrity) ──
  // Counts are informational — the seed stays safe to re-run regardless. The
  // FK-orphan check must return 0 rows or the seed data has a referential bug.
  console.log("📊 Post-seed: Grammar counts + FK integrity...");
  const grammarCounts = await prisma.$queryRaw<
    Array<{
      patternCount: bigint;
      exampleCount: bigint;
      relationCount: bigint;
      orphanCount: bigint;
    }>
  >`
    SELECT
      (SELECT COUNT(*) FROM "GrammarPattern") AS "patternCount",
      (SELECT COUNT(*) FROM "GrammarExample") AS "exampleCount",
      (SELECT COUNT(*) FROM "GrammarPatternRelation") AS "relationCount",
      (SELECT COUNT(*) FROM "GrammarExample" e
        LEFT JOIN "GrammarPattern" p ON e."patternContentId" = p."content_id"
        WHERE p."content_id" IS NULL) AS "orphanCount"
  `;
  const gc = grammarCounts[0] ?? {
    patternCount: 0n,
    exampleCount: 0n,
    relationCount: 0n,
    orphanCount: 0n,
  };
  const toNum = (v: bigint): number => Number(v);
  if (toNum(gc.patternCount) < 21 || toNum(gc.exampleCount) < 63) {
    console.warn(
      `  ⚠️  Grammar below authoring targets (patterns=${toNum(gc.patternCount)}, examples=${toNum(gc.exampleCount)}) — expected ≥21 / ≥63`,
    );
  } else {
    console.log(
      `  ✅ Grammar counts OK: patterns=${toNum(gc.patternCount)}, examples=${toNum(gc.exampleCount)}, relations=${toNum(gc.relationCount)}`,
    );
  }
  if (toNum(gc.orphanCount) > 0) {
    console.warn(
      `  ⚠️  ${toNum(gc.orphanCount)} orphan GrammarExample rows (patternContentId has no GrammarPattern)`,
    );
  } else {
    console.log("  ✅ Grammar FK integrity OK: 0 orphan examples\n");
  }

  // ── Post-seed FK validation (part of step 26 / post-seed verification) ──
  // ────────────────────────────────────────────────────────────────────────────
  // Migration 20260731045648_add_reference_tables created
  // "CharacterRadical_radicalId_fkey" NOT VALID because Radical was empty at
  // migration time while CharacterRadical already held rows. Seed step 17 now
  // guarantees every radicalId maps to one of the 20 curated radicals, so
  // validate the constraint to enforce referential integrity on the pre-existing
  // rows. Guarded by the pg_constraint.convalidated flag — PostgreSQL errors if
  // VALIDATE runs on an already-valid constraint, so this keeps the seed safe
  // to re-run.
  console.log("🔐 Post-seed: Validating CharacterRadical_radicalId_fkey...");
  const [{ convalidated }] = await prisma.$queryRaw<{ convalidated: boolean }[]>`
    SELECT convalidated
    FROM pg_constraint
    WHERE conname = 'CharacterRadical_radicalId_fkey'
  `;
  if (convalidated) {
    console.log("  ⏭️  Already validated — skipping\n");
  } else {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "CharacterRadical" VALIDATE CONSTRAINT "CharacterRadical_radicalId_fkey"',
    );
    console.log("  ✅ CharacterRadical_radicalId_fkey validated\n");
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
