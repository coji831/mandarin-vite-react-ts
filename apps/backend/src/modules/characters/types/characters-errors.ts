/**
 * @file apps/backend/src/modules/characters/types/characters-errors.ts
 * @description Error classes for the Characters module.
 *
 * Clean Architecture: Domain types (error classes).
 * Uses standard error codes: NOT_FOUND, VALIDATION_ERROR, INTERNAL_ERROR.
 */

/**
 * Error thrown when a character is not found for a given glyph.
 */
export class CharacterNotFoundError extends Error {
  public readonly code: string;

  constructor(glyph: string) {
    super(`Character '${glyph}' not found`);
    this.name = "CharacterNotFoundError";
    this.code = "NOT_FOUND";
  }
}

/**
 * Error thrown when no phonetic component exists for a character.
 */
export class PhoneticComponentNotFoundError extends Error {
  public readonly code: string;

  constructor(glyph: string) {
    super(`No phonetic component found for character '${glyph}'`);
    this.name = "PhoneticComponentNotFoundError";
    this.code = "NOT_FOUND";
  }
}

/**
 * Error thrown when search params are all empty.
 */
export class CharacterValidationError extends Error {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = "CharacterValidationError";
    this.code = "VALIDATION_ERROR";
  }
}
