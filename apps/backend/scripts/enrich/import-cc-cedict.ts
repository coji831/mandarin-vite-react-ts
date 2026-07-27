/**
 * @file apps/backend/scripts/database/import-cc-cedict.ts
 * @description Import CC-CEDICT data to enrich Word, Character readings,
 *   and PinyinCharacterMapping tables.
 *
 * Dual mode:
 *   Standalone: npx tsx scripts/database/import-cc-cedict.ts (from apps/backend)
 *   Import:     import { importCcCedict } from "./import-cc-cedict.js"
 *
 * CC-CEDICT format:
 *   Trad  Simp [pinyin] /def1/def2/
 *   Pinyin uses tone numbers (hao3), u: for ü (nu:3 → nǚ)
 *
 * Idempotent: uses upsert patterns throughout.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ──────────────────────────────────────────────────────────────────

interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyinRaw: string;
  definitions: string[];
}

interface Decomposition {
  glyph: string;
  pinyin: string; // with tone mark
  tone: number;
  syllable: string; // with tone number
}

interface ImportResult {
  totalParsed: number;
  skippedComments: number;
  skippedNonChinese: number;
  wordsEnrichedPinyin: number;
  wordsEnrichedMeaning: number;
  wordsEnrichedWordClass: number;
  charactersEnriched: number;
  pinyinMappingsCreated: number;
  errors: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_FILE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "data",
  "CC-CEDICT",
  "cedict_1_0_ts_utf-8_mdbg.txt",
);

// Regex: /^(?<trad>\S+)\s+(?<simp>\S+)\s+\[(?<pinyin>[^\]]+)\]\s+\/(?<defs>.*)\/$/
const CEDICT_LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/$/;

const BATCH_SIZE = 500;

// ── Parser ─────────────────────────────────────────────────────────────────

/**
 * Parse a single line of CC-CEDICT data.
 * Returns null for comment lines (#) or unparseable lines.
 */
export function parseCedictLine(line: string): CedictEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const match = trimmed.match(CEDICT_LINE_RE);
  if (!match) return null;

  const [, traditional, simplified, pinyinRaw, defsStr] = match;

  // Split definitions by "/" separator (some entries have multiple slashes)
  const definitions = defsStr.split("/").filter((d) => d.trim().length > 0);

  return { traditional, simplified, pinyinRaw, definitions };
}

// ── Tone Number → Tone Mark Converter ──────────────────────────────────────

const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/**
 * Convert a pinyin syllable with tone number to tone marks.
 * Handles u: → ü conversion for CC-CEDICT format (nu:3 → nǚ).
 * Neutral tone (5) → unmarked.
 *
 * Tone mark placement rules:
 * - 'a' or 'e' always gets the mark
 * - 'ou' → mark on the second vowel ('o')
 * - Otherwise → mark on the second vowel
 */
export function numberedToToneMark(numbered: string): string {
  if (!numbered) return "";

  // Normalize u: → ü (CC-CEDICT format)
  let normalized = numbered.replace(/u:/g, "ü").replace(/U:/g, "Ü");

  // Extract tone number from the end
  const toneMatch = normalized.match(/^([a-zA-ZüÜ]+)([1-5])$/);
  if (!toneMatch) return normalized; // No tone number found

  const base = toneMatch[1].toLowerCase();
  const tone = parseInt(toneMatch[2], 10);

  // Neutral tone (5) → unmarked
  if (tone === 5) return base;

  const toneIdx = tone - 1;

  // Determine which vowel gets the tone mark
  let markIndex = -1;

  // Rule 1: 'a' or 'e' always gets the mark
  const aPos = base.indexOf("a");
  if (aPos >= 0) {
    markIndex = aPos;
  } else {
    const ePos = base.indexOf("e");
    if (ePos >= 0) {
      markIndex = ePos;
    } else {
      // Rule 2: 'ou' → mark on 'o'
      const ouPos = base.indexOf("ou");
      if (ouPos >= 0) {
        markIndex = ouPos; // mark on 'o'
      } else {
        // Rule 3: Otherwise, mark on the second vowel
        // Find all vowels in order of priority
        const vowels = ["i", "o", "u", "ü"];
        let lastVowelPos = -1;
        for (const v of vowels) {
          const pos = base.lastIndexOf(v);
          if (pos >= 0) {
            lastVowelPos = pos;
            break;
          }
        }
        // If we found a vowel, use the last one (second vowel in a diphthong)
        if (lastVowelPos >= 0) {
          markIndex = lastVowelPos;
        }
      }
    }
  }

  if (markIndex < 0) return base;

  const char = base[markIndex];
  const marks = TONE_MARKS[char as keyof typeof TONE_MARKS];
  if (!marks) return base;

  const result = base.split("");
  result[markIndex] = marks[toneIdx];

  // Preserve original casing
  const original = toneMatch[1];
  if (original[markIndex] === original[markIndex].toUpperCase()) {
    result[markIndex] = result[markIndex].toUpperCase();
  }

  return result.join("");
}

