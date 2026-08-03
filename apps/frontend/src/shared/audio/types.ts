/**
 * @file shared/audio/types.ts
 * @description Core framework-agnostic types for the consolidated AudioManager.
 *
 * Phase 2 (candidates-as-data): the manager is a pure transport adapter — it
 * plays whatever `PlayableItem[]` it is given and holds NO resolver concept.
 * Fallback policy is expressed as DATA: an ordered candidate list per item.
 * Consumers supply their behavior via `AudioBehavior` contracts. These types
 * are shared by the manager, the engine/TTS backends, and the strategies. No
 * React or zustand dependencies live here.
 */

import type { AudioEvent } from "./events";

/**
 * One playable source candidate for an item. Ordered fallback: the manager
 * tries candidates left-to-right and advances only when the current one fails
 * (or plays to completion).
 */
export type PlayableSource =
  | {
      kind: "url";
      url: string;
      source?: "gcs" | "ondemand" | "cached";
      voice?: string;
      lang?: string;
    }
  | { kind: "tts"; text: string; lang?: string; voice?: string };

/**
 * A single playable unit (word, sentence, turn) with its ordered candidate
 * list. `candidates: []` means silent skip (advance, never a spinner).
 */
export interface PlayableItem {
  /** Stable identifier used for caching (e.g. a word, or a sentence index). */
  id: string;
  /** Ordered fallback sources; `[]` = silent skip + advance. */
  candidates: PlayableSource[];
  /** What to do when every candidate fails. Default `"skip"` → advance. */
  onAllFailed?: "skip" | "stop";
  /** Optional display label (e.g. the word / sentence text). */
  title?: string;
}

/**
 * Consumer-supplied playback behavior — the ONLY thing the manager needs to
 * know about intent. The manager plays `sources` (eager array or lazy
 * producer), auto-advances per `strategy`, and consults `onUrlFailed` when a
 * URL candidate errors at the media layer.
 */
export interface AudioBehavior {
  strategy: "single" | "sequence";
  sources: PlayableItem[] | (() => PlayableItem[] | Promise<PlayableItem[]>);
  /** Default `"fallback"` → next candidate. */
  onUrlFailed?: (item: PlayableItem) => "retry" | "fallback" | "skip";
  mutedAutoplay?: boolean;
  /** Observe every emitted AudioEvent (e.g. for analytics). */
  onEvent?: (event: AudioEvent) => void;
}

/** UI-facing playback status — the `status` field of the snapshot. */
export type AudioStatus =
  "idle" | "loading" | "playing" | "paused" | "stopped" | "blocked" | "error";

/**
 * What the engine says when a `playUrl` promise settles. The promise ALWAYS
 * settles — never hangs on pause/stop (regression for the old hang bug).
 *
 * Note: the redesign doc's type literal lists "ended" | "aborted" | "error",
 * but `pause()` must resolve its pending promise with `"paused"` (per the
 * pause/stop split), so the union includes it.
 */
export type PlaybackEndReason = "ended" | "aborted" | "paused" | "error";

/**
 * Presentational UI snapshot mirrored into `shared/store/audioStore.ts`.
 * Written only when the snapshot actually changes (never on `timeupdate`).
 */
export interface AudioSnapshot {
  status: AudioStatus;
  currentIndex: number | null;
  rate: number;
  error: string | null;
  /** True once the sequence strategy reaches the end (replaces `hasJustCompleted`). */
  hasCompleted: boolean;
}

/**
 * Minimal structural contract the AudioManager needs from a URL-playback
 * backend. `AudioEngine` satisfies this; tests can inject fakes.
 */
export interface AudioEngineLike {
  playUrl(url: string, rate: number, signal: AbortSignal): Promise<PlaybackEndReason>;
  pause(): void;
  stop(): void;
  setRate(rate: number): void;
  setMuted(muted: boolean): void;
  unmute(): void;
  dispose(): void;
}

/** Minimal structural contract the AudioManager needs from a TTS backend. */
export interface BrowserTTSLike {
  isAvailable(): boolean;
  speak(text: string, rate: number, lang: string): Promise<void>;
  cancel(): void;
}
