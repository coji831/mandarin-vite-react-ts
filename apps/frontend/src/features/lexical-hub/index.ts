/**
 * @file index.ts
 * @description Barrel exports for the lexical-hub feature.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.4 (refactor): Removed backward-compat re-exports (CharacterHubContent, WordHub).
 * Rework (epic-25): the feature now also owns the app-wide PEEK SHEET.
 */
export { LexicalHubRouter, HubSheet, HUB_SHEET_MODAL_QUERY } from "./components";
export type { HubSheetProps } from "./components";
export { entityHubRegistry } from "./entityHubRegistry";
export type { EntityHubProps } from "./entityHubRegistry";
