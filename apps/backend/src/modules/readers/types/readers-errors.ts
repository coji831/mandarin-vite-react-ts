/**
 * @file apps/backend/src/modules/readers/types/readers-errors.ts
 * @description Typed error classes for the Readers (Graded Readers) module.
 *
 * Each error extends Error directly, following the existing project pattern
 * (see MnemonicNotFoundError in modules/mnemonics/types/mnemonics.ts).
 */

/**
 * Segmentation failures — typically from invalid input or corrupted word index.
 */
export class SegmenterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SegmenterError";
  }
}

/**
 * Daily generation limit or total storage cap exceeded.
 */
export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

/**
 * Passage not found in the database.
 */
export class PassageNotFoundError extends Error {
  constructor(passageId: string) {
    super(`Passage not found: ${passageId}`);
    this.name = "PassageNotFoundError";
  }
}

/**
 * General passage generation failure.
 */
export class PassageGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PassageGenerationError";
  }
}
