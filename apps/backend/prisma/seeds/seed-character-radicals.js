/**
 * @file apps/backend/prisma/seeds/seed-character-radicals.js
 * @description Seed character-to-radical mappings for the CharacterRadical table.
 *
 * These are Chinese characters that genuinely contain 2+ Kangxi radicals
 * from our 20-radical dataset in content/radicals/.
 */
export const CHARACTER_RADICALS_SEED = [
  // 如 = 女 (woman) + 口 (mouth) → "like/as"
  { characterGlyph: "如", radicalId: "rad_0038" },
  { characterGlyph: "如", radicalId: "rad_0030" },

  // 怕 = 忄 (heart variant) + 白 (white) → "fear"
  { characterGlyph: "怕", radicalId: "rad_0061" },
  { characterGlyph: "怕", radicalId: "rad_0025" },

  // 安 = 宀 (roof) + 女 (woman) → "peaceful"
  { characterGlyph: "安", radicalId: "rad_0040" },
  { characterGlyph: "安", radicalId: "rad_0038" },

  // 对 = 又 (again) + 寸 (inch) → "correct/toward"
  { characterGlyph: "对", radicalId: "rad_0029" },
  { characterGlyph: "对", radicalId: "rad_0041" },

  // 灾 = 宀 (roof) + 火 (fire) → "disaster"
  { characterGlyph: "灾", radicalId: "rad_0040" },
  { characterGlyph: "灾", radicalId: "rad_0086" },
];

export async function seedCharacterRadicals(prisma) {
  let created = 0;
  for (const mapping of CHARACTER_RADICALS_SEED) {
    await prisma.characterRadical.upsert({
      where: {
        characterGlyph_radicalId: {
          characterGlyph: mapping.characterGlyph,
          radicalId: mapping.radicalId,
        },
      },
      update: {},
      create: mapping,
    });
    created++;
  }
  console.log(`Seeded ${created} character-radical mappings`);
}
