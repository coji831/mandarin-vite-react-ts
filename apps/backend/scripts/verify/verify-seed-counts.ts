/**
 * @file apps/backend/scripts/verify/verify-seed-counts.ts
 * @description Verify database seed record counts match expected Phase 2 counts.
 */
import { prisma } from "../../scripts/client.js";

async function main() {
  // Expected counts:
  // Phase 2 has 149 duplicate word IDs (same word in multiple HSK levels) and
  // 332 duplicate WordCharacter @@unique([wordId, characterId]) violations.
  // skipDuplicates: true correctly handles these, so actual counts are lower.
  const expected: Record<string, number> = {
    Character: 103006,
    PinyinSyllable: 2045,
    MeasureWord: 52,
    Component: 0,
    Passage: 6,
    Word: 10943, // 11092 entries - 149 duplicate IDs
    CharacterReading: 15582,
    CharacterRadical: 2798,
    CharacterHskLevel: 2971,
    WordHskLevel: 10943, // 11092 entries - 149 duplicate wordIds
    WordCharacter: 21715, // 22047 entries - 332 @@unique violations
    PinyinCharacterMapping: 11797,
    MeasureWordWord: 135,
    CharacterComponent: 0,
    User: 2,
  };

  const counts: Record<string, number> = {
    Character: await prisma.character.count(),
    PinyinSyllable: await prisma.pinyinSyllable.count(),
    MeasureWord: await prisma.measureWord.count(),
    Component: await prisma.component.count(),
    Passage: await prisma.passage.count(),
    Word: await prisma.word.count(),
    CharacterReading: await prisma.characterReading.count(),
    CharacterRadical: await prisma.characterRadical.count(),
    CharacterHskLevel: await prisma.characterHskLevel.count(),
    WordHskLevel: await prisma.wordHskLevel.count(),
    WordCharacter: await prisma.wordCharacter.count(),
    PinyinCharacterMapping: await prisma.pinyinCharacterMapping.count(),
    MeasureWordWord: await prisma.measureWordWord.count(),
    CharacterComponent: await prisma.characterComponent.count(),
    User: await prisma.user.count(),
  };

  console.log("\n=== Verification Counts ===");
  let allMatch = true;
  for (const [table, actual] of Object.entries(counts)) {
    const exp = expected[table];
    const match = actual === exp;
    if (!match) allMatch = false;
    const diff = actual !== exp ? ` (expected ${exp}, diff ${actual - exp})` : "";
    console.log(
      `  ${match ? "✅" : "❌"} ${table.padEnd(25)} ${String(actual).padStart(8)}${diff}`,
    );
  }
  console.log(`\n${allMatch ? "✅ All counts match!" : "❌ Some counts differ!"}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