/**
 * Convert a full multi-syllable pinyin string.
 * e.g., "hao3 bu4 hao3" → "hǎo bù hǎo"
 */
export function pinyinStringToToneMarks(numbered: string): string {
  return numbered
    .split(/\s+/)
    .map((s) => numberedToToneMark(s))
    .join(" ");
}

// ── Word Class Inferrer ────────────────────────────────────────────────────

/**
 * Infer word class (POS tag) from definitions and simplified form.
 *
 * Strategy:
 * 1. Check for explicit CC-CEDICT markers like /CL/ → classifier
 * 2. Check first definition for patterns like "to ..." → verb
 * 3. Check for explicit /noun/, /verb/, /adj/ etc. embedded in definitions
 * 4. Check for common suffixes/patterns
 */
export function inferWordClass(definitions: string[], simplified: string): string | null {
  const joined = definitions.join(" ").toLowerCase();
  const firstDef = definitions[0]?.toLowerCase() || "";

  // 1. Check for measure word / classifier
  if (joined.includes("/cl/") || joined.includes("classifier") || joined.includes("measure word")) {
    return "classifier";
  }

  // 2. Check for explicit POS markers in definitions
  const posMarkers: Array<[RegExp, string]> = [
    [/\bverb\b/, "verb"],
    [/\bnoun\b/, "noun"],
    [/\badjective\b|\badj\b(?!\.)/, "adjective"],
    [/\badverb\b|\badv\b(?!\.)/, "adverb"],
    [/\bpronoun\b/, "pronoun"],
    [/\bpreposition\b/, "preposition"],
    [/\bconjunction\b/, "conjunction"],
    [/\binterjection\b/, "interjection"],
    [/\bprefix\b/, "prefix"],
    [/\bsuffix\b/, "suffix"],
    [/\bparticle\b/, "particle"],
    [/\bidiom\b/, "idiom"],
  ];

  for (const [pattern, pos] of posMarkers) {
    if (pattern.test(joined)) {
      return pos;
    }
  }

  // 3. Verb: starts with "to " and no other strong POS indicator
  if (firstDef.startsWith("to ") && !firstDef.includes("noun") && !firstDef.includes("adjective")) {
    return "verb";
  }

  // 4. Check for phrase / expression patterns
  if (joined.includes("(idiom)") || joined.includes("idiom") || simplified.length >= 4) {
    return "idiom";
  }

  return null;
}

// ── Character Pinyin Decomposer ────────────────────────────────────────────

/**
 * Decompose a word-level pinyin string into per-character readings.
 *
 * e.g., simplified="你好", pinyinRaw="ni3 hao3" →
 *   [{glyph:"你", pinyin:"nǐ", tone:3, syllable:"ni3"},
 *    {glyph:"好", pinyin:"hǎo", tone:3, syllable:"hao3"}]
 *
 * Falls back to distributing syllables by matching them to characters.
 * If count mismatch, uses best-effort assignment.
 */
