/**
 * @file index.ts
 * @description Barrel exports for Character Hub feature components.
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 19.5: Character Hub Radical Section
 * Story 20.2: Mnemonic Display UI
 *
 * All CharacterHub components now live directly in the feature layer
 * instead of being re-exported from shared.
 */
export { CharacterHub } from "./CharacterHub";
export { HubRadicalSection } from "./HubRadicalSection";
export { HubMnemonicSection } from "./HubMnemonicSection";
export { HubEtymology } from "./HubEtymology";
export { HubReadings } from "./HubReadings";
export { HubCommonWords } from "./HubCommonWords";
export { HubCharacterCard } from "./HubCharacterCard";
export { HubInfoLine } from "./HubInfoLine";
export { HubActions } from "./HubActions";
