/**
 * @file index.ts
 * @description Barrel for the library feature (the Library page's real content
 * source + its item→hub contract). Re-exports only.
 */

export { libraryContentSource, clearLibraryContentCache } from "./services/libraryContentSource";
export type { LibraryEntityRef, LibraryItemMetadata } from "./services/libraryContentSource";
