/**
 * @file apps/backend/src/modules/words/types/words-errors.ts
 * @description Error classes for the Words module.
 *
 * Clean Architecture: Domain types (error classes).
 */

/**
 * Error thrown when no word is found for a given glyph.
 */
export class WordNotFoundError extends Error {
  constructor(glyph: string) {
    super(`No word found for glyph: ${glyph}`);
    this.name = "WordNotFoundError";
  }
}
