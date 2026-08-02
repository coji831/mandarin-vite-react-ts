/**
 * @file apps/backend/scripts/database/fix-unenriched-words.ts
 * @description Fix words that have null pinyin, meaning, and wordClass by
 *   looking them up in CC-CEDICT and/or character readings.
 *
 * Strategy:
 * 1. Query Word records where pinyin IS NULL
 * 2. Parse CC-CEDICT and build simplified → entries lookup
 * 3. For each unenriched word:
 *    a. Try direct CC-CEDICT match on simplified form
 *    b. For single-character words, look up character's primary reading
 * 4. Fix 吧 specifically (wrong pinyin "biā" → "ba")
 * 5. Update DB records
 * 6. Regenerate content/words/words.json
 *
 * Idempotent: safe to re-run (updates existing records).
 *
 * Run: cd apps/backend && npx tsx scripts/database/fix-unenriched-words.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../client.js";
import { writeJsonAtomic } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

// ── CC-CEDICT Parser ────────────────────────────────────────────────────────

interface CedictEntry {
  pinyinRaw: string;
  definitions: string[];
}

const CEDICT_PATH = path.join(PROJECT_ROOT, "data", "CC-CEDICT", "cedict_1_0_ts_utf-8_mdbg.txt");
const CEDICT_LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/$/;

function parseCcCedict(): Map<string, CedictEntry[]> {
  const map = new Map<string, CedictEntry[]>();
  if (!fs.existsSync(CEDICT_PATH)) {
    console.warn(`  ⚠️  CC-CEDICT not found at: ${CEDICT_PATH}`);
    return map;
  }

  const content = fs.readFileSync(CEDICT_PATH, "utf-8");
  const lines = content.split("\n");
  let parsed = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(CEDICT_LINE_RE);
    if (!match) continue;
    const [, , simp, pinyinRaw, defsStr] = match;
    const definitions = defsStr.split("/").filter((d) => d.trim().length > 0);
    if (!map.has(simp)) {
      map.set(simp, []);
    }
    map.get(simp)!.push({ pinyinRaw, definitions });
    parsed++;
  }

  console.log(`  📖 Parsed ${parsed} CC-CEDICT entries, ${map.size} unique simplified forms`);
  return map;
}

// ── Tone Number → Tone Mark Converter (same as import-cc-cedict.ts) ─────────

const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

function numberedToToneMark(numbered: string): string {
  if (!numbered) return "";
  let normalized = numbered.replace(/u:/g, "ü").replace(/U:/g, "Ü");
  const toneMatch = normalized.match(/^([a-zA-ZüÜ]+)([1-5])$/);
  if (!toneMatch) return normalized;
  const base = toneMatch[1].toLowerCase();
  const tone = parseInt(toneMatch[2], 10);
  if (tone === 5) return base;
  const toneIdx = tone - 1;
  let markIndex = -1;
  const aPos = base.indexOf("a");
  if (aPos >= 0) {
    markIndex = aPos;
  } else {
    const ePos = base.indexOf("e");
    if (ePos >= 0) {
      markIndex = ePos;
    } else {
      const ouPos = base.indexOf("ou");
      if (ouPos >= 0) {
        markIndex = ouPos;
      } else {
        const vowels = ["i", "o", "u", "ü"];
        for (const v of vowels) {
          const pos = base.lastIndexOf(v);
          if (pos >= 0) {
            markIndex = pos;
            break;
          }
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
  const original = toneMatch[1];
  if (original[markIndex] === original[markIndex].toUpperCase()) {
    result[markIndex] = result[markIndex].toUpperCase();
  }
  return result.join("");
}

function pinyinStringToToneMarks(numbered: string): string {
  return numbered
    .split(/\s+/)
    .map((s) => numberedToToneMark(s))
    .join(" ");
}

// ── Word Class Inferrer ─────────────────────────────────────────────────────

function inferWordClass(definitions: string[]): string | null {
  const joined = definitions.join(" ").toLowerCase();
  const firstDef = definitions[0]?.toLowerCase() || "";

  if (joined.includes("classifier") || joined.includes("measure word")) {
    return "classifier";
  }

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
    if (pattern.test(joined)) return pos;
  }

  if (firstDef.startsWith("to ") && !firstDef.includes("noun") && !firstDef.includes("adjective")) {
    return "verb";
  }

  return null;
}

// ── Content File Writer ─────────────────────────────────────────────────────

// ── Main ────────────────────────────────────────────────────────────────────

interface FixResult {
  wordId: string;
  simplified: string;
  source: "cc-cedict" | "character-reading" | "manual-fix";
  oldPinyin: string | null;
  newPinyin: string;
  meaning: string | null;
  wordClass: string | null;
}

async function main(): Promise<void> {
  console.log("📝 Fixing Unenriched Words");
  console.log("══════════════════════════\n");

  // ── Step 1: Parse CC-CEDICT ──

  console.log("🔍 Parsing CC-CEDICT...");
  const cedictMap = parseCcCedict();

  // ── Step 2: Fetch DB data ──

  console.log("\n📊 Fetching DB data...");

  const unenrichedWords = await prisma.word.findMany({
    where: { pinyin: null },
    select: { id: true, simplified: true },
  });
  console.log(`  📄 ${unenrichedWords.length} unenriched words in DB`);

  if (unenrichedWords.length === 0) {
    console.log("\n✅ No unenriched words found. Nothing to fix.");
    await prisma.$disconnect();
    return;
  }

  // Fetch characters for single-character word lookups
  const allChars = await prisma.character.findMany({
    select: { id: true, glyph: true, readings: true },
  });
  const charByGlyph = new Map<string, { id: string; readings: any[] }>();
  for (const c of allChars) {
    charByGlyph.set(c.glyph, { id: c.id, readings: c.readings as any[] });
  }
  console.log(`  🔤 ${charByGlyph.size} characters in DB`);

  // ── Step 3: Fix each unenriched word ──

  console.log("\n🔧 Applying fixes...");

  const fixes: FixResult[] = [];
  const notFound: string[] = [];

  for (const word of unenrichedWords) {
    const simplified = word.simplified!;
    let fixed = false;

    // Strategy A: Direct CC-CEDICT match
    const cedictEntries = cedictMap.get(simplified);
    if (cedictEntries && cedictEntries.length > 0) {
      // Pick the most common entry (first one after sorting by usage)
      // For single-char words with multiple entries, prefer the most common:
      // - If there's a neutral-tone version (tone 5), it's often the grammatical particle
      // - Otherwise pick the first entry (most common per CC-CEDICT ordering)
      let bestEntry = cedictEntries[0];

      if (simplified === "吧") {
        // 吧: prefer "ba" (neutral tone, modal particle) over "biā" (onomatopoeia)
        const ba5 = cedictEntries.find((e) => e.pinyinRaw === "ba5");
        if (ba5) bestEntry = ba5;
      }

      const pinyinWithMarks = pinyinStringToToneMarks(bestEntry.pinyinRaw);
      const meaning = bestEntry.definitions.join("; ");
      const wordClass = inferWordClass(bestEntry.definitions);

      fixes.push({
        wordId: word.id,
        simplified,
        source: "cc-cedict",
        oldPinyin: null,
        newPinyin: pinyinWithMarks,
        meaning,
        wordClass,
      });
      fixed = true;
    }

    // Strategy B: Character-based inference
    // For single-char words: use the character's primary reading
    // For multi-char words: join primary readings of each character
    if (!fixed) {
      const chars = [...simplified];
      const readings: string[] = [];
      let allFound = true;

      for (const ch of chars) {
        const char = charByGlyph.get(ch);
        if (char && char.readings && char.readings.length > 0) {
          const primaryReading = char.readings[0] as { pinyin?: string; tone?: number };
          if (primaryReading.pinyin) {
            readings.push(primaryReading.pinyin);
          } else {
            allFound = false;
            break;
          }
        } else {
          allFound = false;
          break;
        }
      }

      if (allFound && readings.length > 0) {
        fixes.push({
          wordId: word.id,
          simplified,
          source: "character-reading",
          oldPinyin: null,
          newPinyin: readings.join(" "),
          meaning: null,
          wordClass: null,
        });
        fixed = true;
      }
    }

    if (!fixed) {
      notFound.push(simplified);
    }
  }

  // ── Step 4: Fix 吧 specifically (wrong pinyin "biā" → "ba") ──
  // Look up 吧 by glyph instead of hardcoded ID
  const baWord = await prisma.word.findFirst({ where: { simplified: "吧" } });
  if (baWord && baWord.pinyin !== "ba" && baWord.pinyin !== null) {
    fixes.push({
      wordId: baWord.id,
      simplified: "吧",
      source: "manual-fix",
      oldPinyin: baWord.pinyin,
      newPinyin: "ba",
      meaning: baWord.meaning, // Keep existing meaning
      wordClass: baWord.wordClass,
    });
  }

  // ── Step 5: Apply updates to DB ──

  console.log(`\n💾 Applying ${fixes.length} fixes to DB...`);

  const BATCH_SIZE = 500;
  let updated = 0;

  for (let i = 0; i < fixes.length; i += BATCH_SIZE) {
    const batch = fixes.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((f) =>
        prisma.word.update({
          where: { id: f.wordId },
          data: {
            pinyin: f.newPinyin,
            ...(f.meaning !== null ? { meaning: f.meaning } : {}),
            ...(f.wordClass !== null ? { wordClass: f.wordClass } : {}),
          },
        }),
      ),
    );
    updated += batch.length;
    if (updated % 500 === 0 || updated === fixes.length) {
      console.log(`  Progress: ${updated}/${fixes.length} words updated`);
    }
  }

  // ── Step 6: Regenerate words.json ──

  console.log("\n📝 Regenerating content/words/words.json...");

  // Get all words with their WordCharacter junctions to reconstruct characters+sequenceOrder
  const allWords = await prisma.word.findMany({
    select: {
      id: true,
      simplified: true,
      pinyin: true,
      meaning: true,
      hskLevel: true,
      frequencyRank: true,
      wordClass: true,
      wordCharacters: {
        select: {
          characterId: true,
          sequenceOrder: true,
        },
        orderBy: { sequenceOrder: "asc" },
      },
    },
  });

  // Fetch character glyphs for the character IDs
  const allCharIds = [
    ...new Set(allWords.flatMap((w) => w.wordCharacters.map((wc) => wc.characterId))),
  ];
  const charMap = new Map<string, string>();
  if (allCharIds.length > 0) {
    const chars = await prisma.character.findMany({
      where: { id: { in: allCharIds } },
      select: { id: true, glyph: true },
    });
    for (const c of chars) {
      charMap.set(c.id, c.glyph);
    }
  }

  // Also need hskNo and hskUsage from the existing file to preserve them
  const existingWordsPath = path.join(CONTENT_DIR, "words", "words.json");
  let existingHskData: Record<string, { hskNo?: number; hskUsage?: string }> = {};
  if (fs.existsSync(existingWordsPath)) {
    const existing = JSON.parse(fs.readFileSync(existingWordsPath, "utf-8"));
    const ew = existing.words as Record<string, any>;
    for (const [id, w] of Object.entries(ew)) {
      existingHskData[id] = {
        hskNo: (w as any).hskNo,
        hskUsage: (w as any).hskUsage,
      };
    }
  }

  const wordsContent: Record<string, any> = {};
  const simplifiedToId: Record<string, string> = {};
  const idToHsk: Record<string, number> = {};

  for (const w of allWords) {
    if (w.simplified) {
      simplifiedToId[w.simplified] = w.id;
    }
    if (w.hskLevel) {
      idToHsk[w.id] = w.hskLevel;
    }
    const hskMeta = existingHskData[w.id] || {};
    const characters = w.wordCharacters.map((wc) => charMap.get(wc.characterId) || wc.characterId);
    const sequenceOrder = w.wordCharacters.map((wc) => wc.sequenceOrder);
    wordsContent[w.id] = {
      simplified: w.simplified,
      pinyin: w.pinyin,
      meaning: w.meaning,
      hskLevel: w.hskLevel,
      frequencyRank: w.frequencyRank,
      wordClass: w.wordClass,
      hskNo: hskMeta.hskNo,
      hskUsage: hskMeta.hskUsage,
      characters,
      sequenceOrder,
    };
  }

  // Write words.json
  const wordsDir = path.join(CONTENT_DIR, "words");
  if (!fs.existsSync(wordsDir)) {
    fs.mkdirSync(wordsDir, { recursive: true });
  }

  const now = new Date().toISOString();
  const wordsFileOutput = {
    version: 1,
    updated_at: now,
    words: wordsContent,
  };
  writeJsonAtomic(path.join(wordsDir, "words.json"), wordsFileOutput);

  // Write index.json
  const indexData = {
    version: 1,
    updated_at: now,
    simplified_to_id: simplifiedToId,
    id_to_hsk: idToHsk,
  };
  writeJsonAtomic(path.join(wordsDir, "index.json"), indexData);

  console.log(`  ✅ Wrote words.json (${Object.keys(wordsContent).length} words)`);
  console.log(`  ✅ Wrote index.json (${Object.keys(simplifiedToId).length} lookups)`);

  // ── Summary ──

  const bySource: Record<string, number> = {};
  for (const f of fixes) {
    bySource[f.source] = (bySource[f.source] || 0) + 1;
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ Fix Unenriched Words Complete");
  console.log("══════════════════════════════════════════════\n");

  if (fixes.length > 0) {
    console.log(`  Total words fixed: ${fixes.length}`);
    console.log(`  By source:`);
    for (const [source, count] of Object.entries(bySource)) {
      console.log(`    ${source}: ${count}`);
    }

    console.log(`\n  Sample fixes:`);
    for (const f of fixes.slice(0, 10)) {
      console.log(`    ${f.wordId} | "${f.simplified}" → pinyin="${f.newPinyin}" [${f.source}]`);
    }
    if (fixes.length > 10) {
      console.log(`    ... and ${fixes.length - 10} more`);
    }
  }

  if (notFound.length > 0) {
    console.log(`\n  ⚠️  ${notFound.length} words not found in CC-CEDICT or character readings:`);
    for (const s of notFound.slice(0, 30)) {
      console.log(`    "${s}"`);
    }
    if (notFound.length > 30) {
      console.log(`    ... and ${notFound.length - 30} more`);
    }
  }

  // Show the 吧 fix
  const baFix = fixes.find((f) => f.wordId === baWord?.id);
  if (baFix) {
    console.log(`\n  🛠️  Specific fix: 吧 "${baFix.oldPinyin}" → "${baFix.newPinyin}"`);
  }

  console.log("");
}

main()
  .catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