export function decomposePinyin(simplified: string, pinyinRaw: string): Decomposition[] {
  const syllables = pinyinRaw.trim().split(/\s+/).filter(Boolean);
  const chars = [...simplified];

  const result: Decomposition[] = [];

  for (let i = 0; i < chars.length; i++) {
    const syllable = i < syllables.length ? syllables[i] : syllables[syllables.length - 1] || "";

    const toneMatch = syllable.match(/^([a-zA-ZüÜ:]+)([1-5])$/);
    const tone = toneMatch ? parseInt(toneMatch[2], 10) : 0;
    const pinyin = numberedToToneMark(syllable);

    result.push({
      glyph: chars[i],
      pinyin,
      tone,
      syllable,
    });
  }

  return result;
}

// ── Main Import Function ───────────────────────────────────────────────────

/**
 * Import CC-CEDICT data to enrich the database.
 *
 * Algorithm:
 * 1. Parse file (streaming via readline, batches of 5000)
 * 2. Fetch DB maps: Word (by simplified), Character (by glyph), PinyinSyllable (by syllable)
 * 3. Word enrichment: Match simplified → update pinyin, meaning, wordClass
 * 4. Character decomposition: Decompose pinyin → character readings
 * 5. PinyinCharacterMapping: Upsert each character×syllable combo
 * 6. Reporting: Print and return summary
 */
