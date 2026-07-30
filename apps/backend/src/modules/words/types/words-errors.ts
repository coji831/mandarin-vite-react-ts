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

/**
 * Error thrown when no word is found for a given word ID.
 */
export class WordIdNotFoundError extends Error {
  constructor(wordId: string) {
    super(`No word found for id: ${wordId}`);
    this.name = "WordIdNotFoundError";
  }
}
