/**
 * @file apps/backend/src/modules/phonetic-clusters/types/phonetic-clusters-errors.ts
 * @description Error classes for the Phonetic Clusters module.
 *
 * Clean Architecture: Domain types (error classes).
 */

/**
 * Error thrown when no phonetic cluster is found for a given ID.
 */
export class PhoneticClusterNotFoundError extends Error {
  constructor(id: string) {
    super(`No phonetic cluster found for id: ${id}`);
    this.name = "PhoneticClusterNotFoundError";
  }
}
