/**
 * @file index.ts
 * @description Barrel exports for the word-hub feature.
 * Story 21.x: Word Hub migration from lexical-hub
 */
export { WordHub, DefinitionList, ConstituentCharacterChips } from "./components";
export type { WordHubProps, WordDetail } from "./components";
export { useWordDetail } from "./hooks";
