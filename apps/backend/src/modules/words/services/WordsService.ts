/**
 * @file apps/backend/src/modules/words/services/WordsService.ts
 * @description Business logic for word detail lookups.
 *
 * Clean Architecture: Application Service / Use Case.
 * Maps Prisma data to the WordDetail domain type.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { WordsRepository } from "../repositories/WordsRepository.js";
import { WordNotFoundError } from "../types/words-errors.js";
import type { WordDetail } from "../types/words.js";

const logger = createLogger("WordsService");

/**
 * Service for word-related business logic.
 */
export class WordsService {
  private readonly repository: WordsRepository;

  constructor(repository: WordsRepository) {
    this.repository = repository;
    logger.info("Initialized Words Service");
  }

  /**
   * Fetch full word detail for a given glyph.
   *
   * @param glyph - The simplified Chinese glyph (e.g., "你好")
   * @returns The word detail with pinyin, definitions, HSK level, and constituent characters
   * @throws WordNotFoundError if the word is not found
   */
  async getWordDetail(glyph: string): Promise<WordDetail> {
    const word = await this.repository.findWordByGlyph(glyph);

    if (!word) {
      throw new WordNotFoundError(glyph);
    }

    // Parse meaning string into definitions array
    // Meanings are typically separated by semicolons or commas
    const definitions = this.parseDefinitions(word.meaning);

    // Get the first reading's pinyin for each constituent character
    const constituentCharacters = word.wordCharacters.map((wc) => {
      const firstReading = wc.character.readings[0];
      return {
        glyph: wc.character.glyph,
        pinyin: firstReading?.pinyin ?? "",
        meaning: wc.character.definition ?? firstReading?.meaning ?? "",
      };
    });

    return {
      glyph: word.simplified ?? glyph,
      pinyin: word.pinyin ?? "",
      definitions,
      hskLevel: word.hskLevel,
      wordClass: word.wordClass,
      frequencyRank: word.frequencyRank,
      constituentCharacters,
    };
  }

  /**
   * Parse a meaning string into an array of definitions.
   * Splits on common delimiters (; or ,) and trims whitespace.
   * Returns an empty array for null/empty input.
   */
  private parseDefinitions(meaning: string | null): string[] {
    if (!meaning) return [];

    // Split on semicolons first (common delimiter for multiple meanings),
    // then on commas with surrounding whitespace
    const parts = meaning
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    return parts.length > 0 ? parts : [meaning];
  }
}
