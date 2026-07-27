/**
 * @file apps/backend/scripts/database/verify-data-lifecycle.ts
 * @description Verification gate — runs count queries and file size checks
 *   to confirm data lifecycle targets are met.
 *
 * Run: npx tsx scripts/verify/verify-data-lifecycle.ts (from apps/backend)
 *      npx tsx scripts/verify/verify-data-lifecycle.ts --deep (includes spot-checks)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { prisma } from "../client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");

interface CheckResult {
  name: string;
  actual: number | string;
  expected: string;
  passed: boolean;
}

// ── Deep checks (from _spot-checks.ts) ─────────────────────────────────────

async function runDeepChecks(prismaClient: typeof prisma): Promise<void> {
  console.log("\n══════════════════════════════════════════════");
  console.log("  🔬 Deep Spot-Check Verification Queries");
  console.log("══════════════════════════════════════════════\n");

  // 1. Characters with frequencyRank
  const freqRank = await prismaClient.character.count({
    where: { frequencyRank: { not: null } },
  });
  console.log(`✅ Characters with frequencyRank: ${freqRank}`);

  // 2. Characters with commonWords (non-empty)
  const commonWords: Array<{ cnt: number }> = await prismaClient.$queryRaw`
    SELECT COUNT(*)::int as cnt FROM "Character"
    WHERE "commonWords" IS NOT NULL AND array_length("commonWords", 1) > 0
  `;
  console.log(`✅ Characters with commonWords (non-empty): ${commonWords[0].cnt}`);

  // 3. CharacterReading records
  const readingCount = await prismaClient.characterReading.count();
  console.log(`✅ CharacterReading records: ${readingCount}`);

  // 4. Characters with classification
  const classResult = await prismaClient.character.groupBy({
    by: ["classification"],
    where: { classification: { not: null } },
    _count: { id: true },
  });
  console.log("✅ Classification breakdown:");
  for (const row of classResult) {
    console.log(`   ${row.classification}: ${row._count.id}`);
  }

  // 5. CharacterRadical records
  const radicalCount = await prismaClient.characterRadical.count();
  console.log(`✅ CharacterRadical records: ${radicalCount}`);

  // 6. Characters with phoneticComponentId
  const phoneticCount = await prismaClient.character.count({
    where: { phoneticComponentId: { not: null } },
  });
  console.log(`✅ Characters with phoneticComponentId: ${phoneticCount}`);

  // 7. Sample enriched characters
  const samples = await prismaClient.character.findMany({
    where: { classification: { not: null } },
    select: {
      id: true,
      glyph: true,
      classification: true,
      etymology: true,
      frequencyRank: true,
      phoneticComponentId: true,
    },
    take: 5,
    orderBy: { id: "asc" },
  });
  console.log("\n✅ Sample enriched characters:");
  for (const s of samples) {
    console.log(
      `   ${s.id} | ${s.glyph} | classification=${s.classification} | freqRank=${s.frequencyRank} | phoneticComponentId=${s.phoneticComponentId}`,
    );
    if (s.etymology) {
      console.log(`       etymology: ${s.etymology.substring(0, 80)}...`);
    }
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  ✅ Deep spot-checks complete");
  console.log("══════════════════════════════════════════════\n");
}

// ── Main verification ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const isDeep = process.argv.includes("--deep");
  const results: CheckResult[] = [];

  try {
    // ── DB Record Counts ──────────────────────────────────────────────

    const charCount = await prisma.character.count();
    results.push({
      name: "Character count",
      actual: charCount,
      expected: ">=2,971",
      passed: charCount >= 2971,
    });

    const wordCount = await prisma.word.count();
    results.push({
      name: "Word count",
      actual: wordCount,
      expected: ">=10,000",
      passed: wordCount >= 10000,
    });

    const wordCharCount = await prisma.wordCharacter.count();
    results.push({
      name: "WordCharacter junctions",
      actual: wordCharCount,
      expected: ">=20,000",
      passed: wordCharCount >= 20000,
    });

    const sylCount = await prisma.pinyinSyllable.count();
    results.push({
      name: "PinyinSyllable count",
      actual: sylCount,
      expected: ">=1,300",
      passed: sylCount >= 1300,
    });

    const mappingCount = await prisma.pinyinCharacterMapping.count();
    results.push({
      name: "PinyinCharacterMapping count",
      actual: mappingCount,
      expected: ">=2,971",
      passed: mappingCount >= 2971,
    });

    const mwCount = await prisma.measureWord.count();
    results.push({
      name: "MeasureWord count",
      actual: mwCount,
      expected: ">=50",
      passed: mwCount >= 50,
    });

    const mwwCount = await prisma.measureWordWord.count();
    results.push({
      name: "MeasureWordWord count",
      actual: mwwCount,
      expected: ">=100",
      passed: mwwCount >= 100,
    });

    const compCount = await prisma.component.count();
    results.push({
      name: "Component count",
      actual: compCount,
      expected: ">=500* (needs Make Me a Hanzi)",
      passed: false,
    });

    const ccCount = await prisma.characterComponent.count();
    results.push({
      name: "CharacterComponent count",
      actual: ccCount,
      expected: ">=2,000* (needs Make Me a Hanzi)",
      passed: false,
    });

    const hskLevelCount = await prisma.wordHskLevel.count();
    results.push({
      name: "WordHskLevel count",
      actual: hskLevelCount,
      expected: ">=10,000",
      passed: hskLevelCount >= 10000,
    });

    const charHskCount = await prisma.characterHskLevel.count();
    results.push({
      name: "CharacterHskLevel count",
      actual: charHskCount,
      expected: ">=2,000",
      passed: charHskCount >= 2000,
    });

    const readingSessions = await prisma.readingSession.count();
    results.push({
      name: "ReadingSession count",
      actual: readingSessions,
      expected: ">=0",
      passed: true,
    });

    // ── Data Quality Checks ───────────────────────────────────────────

    // StrokeCount accuracy: count characters where strokeCount is 0 or unlikely
    const zeroStrokeCount = await prisma.character.count({ where: { strokeCount: { lte: 0 } } });
    results.push({
      name: "Characters with strokeCount ≤ 0",
      actual: zeroStrokeCount,
      expected: "0",
      passed: zeroStrokeCount === 0,
    });

    // Unenriched words: count words where pinyin is null
    const nullPinyinWords = await prisma.word.count({ where: { pinyin: null } });
    results.push({
      name: "Words with null pinyin",
      actual: nullPinyinWords,
      expected: "0 (all enriched)",
      passed: nullPinyinWords === 0,
    });

    // Words where all three fields are null
    const totallyUnenriched = await prisma.word.count({
      where: { pinyin: null, meaning: null, wordClass: null },
    });
    results.push({
      name: "Totally unenriched words (pinyin+meaning+wordClass null)",
      actual: totallyUnenriched,
      expected: "0",
      passed: totallyUnenriched === 0,
    });

    // ── File Size Checks ──────────────────────────────────────────────

    const charFile = path.join(CONTENT_DIR, "characters", "characters.json");
    const charFileSize = fs.existsSync(charFile) ? fs.statSync(charFile).size : 0;
    results.push({
      name: "content/characters/characters.json size",
      actual: `${(charFileSize / 1024).toFixed(1)} KB`,
      expected: "~800 KB - 1.2 MB",
      passed: charFileSize > 500 * 1024 && charFileSize < 2000 * 1024,
    });

    const indexFile = path.join(CONTENT_DIR, "characters", "index.json");
    const indexFileSize = fs.existsSync(indexFile) ? fs.statSync(indexFile).size : 0;
    results.push({
      name: "content/characters/index.json size",
      actual: `${(indexFileSize / 1024).toFixed(1)} KB`,
      expected: "~70-100 KB",
      passed: indexFileSize > 30 * 1024 && indexFileSize < 200 * 1024,
    });

    const wordsFile = path.join(CONTENT_DIR, "words", "words.json");
    const wordsFileSize = fs.existsSync(wordsFile) ? fs.statSync(wordsFile).size : 0;
    results.push({
      name: "content/words/words.json size",
      actual: `${(wordsFileSize / 1024).toFixed(1)} KB`,
      expected: "~2.5-3.0 MB",
      passed: wordsFileSize > 2000 * 1024 && wordsFileSize < 5000 * 1024,
    });

    const wordsIndexFile = path.join(CONTENT_DIR, "words", "index.json");
    const wordsIndexSize = fs.existsSync(wordsIndexFile) ? fs.statSync(wordsIndexFile).size : 0;
    results.push({
      name: "content/words/index.json size",
      actual: `${(wordsIndexSize / 1024).toFixed(1)} KB`,
      expected: "~400-500 KB",
      passed: wordsIndexSize > 200 * 1024 && wordsIndexSize < 1000 * 1024,
    });

    // ── Results ───────────────────────────────────────────────────────

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  📊 Data Lifecycle Verification Results");
    console.log("═══════════════════════════════════════════════════════\n");

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const r of results) {
      const icon = r.passed ? "✅" : "❌";
      if (r.name.includes("*")) {
        console.log(`  ⏳ ${r.name}: ${r.actual} (${r.expected})`);
        skipped++;
      } else {
        console.log(`  ${icon} ${r.name}: ${r.actual} (expected ${r.expected})`);
        if (r.passed) passed++;
        else failed++;
      }
    }

    console.log(`\n  ───────────────────────────────────────────`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏳ Skipped (deferred): ${skipped}`);
    console.log(`  ───────────────────────────────────────────\n`);

    // ── Deep checks (if --deep flag set) ─────────────────────────────

    if (isDeep) {
      await runDeepChecks(prisma);
    } else {
      console.log("ℹ️  Pass --deep flag to run spot-check verification queries.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: Error) => {
  console.error("❌ Verification failed:", e.message);
  process.exit(1);
});