export async function importCcCedict(
  prisma: any,
  options?: { filePath?: string; dryRun?: boolean },
): Promise<ImportResult> {
  const filePath = options?.filePath || DEFAULT_FILE_PATH;
  const dryRun = options?.dryRun || false;

  const result: ImportResult = {
    totalParsed: 0,
    skippedComments: 0,
    skippedNonChinese: 0,
    wordsEnrichedPinyin: 0,
    wordsEnrichedMeaning: 0,
    wordsEnrichedWordClass: 0,
    charactersEnriched: 0,
    pinyinMappingsCreated: 0,
    errors: [],
  };

  console.log(`📖 Reading CC-CEDICT from: ${filePath}`);

  // ── Step 1: Parse file ──
  const entries: CedictEntry[] = [];

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.startsWith("#")) {
      result.skippedComments++;
      continue;
    }

    const parsed = parseCedictLine(line);
    if (!parsed) {
      result.skippedNonChinese++;
      continue;
    }

    // Only process entries with Chinese characters (contains CJK)
    // CC-CEDICT has many entries like "A", "B", "CP" etc.
    const hasChinese = [...parsed.simplified].some((ch) => ch >= "\u4e00" && ch <= "\u9fff");

    if (!hasChinese) {
      result.skippedNonChinese++;
      continue;
    }

    entries.push(parsed);
    result.totalParsed++;
  }

  console.log(
    `📄 Parsed ${result.totalParsed} Chinese entries, skipped ${result.skippedComments} comment lines, skipped ${result.skippedNonChinese} non-Chinese entries`,
  );

  if (dryRun) {
    console.log("🏁 Dry run — no DB operations performed");
    return result;
  }

  // ── Step 2: Fetch DB maps ──

  console.log("🔍 Fetching database maps...");

  // Word map: simplified → word record
  const allWords = await prisma.word.findMany({
    select: { id: true, simplified: true, pinyin: true, meaning: true, wordClass: true },
  });
  const wordBySimplified = new Map<string, (typeof allWords)[0]>();
  for (const w of allWords) {
    if (w.simplified) {
      wordBySimplified.set(w.simplified, w);
    }
  }
  console.log(`  📚 ${wordBySimplified.size} words with simplified text in DB`);

  // Character map: glyph → character record
  const allChars = await prisma.character.findMany({
    select: { id: true, glyph: true, readings: true },
  });
  const charByGlyph = new Map<string, (typeof allChars)[0]>();
  for (const c of allChars) {
    charByGlyph.set(c.glyph, c);
  }
  console.log(`  🔤 ${charByGlyph.size} characters in DB`);

  // PinyinSyllable map: syllable (with tone number, e.g. "hao3") → id
  const allSyllables = await prisma.pinyinSyllable.findMany({
    select: { id: true, syllable: true },
  });
  const syllableById = new Map<string, string>();
  for (const s of allSyllables) {
    syllableById.set(s.syllable, s.id);
  }
  console.log(`  🎵 ${syllableById.size} pinyin syllables in DB`);

  // ── Step 3: Word enrichment ──

  console.log("📝 Enriching words...");

  const wordUpdateBatches: Array<
    Array<{ id: string; pinyin: string; meaning: string; wordClass: string | null }>
  > = [];
  let currentWordBatch: Array<{
    id: string;
    pinyin: string;
    meaning: string;
    wordClass: string | null;
  }> = [];

  for (const entry of entries) {
    const word = wordBySimplified.get(entry.simplified);
    if (!word) continue;

    const pinyinWithMarks = pinyinStringToToneMarks(entry.pinyinRaw);
    const meaning = entry.definitions.join("; ");
    const wordClass = inferWordClass(entry.definitions, entry.simplified);

    currentWordBatch.push({
      id: word.id,
      pinyin: pinyinWithMarks,
      meaning,
      wordClass,
    });

    if (currentWordBatch.length >= BATCH_SIZE) {
      wordUpdateBatches.push(currentWordBatch);
      currentWordBatch = [];
    }
  }

  if (currentWordBatch.length > 0) {
    wordUpdateBatches.push(currentWordBatch);
  }

  // Apply word updates
  for (const batch of wordUpdateBatches) {
    await Promise.all(
      batch.map((w) =>
        prisma.word.update({
          where: { id: w.id },
          data: {
            pinyin: w.pinyin,
            meaning: w.meaning,
            wordClass: w.wordClass,
          },
        }),
      ),
    );
    result.wordsEnrichedPinyin += batch.length;
    result.wordsEnrichedMeaning += batch.length;
    result.wordsEnrichedWordClass += batch.filter((w) => w.wordClass !== null).length;
  }

  console.log(`  ✅ Enriched ${result.wordsEnrichedPinyin} words with pinyin`);
  console.log(`  ✅ Enriched ${result.wordsEnrichedMeaning} words with meaning`);
  console.log(`  ✅ Enriched ${result.wordsEnrichedWordClass} words with word class`);

  // ── Step 4: Character decomposition ──
  // For each matched word, decompose pinyin → character readings
  // Then collect unique (character, syllable) pairs for PinyinCharacterMapping

  console.log("🔤 Decomposing character pinyin readings...");

  // Collect readings per glyph: Map<glyph, Set<syllable(like "hao3")>>
  const charReadings = new Map<
    string,
    Map<string, { pinyin: string; tone: number; count: number }>
  >();

  for (const entry of entries) {
    const word = wordBySimplified.get(entry.simplified);
    if (!word) continue;

    const decompositions = decomposePinyin(entry.simplified, entry.pinyinRaw);

    for (const dec of decompositions) {
      if (!charByGlyph.has(dec.glyph)) continue;

      if (!charReadings.has(dec.glyph)) {
        charReadings.set(dec.glyph, new Map());
      }

      const readings = charReadings.get(dec.glyph)!;
      if (!readings.has(dec.syllable)) {
        readings.set(dec.syllable, {
          pinyin: dec.pinyin,
          tone: dec.tone,
          count: 1,
        });
      } else {
        readings.get(dec.syllable)!.count++;
      }
    }
  }

  console.log(`  📊 Found readings for ${charReadings.size} characters`);

  // ── Step 5: Update Character.readings JSON field ──

  const readingCharIds: string[] = [];

  for (const [glyph, readings] of charReadings) {
    const char = charByGlyph.get(glyph)!;

    // Build new readings array from CC-CEDICT data
    const newReadings = Array.from(readings.entries())
      .sort((a, b) => b[1].count - a[1].count) // most common first
      .map(([syllable, info], index) => ({
        pinyin: info.pinyin,
        tone: info.tone,
        type: index === 0 ? "primary" : "secondary",
        meaning: null,
      }));

    // Merge with existing readings
    const existingReadings: Array<{
      pinyin?: string;
      tone?: number;
      type?: string | null;
      meaning?: string | null;
    }> = (char.readings as any[]) || [];

    // Keep existing readings that aren't in new readings
    const existingPinyinSet = new Set(newReadings.map((r) => r.pinyin));
    const mergedReadings = [
      ...newReadings,
      ...existingReadings.filter((r) => r.pinyin && !existingPinyinSet.has(r.pinyin)),
    ];

    await prisma.character.update({
      where: { id: char.id },
      data: { readings: mergedReadings },
    });

    readingCharIds.push(char.id);
    result.charactersEnriched++;
  }

  console.log(`  ✅ Updated readings for ${result.charactersEnriched} characters`);

  // ── Step 6: Create PinyinCharacterMapping records ──

  console.log("🔗 Creating pinyin character mappings...");

  const mappingsToCreate: Array<{
    pinyinSyllableId: string;
    characterId: string;
    readingType: string;
    isDefault: boolean;
  }> = [];

  for (const [glyph, readings] of charReadings) {
    const char = charByGlyph.get(glyph);
    if (!char) continue;

    let index = 0;
    for (const [syllable] of readings) {
      const syllableId = syllableById.get(syllable);
      if (!syllableId) continue;

      mappingsToCreate.push({
        pinyinSyllableId: syllableId,
        characterId: char.id,
        readingType: index === 0 ? "primary" : "secondary",
        isDefault: index === 0,
      });
      index++;
    }
  }

  // Remove existing mappings for affected characters to avoid unique constraint conflicts,
  // then batch-insert fresh ones.
  if (mappingsToCreate.length > 0) {
    // Collect unique character IDs
    const affectedCharIds = [...new Set(mappingsToCreate.map((m) => m.characterId))];

    // Clear existing mappings for these characters
    const deleteResult = await prisma.pinyinCharacterMapping.deleteMany({
      where: { characterId: { in: affectedCharIds } },
    });
    console.log(
      `  🗑️ Cleared ${deleteResult.count} existing mappings for ${affectedCharIds.length} characters`,
    );

    // Batch insert fresh mappings
    let insertedCount = 0;
    for (let i = 0; i < mappingsToCreate.length; i += BATCH_SIZE) {
      const batch = mappingsToCreate.slice(i, i + BATCH_SIZE);
      try {
        await prisma.pinyinCharacterMapping.createMany({
          data: batch,
          skipDuplicates: true,
        });
        insertedCount += batch.length;
      } catch (err) {
        const msg = `Failed to insert mapping batch starting at ${i}: ${err}`;
        result.errors.push(msg);
        console.error(`  ⚠️ ${msg}`);
      }
    }
    result.pinyinMappingsCreated = insertedCount;
  }

  console.log(`  ✅ Created/updated ${result.pinyinMappingsCreated} pinyin character mappings`);

  // ── Summary ──

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  📊 CC-CEDICT Import Summary");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`  📄 Total entries parsed:    ${result.totalParsed}`);
  console.log(`  📝 Words enriched pinyin:    ${result.wordsEnrichedPinyin}`);
  console.log(`  📝 Words enriched meaning:   ${result.wordsEnrichedMeaning}`);
  console.log(`  📝 Words enriched wordClass: ${result.wordsEnrichedWordClass}`);
  console.log(`  🔤 Characters enriched:      ${result.charactersEnriched}`);
  console.log(`  🔗 Mappings created:         ${result.pinyinMappingsCreated}`);
  if (result.errors.length > 0) {
    console.log(`  ⚠️ Errors: ${result.errors.length}`);
    for (const err of result.errors.slice(0, 5)) {
      console.log(`     - ${err}`);
    }
  }
  console.log("═══════════════════════════════════════════════════════\n");

  return result;
}

// ── Standalone Entry Point ─────────────────────────────────────────────────

// Auto-detect: run directly if this file is the entry point
const isStandalone =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/")));

if (isStandalone) {
  async function main(): Promise<void> {
    const dotenv = (await import("dotenv")).default;
    dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

    console.log("📦 CC-CEDICT Import Script");
    console.log("══════════════════════════\n");

    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");

    const dbUrl = new URL(process.env.DATABASE_URL!);
    const adapter = new PrismaPg({
      host: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.slice(1),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      ssl: { rejectUnauthorized: false },
    });
    const prisma = new PrismaClient({ adapter });

    try {
      const result = await importCcCedict(prisma);
      console.log(`\n🏁 Import complete. ${result.totalParsed} entries processed.`);
    } catch (err) {
      console.error("❌ Import failed:", err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  main();
}
