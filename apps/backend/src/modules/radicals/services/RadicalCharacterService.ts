/**
 * @file modules/radicals/services/RadicalCharacterService.ts
 * @description Service for looking up characters belonging to a radical via DB.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { RadicalNotFoundError } from "../types/radicals-errors.js";

export interface RadicalCharacterEntry {
  glyph: string;
  pinyin: string;
  meaning: string;
  decompositionType: string | null;
  classification: string | null;
  etymology: string | null;
  hskLevel: number | null;
}

export class RadicalCharacterService {
  async getCharactersForRadical(radicalId: string): Promise<{
    radicalId: string;
    characters: RadicalCharacterEntry[];
  }> {
    // Validate the radical exists in the Radical reference table (all-in-DB).
    const radical = await prisma.radical.findUnique({ where: { id: radicalId } });
    if (!radical) {
      throw new RadicalNotFoundError(radicalId);
    }

    const characterRadicals = await prisma.characterRadical.findMany({
      where: { radicalId },
      include: {
        character: {
          include: {
            characterReadings: {
              where: { type: "primary" },
              take: 1,
            },
            hskLevels: true,
          },
        },
      },
      orderBy: { character: { glyph: "asc" } },
    });

    const characters = characterRadicals
      .filter(
        (cr): cr is typeof cr & { character: NonNullable<typeof cr.character> } => !!cr.character,
      )
      .map((cr) => ({
        glyph: cr.character.glyph,
        pinyin: cr.character.characterReadings[0]?.pinyin ?? "",
        meaning: cr.character.definition ?? "",
        decompositionType: cr.decompositionType,
        classification: cr.character.classification ?? null,
        etymology: cr.character.etymology ?? null,
        hskLevel: cr.character.hskLevels[0]?.hskLevel ?? null,
      }));

    return { radicalId, characters };
  }
}
