/**
 * @file shared/audio/index.ts
 * @description Barrel exports for the shared audio core. Re-exports ONLY.
 *
 * Phase 2 (candidates-as-data): shared/audio is a PURE TRANSPORT adapter —
 * the resolver concept is retired (see contracts/). The manager plays
 * `PlayableItem[]` supplied by consumer `AudioBehavior` contracts; the
 * feature-free default word contract lives in `contracts/`.
 */

// Backends
export { AudioEngine } from "./AudioEngine";
export { BrowserTTS } from "./BrowserTTS";

// Orchestrator
export {
  AudioManager,
  createAudioManager,
  getAudioManager,
  resolveBehaviorSources,
} from "./AudioManager";
export type { AudioManagerInit } from "./AudioManager";

// Cache + autoplay
export { AudioUrlCache } from "./AudioUrlCache";
export { getAutoplayPolicy, detectAutoplayPolicy } from "./autoplay";
export type { AutoplayPolicy, AutoplayPolicyGetter } from "./autoplay";

// Strategies
export { SinglePlaybackStrategy, SequencePlaybackStrategy } from "./strategies";
export type { PlaybackStrategy } from "./strategies";

// Contracts (feature-free default behaviors; passage contract is readers-owned)
export {
  defaultWordBehavior,
  buildWordItem,
  buildWordPlayableItem,
  wordAudioCache,
  toAbsoluteUrl,
} from "./contracts";
export type { WordContractOptions } from "./contracts";

// Types
export type {
  PlayableSource,
  PlayableItem,
  AudioBehavior,
  AudioStatus,
  AudioSnapshot,
  PlaybackEndReason,
  AudioEngineLike,
  BrowserTTSLike,
} from "./types";

// Events
export type { AudioEvent, AudioEventMap, AudioEventType } from "./events";
export { TypedEventEmitter } from "./events";
