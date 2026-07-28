/**
 * @file apps/backend/src/modules/words/repositories/WordsRepository.ts
 * @description Repository for Word Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

/**
 * Raw result shape from the word detail query.
 */
interface WordWithCharacters {
  id: string;
  simplified: string | null;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number | null;
  wordClass: string | null;
  frequencyRank: number | null;
  wordCharacters: Array<{
    character: {
      glyph: string;
      definition: string | null;
      readings: Array<{
        pinyin?: string;
        meaning?: string;
      }>;
    };
  }>;
}

/**
 * Repository for word-related database queries.
 */
export class WordsRepository {
  /**
   * Find a word by its simplified glyph, including constituent characters
   * with their glyph, pinyin, and meaning.
   *
   * @param glyph - The simplified Chinese glyph to search for (e.g., "你好")
   * @returns The full word record with character data, or null if not found
   */
  async findWordByGlyph(glyph: string): Promise<WordWithCharacters | null> {
    const word = await prisma.word.findFirst({
      where: { simplified: glyph },
      include: {
        wordCharacters: {
          include: {
            character: {
              select: {
                glyph: true,
                definition: true,
                readings: true,
              },
            },
          },
          orderBy: { sequenceOrder: "asc" },
        },
      },
    });

    if (!word) return null;

    // Cast readings JSON to the expected shape
    const result: WordWithCharacters = {
      id: word.id,
      simplified: word.simplified,
      pinyin: word.pinyin,
      meaning: word.meaning,
      hskLevel: word.hskLevel,
      wordClass: word.wordClass,
      frequencyRank: word.frequencyRank,
      wordCharacters: word.wordCharacters.map((wc) => ({
        character: {
          glyph: wc.character.glyph,
          definition: wc.character.definition,
          readings: Array.isArray(wc.character.readings)
            ? (wc.character.readings as Array<{ pinyin?: string; meaning?: string }>)
            : [],
        },
      })),
    };

    return result;
  }
}
