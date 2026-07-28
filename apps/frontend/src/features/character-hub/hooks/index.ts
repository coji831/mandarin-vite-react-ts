/**
 * @file hooks/index.ts
 * @description Barrel exports for Character Hub hooks
 */

export { useCharacterDetail } from "./useCharacterDetail";
export type { CharacterDetailResult } from "./useCharacterDetail";
// useCharacterHub removed — consumers migrated to openHub() from shared/hub-entry
export { useMergedRadicals } from "./useMergedRadicals";
export type { RadicalEntry } from "./useMergedRadicals";
