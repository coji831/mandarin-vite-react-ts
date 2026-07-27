/**
 * @file apps/backend/scripts/database/populate-character-enrichment.ts
 * @description Compute Character.frequencyRank and Character.commonWords
 *   from existing DB data (WordCharacter junction + Word table).
 *
 * frequencyRank: Count words per character via WordCharacter, assign rank 1-N.
 * commonWords: Gather all simplified word glyphs containing each character.
 *
 * Idempotent: uses update (not create). Safe to re-run.
 *
 * Run: cd apps/backend && npx tsx scripts/database/populate-character-enrichment.ts
 */

import { prisma } from "../client.js";

const BATCH_SIZE = 500;

interface CharacterEnrichment {
  id: string;
  frequencyRank: number;
  commonWords: string[];
}

async function main(): Promise<void> {
  console.log("📊 Populating character enrichment fields...");
  console.log("══════════════════════════════════════════════\n");

  // ── Step 1: frequencyRank — count words per character ──

  console.log("🔢 Computing frequencyRank (word count per character)...");

  const freqResult: Array<{ characterId: string; freq: number }> = await prisma.$queryRaw`
    SELECT "characterId", COUNT(*)::int as freq
    FROM "WordCharacter"
    GROUP BY "characterId"
    ORDER BY freq DESC
  `;

  console.log(`  📄 Found ${freqResult.length} characters with word counts`);

  // Build rank map: characterId → rank (1-based, descending by freq)
  const rankMap = new Map<string, number>();
  for (let i = 0; i < freqResult.length; i++) {
    rankMap.set(freqResult[i].characterId, i + 1);
  }

  // ── Step 2: commonWords — collect simplified glyphs per character ──

  console.log("📝 Computing commonWords per character...");

  const wordsResult: Array<{ characterId: string; words: string[] }> = await prisma.$queryRaw`
    SELECT j."characterId", array_agg(w."simplified") as words
    FROM "WordCharacter" j
    JOIN "Word" w ON w."id" = j."wordId"
    GROUP BY j."characterId"
  `;

  console.log(`  📄 Found ${wordsResult.length} characters with word associations`);

  const commonWordsMap = new Map<string, string[]>();
  for (const row of wordsResult) {
    // Filter out nulls and deduplicate
    const unique = [...new Set(row.words.filter((w): w is string => w !== null))];
    commonWordsMap.set(row.characterId, unique);
  }

  // ── Step 3: Build enrichment list and apply in batches ──

  console.log("💾 Applying enrichment updates...");

  // Collect all character IDs that have rank data
  const allCharIds = [...rankMap.keys()];
  const enrichments: CharacterEnrichment[] = [];

  for (const charId of allCharIds) {
    const rank = rankMap.get(charId)!;
    const commonWords = commonWordsMap.get(charId) || [];
    enrichments.push({ id: charId, frequencyRank: rank, commonWords });
  }

  console.log(`  📦 ${enrichments.length} characters to update`);

  let updated = 0;
  for (let i = 0; i < enrichments.length; i += BATCH_SIZE) {
    const batch = enrichments.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((e) =>
        prisma.character.update({
          where: { id: e.id },
          data: {
            frequencyRank: e.frequencyRank,
            commonWords: e.commonWords,
          },
        }),
      ),
    );

    updated += batch.length;

    if (updated % 1000 === 0 || updated === enrichments.length) {
      console.log(`  Progress: ${updated}/${enrichments.length} characters updated`);
    }
  }

  // ── Summary ──

  const maxRank = Math.max(...enrichments.map((e) => e.frequencyRank));
  const withCommonWords = enrichments.filter((e) => e.commonWords.length > 0).length;
  const totalCommonWords = enrichments.reduce((sum, e) => sum + e.commonWords.length, 0);

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ Character Enrichment Complete");
  console.log("══════════════════════════════════════════════\n");
  console.log(`  Characters with frequencyRank: ${enrichments.length}`);
  console.log(`  Max rank value: ${maxRank}`);
  console.log(`  Characters with commonWords: ${withCommonWords}`);
  console.log(`  Total commonWord entries: ${totalCommonWords}`);
  console.log("");
}

main()
  .catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
