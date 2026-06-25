/**
 * @file apps/backend/prisma/seeds/seed-pinyin-combinations.js
 * @description Seed sample pinyin combinations into PinyinCombination.
 * Uses a hardcoded sample set — expand with full data after validating the architecture.
 */

export async function seedPinyinCombinations(prisma) {
  const SAMPLE_COMBINATIONS = [
    {
      initialId: "init_b",
      finalId: "fin_a",
      tone: 1,
      syllable: "bā",
      character: "八",
      meaning: "eight",
    },
    {
      initialId: "init_b",
      finalId: "fin_a",
      tone: 2,
      syllable: "bá",
      character: "拔",
      meaning: "to uproot",
    },
    {
      initialId: "init_b",
      finalId: "fin_a",
      tone: 3,
      syllable: "bǎ",
      character: "把",
      meaning: "to grasp",
    },
    {
      initialId: "init_b",
      finalId: "fin_a",
      tone: 4,
      syllable: "bà",
      character: "爸",
      meaning: "father",
    },
    {
      initialId: "init_m",
      finalId: "fin_a",
      tone: 1,
      syllable: "mā",
      character: "妈",
      meaning: "mother",
    },
    {
      initialId: "init_m",
      finalId: "fin_a",
      tone: 2,
      syllable: "má",
      character: "麻",
      meaning: "hemp",
    },
    {
      initialId: "init_m",
      finalId: "fin_a",
      tone: 3,
      syllable: "mǎ",
      character: "马",
      meaning: "horse",
    },
    {
      initialId: "init_m",
      finalId: "fin_a",
      tone: 4,
      syllable: "mà",
      character: "骂",
      meaning: "scold",
    },
    {
      initialId: "init_b",
      finalId: "fin_o",
      tone: 1,
      syllable: "bō",
      character: "波",
      meaning: "wave",
    },
    {
      initialId: "init_b",
      finalId: "fin_o",
      tone: 2,
      syllable: "bó",
      character: "伯",
      meaning: "uncle",
    },
    {
      initialId: "init_b",
      finalId: "fin_o",
      tone: 3,
      syllable: "bǒ",
      character: "跛",
      meaning: "lame",
    },
    {
      initialId: "init_b",
      finalId: "fin_o",
      tone: 4,
      syllable: "bò",
      character: "簸",
      meaning: "winnow",
    },
    {
      initialId: "init_m",
      finalId: "fin_o",
      tone: 1,
      syllable: "mō",
      character: "摸",
      meaning: "to touch",
    },
    {
      initialId: "init_m",
      finalId: "fin_o",
      tone: 2,
      syllable: "mó",
      character: "磨",
      meaning: "to grind",
    },
    {
      initialId: "init_m",
      finalId: "fin_o",
      tone: 3,
      syllable: "mǒ",
      character: "抹",
      meaning: "to wipe",
    },
    {
      initialId: "init_m",
      finalId: "fin_o",
      tone: 4,
      syllable: "mò",
      character: "莫",
      meaning: "do not",
    },
  ];

  let count = 0;
  for (const combo of SAMPLE_COMBINATIONS) {
    const id = `${combo.initialId}-${combo.finalId}-${combo.tone}`;
    await prisma.pinyinCombination.upsert({
      where: { id },
      update: {},
      create: { id, ...combo },
    });
    count++;
  }
  console.log(`Seeded ${count} pinyin combinations`);
}
