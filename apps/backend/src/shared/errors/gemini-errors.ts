/**
 * @file apps/backend/src/shared/errors/gemini-errors.ts
 * @description Typed error classes for the Gemini AI integration layer.
 *
 * Shared across all services that interact with the Gemini API.
 */

/**
 * Wraps Gemini API failures — timeout, invalid response, parsing failure.
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}
