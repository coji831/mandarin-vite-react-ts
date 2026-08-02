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
    Radical: 20,
    Tone: 5,
    PinyinPhoneme: 50,
    TonePair: 6,
    ToneRule: 3,
    PinyinSyllable: 2045,
    MeasureWord: 52,
    Component: 1777,
    Passage: 6,
    Word: 10943, // 11092 entries - 149 duplicate IDs
    CharacterReading: 15582,
    CharacterRadical: 2798,
    CharacterHskLevel: 2971,
    WordHskLevel: 10943, // 11092 entries - 149 duplicate wordIds
    WordCharacter: 21715, // 22047 entries - 332 @@unique violations
    PinyinCharacterMapping: 11797,
    MeasureWordWord: 135,
    CharacterComponent: 15742,
    PhoneticCluster: 12,
    PhoneticClusterMember: 254,
    StrokeCategory: 5,
    StrokeExtendedType: 8,
    StrokeOrderRule: 5,
    StrokeCategoryOrderRule: 9,
    User: 2,
  };

  const counts: Record<string, number> = {
    Character: await prisma.character.count(),
    Radical: await prisma.radical.count(),
    Tone: await prisma.tone.count(),
    PinyinPhoneme: await prisma.pinyinPhoneme.count(),
    TonePair: await prisma.tonePair.count(),
    ToneRule: await prisma.toneRule.count(),
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
    PhoneticCluster: await prisma.phoneticCluster.count(),
    PhoneticClusterMember: await prisma.phoneticClusterMember.count(),
    StrokeCategory: await prisma.strokeCategory.count(),
    StrokeExtendedType: await prisma.strokeExtendedType.count(),
    StrokeOrderRule: await prisma.strokeOrderRule.count(),
    StrokeCategoryOrderRule: await prisma.strokeCategoryOrderRule.count(),
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
