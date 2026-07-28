/**
 * @file hub.ts
 * @description Shared types for LexicalHub and graded readers features.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

export type EntityType =
  "character" | "word" | "radical" | "chengyu" | "grammar" | "phoneticCluster";

export interface EntityRef {
  entityType: EntityType;
  entityId: string;
  label?: string;
}
