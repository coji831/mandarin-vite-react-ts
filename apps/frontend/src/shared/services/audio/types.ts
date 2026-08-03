/**
 * @file shared/services/audio/types.ts
 * @description Audio-related type definitions
 *
 * WordAudio and WordAudioRequest are imported from @mandarin/shared-types.
 * This file re-exports them for convenience and provides any additional
 * audio-specific types not covered by shared-types.
 *
 * Phase D2: TurnAudioRequest/TurnAudioResponse were removed with the dead
 * conversation-audio path.
 */

export type { WordAudio, WordAudioRequest } from "@mandarin/shared-types";
