/**
 * @file apps/frontend/src/features/progress/index.ts
 * @description Progress feature barrel export (Story 17.2)
 */

export { useProgressStore } from "./stores/progressStore";
export { useRecordActivity } from "./hooks";
export { progressApi } from "./services";
export type { UserProgress, UserProgressListEntry, WordProgress, ProgressState } from "./types";
