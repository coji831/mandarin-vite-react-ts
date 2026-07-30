/**
 * @file modules/radicals/types/radicals-errors.ts
 * @description Error classes for the radicals module.
 */

export class RadicalNotFoundError extends Error {
  constructor(radicalId: string) {
    super(`Radical '${radicalId}' not found`);
    this.name = "RadicalNotFoundError";
  }
}
