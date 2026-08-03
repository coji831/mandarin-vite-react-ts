/**
 * @file features/readers/audio/index.ts
 * @description Barrel exports for the readers audio layer. Re-exports ONLY.
 *
 * Phase 0 (TTS detachment): the passage resolver was moved out of `shared/audio`
 * into the readers feature so the shared audio core stays feature-free.
 * Phase 2 (candidates-as-data): the resolver is retired — this module now builds
 * the passage `AudioBehavior` contract (`buildPassageAudioBehavior`). The
 * sub-barrel is re-exported by the readers feature barrel (`index.ts`).
 */
export { buildPassageAudioBehavior } from "./PassageAudioBehavior";
export type { PassageAudioBehaviorOptions } from "./PassageAudioBehavior";
