/**
 * @file apps/backend/scripts/database/generate-word-content.ts
 * @description Regenerate content/words/index.json and content/words/words.json
 *   from the database, in case the files were lost or need a refresh.
 *
 * The seed script (prisma/seeds/seed-word.js) produces these files automatically
 * during seeding. This script exists as a fallback to regenerate them from DB.
 *
 * Run: cd apps/backend && npx tsx scripts/database/generate-word-content.ts
 */

import dotenv from "dotenv";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root before anything else
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const { PrismaClient } = prismaPkg;

const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const WORDS_DIR = path.join(CONTENT_DIR, "words");

// Parse DATABASE_URL into individual params and pass as plain config object
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

interface WordAttributes {
  simplified: string;
  hskLevel: number;
  hskNo: number;
  hskUsage: string;
  characters: string[];
  sequenceOrder: number[];
}

interface WordsFile {
  version: number;
  updated_at: string;
  words: Record<string, WordAttributes>;
}

/**
 * Write a JSON file atomically using temp-file-then-rename.
 */
function writeJsonAtomic(filePath: string, data: unknown): void {
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
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
      hskLevel,
      hskNo: 0, // Not stored in DB — but words.json is refreshable from seed
      hskUsage: "",
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
