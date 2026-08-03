/**
 * @file shared/audio/contracts/index.ts
 * @description Barrel exports for the shared audio behavior contracts. Re-exports ONLY.
 *
 * Phase 2 (candidates-as-data): feature-free default contracts (word audio)
 * live here. The passage contract is owned by the readers feature.
 */
export {
  defaultWordBehavior,
  buildWordItem,
  buildWordPlayableItem,
  wordAudioCache,
  toAbsoluteUrl,
} from "./word";
export type { WordContractOptions } from "./word";
