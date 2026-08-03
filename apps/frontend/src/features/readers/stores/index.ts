/**
 * @file stores/index.ts
 * @description Barrel exports for readers feature stores.
 * Phase 4: Reading session store.
 * Phase D1: The readers audioStore was migrated to the shared presentational
 *   store (`shared/store/audioStore.ts`) — no audio store here anymore.
 */
export { useReadingStore } from "./readingStore";
export type { ReadersMode } from "./readingStore";
