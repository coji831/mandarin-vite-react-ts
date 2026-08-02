/**
 * @file stores/index.ts
 * @description Barrel exports for readers feature stores.
 * Phase 4: Reading session store.
 * Phase 1 (Epic 21): Audio store — extracted from readingStore for SRP.
 */
export { useReadingStore } from "./readingStore";
export type { ReadersMode } from "./readingStore";
export { useAudioStore } from "./audioStore";
export type { AudioStatus } from "./audioStore";
