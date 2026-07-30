/**
 * @file modules/radicals/services/RadicalCharacterService.ts
 * @description Service for looking up characters belonging to a radical via DB.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { findInAggregateContent } from "../../../shared/utils/contentUtils.js";
import { RadicalNotFoundError } from "../types/radicals-errors.js";

export interface RadicalCharacterEntry {
  glyph: string;
  pinyin: string;
  meaning: string;
  decompositionType: string | null;
  hskLevel: number | null;
}

export class RadicalCharacterService {
  async getCharactersForRadical(radicalId: string): Promise<{
    radicalId: string;
    characters: RadicalCharacterEntry[];
  }> {
    // Validate radical exists in the JSON aggregate (no Radical model in DB)
    const radical = await findInAggregateContent("radicals", "radicals.json", "id", radicalId);
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
        hskLevel: cr.character.hskLevels[0]?.hskLevel ?? null,
      }));

    return { radicalId, characters };
  }
}
