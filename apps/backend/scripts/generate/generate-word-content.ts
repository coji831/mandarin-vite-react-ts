/**
 * @file apps/backend/scripts/generate/generate-word-content.ts
 * @description Generates content/words/words.json from Phase 2 seed data
 *   (fallback for manual regeneration).
 *
 * Run: cd apps/backend && npx tsx scripts/generate/generate-word-content.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../client.js";
import { writeJsonAtomic } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const WORDS_DIR = path.join(CONTENT_DIR, "words");

interface WordAttributes {
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number;
  hskNo: number;
  hskUsage: string;
  wordClass: string | null;
  characters: string[];
  sequenceOrder: number[];
}

interface WordsFile {
  version: number;
  updated_at: string;
  words: Record<string, WordAttributes>;
}

async function main() {
  console.log("📝 Regenerating word content files from database...");

  // Ensure words directory exists
  if (!fs.existsSync(WORDS_DIR)) {
    fs.mkdirSync(WORDS_DIR, { recursive: true });
  }

  // Fetch all words with their HSK levels and character mappings
  const words = await prisma.word.findMany({
    include: {
      wordHskLevels: true,
      wordCharacters: {
        include: {
          character: {
            select: { glyph: true },
          },
        },
        orderBy: { sequenceOrder: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(`  Found ${words.length} words in database`);

  if (words.length === 0) {
    console.log("  ⏭️  No words found — run the seed script first");
    return;
  }

  const simplifiedToId: Record<string, string> = {};
  const idToHsk: Record<string, number> = {};
  const wordsContent: Record<string, WordAttributes> = {};

  for (const word of words) {
    const hskLevel = word.wordHskLevels[0]?.hskLevel ?? 0;

    // Build character glyphs array from character mappings
    const chars = word.wordCharacters.map((wc) => wc.character.glyph);
    const simplified = chars.join("");

    simplifiedToId[simplified] = word.id;
    idToHsk[word.id] = hskLevel;
    wordsContent[word.id] = {
      simplified,
      pinyin: word.pinyin,
      meaning: word.meaning,
      hskLevel,
      hskNo: 0, // Not stored in DB — but words.json is refreshable from seed
      hskUsage: "",
      wordClass: word.wordClass,
      characters: chars,
      sequenceOrder: chars.map((_, j) => j + 1),
    };
  }

  const now = new Date().toISOString();

  // Write index.json
  const indexData = {
    version: 1,
    updated_at: now,
    simplified_to_id: simplifiedToId,
    id_to_hsk: idToHsk,
  };
  writeJsonAtomic(path.join(WORDS_DIR, "index.json"), indexData);

  // Write words.json
  const wordsData: WordsFile = {
    version: 1,
    updated_at: now,
    words: wordsContent,
  };
  writeJsonAtomic(path.join(WORDS_DIR, "words.json"), wordsData);

  console.log(
    `  ✅ Wrote content/words/index.json (${Object.keys(simplifiedToId).length} lookups)`,
  );
  console.log(`  ✅ Wrote content/words/words.json (${Object.keys(wordsContent).length} words)`);
}

main()
  .catch((e) => {
    console.error("❌ Content generation failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
