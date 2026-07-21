/**
 * @file apps/backend/prisma/seeds/seed-characters.js
 * @description Seed the Character table from content/characters/*.json files.
 *
 * Reads all character JSON files, parses them into the Character model format,
 * and upserts them into the database.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");

export async function seedCharacters(prisma) {
  const charsDir = path.join(CONTENT_DIR, "characters");
  const files = fs
    .readdirSync(charsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  let created = 0;
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(charsDir, file), "utf-8"));
    const readings = (raw.readings || []).map((r) => ({
      pinyin: r.pinyin,
      tone: r.tone,
      type: r.type,
      meaning: r.core_meaning,
    }));

    const meta = raw.metadata || {};
    const commonWords = Array.isArray(meta.common_words) ? meta.common_words : [];

    await prisma.character.upsert({
      where: { glyph: raw.glyph },
      update: {
        traditional: raw.traditional !== raw.glyph ? raw.traditional : null,
        strokeCount: raw.stroke_count,
        hskLevel: raw.hsk_level || null,
        frequencyRank: meta.frequency_rank || null,
        definition: readings[0]?.meaning || null,
        readings: readings,
        etymology: meta.etymology || null,
        commonWords: commonWords,
      },
      create: {
        id: raw.id,
        glyph: raw.glyph,
        traditional: raw.traditional !== raw.glyph ? raw.traditional : null,
        strokeCount: raw.stroke_count,
        hskLevel: raw.hsk_level || null,
        frequencyRank: meta.frequency_rank || null,
        definition: readings[0]?.meaning || null,
        readings: readings,
        etymology: meta.etymology || null,
        commonWords: commonWords,
      },
    });
    created++;
  }

  console.log(`Seeded ${created} characters from ${files.length} files`);
}
