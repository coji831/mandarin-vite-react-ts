/**
 * @file components/index.ts
 * @description Barrel exports for lexical-hub feature components.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.4 (refactor): Removed CharacterHubContent (deleted) and backward-compat WordHub re-exports.
 * Story 21.4 (cleanup): Removed HubEntityCard, HubProgressActions, HubEntityRelationList (dead wrappers).
 * Rework (epic-25): HubSheet + HubErrorBoundary added — the hub is a standalone
 *   cross-page peek, so the sheet is what AppLayout mounts.
 */
export { LexicalHubRouter } from "./LexicalHubRouter";
export { HubSheet, HUB_SHEET_MODAL_QUERY } from "./HubSheet/HubSheet";
export type { HubSheetProps } from "./HubSheet/HubSheet";
export { HubErrorBoundary } from "./HubErrorBoundary/HubErrorBoundary";
export type { HubErrorBoundaryProps } from "./HubErrorBoundary/HubErrorBoundary";
