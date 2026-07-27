/**
 * @file apps/backend/scripts/database/populate-stroke-counts.ts
 * @description Correct Character.strokeCount using Unihan kTotalStrokes data.
 *
 * Downloads Unihan_IRGSources.txt from Unicode.org, parses kTotalStrokes
 * for each CJK character, and updates Character records where the Unihan
 * value differs from the current value.
 *
 * Idempotent: safe to re-run. Reports summary of corrections.
 *
 * Run: cd apps/backend && npx tsx scripts/database/populate-stroke-counts.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CACHE_DIR = path.join(PROJECT_ROOT, "data", "unihan-cache");

// ── Unihan Data Source ──────────────────────────────────────────────────────

// The Unihan.zip archive contains multiple files including Unihan_IRGSources.txt
// which has the kTotalStrokes field.
const UNIHAN_ZIP_URL = "https://unicode.org/Public/UCD/latest/ucd/Unihan.zip";

const CACHE_ZIP = path.join(CACHE_DIR, "Unihan.zip");
const CACHE_FILE = path.join(CACHE_DIR, "Unihan_IRGSources.txt");

// ── Fetch or Load Cached ────────────────────────────────────────────────────

async function fetchUnihanData(): Promise<string> {
  // Check cache first
  if (fs.existsSync(CACHE_FILE)) {
    const cached = fs.readFileSync(CACHE_FILE, "utf-8");
    const lineCount = cached.split("\n").length;
    console.log(`  📄 Using cached IRGSources (${lineCount} lines)`);
    return cached;
  }

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Download the zip file if not cached
  if (!fs.existsSync(CACHE_ZIP)) {
    console.log(`  🌐 Downloading Unihan.zip from ${UNIHAN_ZIP_URL}...`);
    const response = await fetch(UNIHAN_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Failed to download Unihan.zip: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(CACHE_ZIP, buffer);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
    console.log(`  📥 Downloaded ${sizeMB} MB to ${CACHE_ZIP}`);
  } else {
    console.log(`  📄 Using cached zip: ${CACHE_ZIP}`);
  }

  // Extract Unihan_IRGSources.txt from the zip
  console.log("  📦 Extracting Unihan_IRGSources.txt from zip...");
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(CACHE_ZIP);
  const entry = zip.getEntry("Unihan_IRGSources.txt");
  if (!entry) {
    throw new Error("Unihan_IRGSources.txt not found in zip archive");
  }
  const text = entry.getData().toString("utf-8");
  const sizeKB = (text.length / 1024).toFixed(0);
  console.log(`  📄 Extracted ${sizeKB} KB`);

  // Cache the extracted text
  fs.writeFileSync(CACHE_FILE, text, "utf-8");
  console.log(`  💾 Cached extracted text to ${CACHE_FILE}`);

  return text;
}

// ── Parse kTotalStrokes ────────────────────────────────────────────────────

function parseStrokeCounts(unihanText: string): Map<string, number> {
  const strokeMap = new Map<string, number>();
  const lines = unihanText.split("\n");

  // Format: U+4E00\tkTotalStrokes\t5
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [codePoint, field, value] = parts;
    if (field !== "kTotalStrokes") continue;

    // Parse code point: "U+4E00" → "U+4E00"
    const hexStr = codePoint.trim();
    if (!hexStr.startsWith("U+")) continue;

    const codePointInt = parseInt(hexStr.substring(2), 16);
    if (isNaN(codePointInt)) continue;

    const glyph = String.fromCodePoint(codePointInt);

    const strokeCount = parseInt(value.trim(), 10);
    if (isNaN(strokeCount) || strokeCount < 1 || strokeCount > 64) continue;

    strokeMap.set(glyph, strokeCount);
  }

  return strokeMap;
}

// ── Main ────────────────────────────────────────────────────────────────────

interface Correction {
  characterId: string;
  glyph: string;
  oldStrokeCount: number;
  newStrokeCount: number;
}

async function main(): Promise<void> {
  console.log("📏 Populating Stroke Counts from Unihan");
  console.log("══════════════════════════════════════════\n");

  // ── Step 1: Fetch Unihan data ──

  console.log("🔍 Fetching Unihan data...");
  const unihanText = await fetchUnihanData();
  const strokeMap = parseStrokeCounts(unihanText);
  console.log(`  📊 Parsed ${strokeMap.size} stroke count entries from Unihan`);

  if (strokeMap.size === 0) {
    console.error("  ❌ No stroke count data parsed. Aborting.");
    process.exit(1);
  }

  // ── Step 2: Fetch all characters from DB ──

  console.log("\n📊 Fetching characters from DB...");

  const allChars = await prisma.character.findMany({
    select: { id: true, glyph: true, strokeCount: true },
  });
  console.log(`  📄 ${allChars.length} characters in DB`);

  // ── Step 3: Find corrections ──

  console.log("\n🔧 Computing corrections...");

  const corrections: Correction[] = [];
  let unihanNotFound = 0;
  let alreadyCorrect = 0;

  for (const c of allChars) {
    const unihanStroke = strokeMap.get(c.glyph);
    if (unihanStroke === undefined) {
      unihanNotFound++;
      continue;
    }

    if (c.strokeCount === unihanStroke) {
      alreadyCorrect++;
      continue;
    }

    corrections.push({
      characterId: c.id,
      glyph: c.glyph,
      oldStrokeCount: c.strokeCount,
      newStrokeCount: unihanStroke,
    });
  }

  console.log(`  ✅ Already correct: ${alreadyCorrect}`);
  console.log(`  ❌ Needs correction: ${corrections.length}`);
  console.log(`  ⚠️  No Unihan data: ${unihanNotFound}`);

  if (corrections.length === 0) {
    console.log("\n✅ No corrections needed. All stroke counts match Unihan.");
    await prisma.$disconnect();
    return;
  }

  // Show some samples of corrections
  console.log("\n  Sample corrections:");
  for (const c of corrections.slice(0, 15)) {
    console.log(`    "${c.glyph}" (${c.characterId}): ${c.oldStrokeCount} → ${c.newStrokeCount}`);
  }
  if (corrections.length > 15) {
    console.log(`    ... and ${corrections.length - 15} more`);
  }

  // ── Step 4: Apply corrections ──

  console.log("\n💾 Applying corrections...");

  const BATCH_SIZE = 500;
  let updated = 0;

  // Find characters that had strokeCount: 0 (placeholder from seed-word.js)
  const zeroToReal = corrections.filter((c) => c.oldStrokeCount === 0);
  console.log(`  🆕 Characters with strokeCount=0 → real value: ${zeroToReal.length}`);

  for (let i = 0; i < corrections.length; i += BATCH_SIZE) {
    const batch = corrections.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((c) =>
        prisma.character.update({
          where: { id: c.characterId },
          data: { strokeCount: c.newStrokeCount },
        }),
      ),
    );
    updated += batch.length;
    if (updated % 1000 === 0 || updated === corrections.length) {
      console.log(`  Progress: ${updated}/${corrections.length} characters updated`);
    }
  }

  // ── Step 5: Regenerate characters.json ──

  console.log("\n📝 Regenerating content/characters/characters.json...");

  const charsForFile = await prisma.character.findMany({
    select: {
      id: true,
      glyph: true,
      traditional: true,
      strokeCount: true,
      readings: true,
      hskLevel: true,
      classification: true,
      etymology: true,
      frequencyRank: true,
      commonWords: true,
      phoneticComponentId: true,
    },
    orderBy: { id: "asc" },
  });

  const characterEntries = charsForFile.map((c) => ({
    id: c.id,
    glyph: c.glyph,
    traditional: c.traditional,
    strokeCount: c.strokeCount,
    pinyin: (c.readings as any[])?.[0]?.pinyin || null,
    readings: c.readings,
    hskLevel: c.hskLevel,
    classification: c.classification,
    etymology: c.etymology,
    frequencyRank: c.frequencyRank,
    commonWords: c.commonWords,
    phoneticComponentId: c.phoneticComponentId,
  }));

  const contentDir = path.join(PROJECT_ROOT, "content", "characters");
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  const now = new Date().toISOString();

  // Write characters.json
  const charFile = {
    version: 1,
    updated_at: now,
    characters: characterEntries,
  };
  const charJsonPath = path.join(contentDir, "characters.json");
  const tmpPath = charJsonPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(charFile, null, 2), "utf-8");
  fs.renameSync(tmpPath, charJsonPath);
  console.log(`  ✅ Wrote characters.json (${characterEntries.length} characters)`);

  // Write index.json (glyph → characterId lookup)
  const indexMap: Record<string, string> = {};
  for (const c of charsForFile) {
    indexMap[c.glyph] = c.id;
  }
  const indexData = {
    version: 1,
    updated_at: now,
    glyph_to_id: indexMap,
  };
  const indexPath = path.join(contentDir, "index.json");
  const tmpIndexPath = indexPath + ".tmp";
  fs.writeFileSync(tmpIndexPath, JSON.stringify(indexData, null, 2), "utf-8");
  fs.renameSync(tmpIndexPath, indexPath);
  console.log(`  ✅ Wrote index.json (${Object.keys(indexMap).length} lookups)`);

  // ── Summary ──

  // Category statistics
  const zeroFixed = corrections.filter((c) => c.oldStrokeCount === 0).length;
  const wrongFixed = corrections.length - zeroFixed;

  // Most common wrong values
  const wrongValueCounts: Record<string, number> = {};
  for (const c of corrections) {
    const key = `${c.oldStrokeCount}→${c.newStrokeCount}`;
    wrongValueCounts[key] = (wrongValueCounts[key] || 0) + 1;
  }

  // Verify final state
  const stillZero = await prisma.character.count({
    where: { strokeCount: { lte: 0 } },
  });

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ Stroke Count Correction Complete");
  console.log("══════════════════════════════════════════════\n");
  console.log(`  Total corrections: ${corrections.length}`);
  console.log(`    - StrokeCount=0 → real: ${zeroFixed}`);
  console.log(`    - Wrong value corrected: ${wrongFixed}`);
  console.log(`  Characters still with strokeCount≤0: ${stillZero}`);
  console.log(`  Characters with no Unihan match: ${unihanNotFound}`);

  console.log(`\n  Top corrections:`);
  const sorted = Object.entries(wrongValueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [change, count] of sorted) {
    console.log(`    ${change}: ${count} characters`);
  }

  // Verify specific characters mentioned in the audit
  const verifyChars = ["丁", "七", "万", "丈", "且", "事"];
  console.log(`\n  Verification spot-checks:`);
  for (const glyph of verifyChars) {
    const c = corrections.find((c) => c.glyph === glyph);
    if (c) {
      console.log(`    "${glyph}": ${c.oldStrokeCount} → ${c.newStrokeCount} ✅`);
    } else {
      const dbChar = allChars.find((c) => c.glyph === glyph);
      const unihan = strokeMap.get(glyph);
      console.log(
        `    "${glyph}": DB=${dbChar?.strokeCount}, Unihan=${unihan}` +
          (dbChar?.strokeCount === unihan ? " ✅" : " ⚠️"),
      );
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
