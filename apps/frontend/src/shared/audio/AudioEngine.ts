/**
 * @file shared/audio/AudioEngine.ts
 * @description Plain class wrapping HTMLAudioElement lifecycle — not a React hook.
 *
 * MOVED from shared/lib/audioEngine.ts as part of the Audio Playback
 * consolidation (Phase A). Includes the CONTRACT FIX for the hang bug:
 *   - `playUrl` now takes an AbortSignal and returns `Promise<PlaybackEndReason>`
 *     that ALWAYS settles ("ended" | "aborted" | "paused" | "error") — it never
 *     hangs on pause/stop. A rejection is reserved for `audio.play()` failures
 *     (e.g. NotAllowedError → autoplay blocked), which is a settlement, not a hang.
 *   - `pause()` (retain position, keep engine alive, resolves "paused") is split
 *     from `stop()` (abort + rewind, resolves "aborted").
 *   - Added muted-autoplay support for the "allowed-muted" policy path.
 */

import type { PlaybackEndReason } from "./types";

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private muted = false;

  private signal: AbortSignal | null = null;
  private signalHandler: (() => void) | null = null;
  private resolveEnd: ((reason: PlaybackEndReason) => void) | null = null;
  private rejectPlay: ((err: unknown) => void) | null = null;

  /**
   * Play a URL. Resolves with a `PlaybackEndReason` when playback ends, pauses,
   * stops, or fails via the media element. REJECTS only when `audio.play()`
   * itself rejects (e.g. NotAllowedError — the runtime autoplay fallback).
   *
   * @param url    media URL
   * @param rate   playback rate
   * @param signal abort token — aborting resolves "aborted"
   */
  playUrl(url: string, rate: number, signal: AbortSignal): Promise<PlaybackEndReason> {
    // Tear down any previous playback first (resolves its promise "aborted").
    this.settleCurrent("aborted");

    if (signal.aborted) {
      return Promise.resolve("aborted");
    }

    const audio = new window.Audio();
    audio.src = url;
    audio.playbackRate = rate;
    audio.muted = this.muted;
    // Speech at a rate ≠ 1 should not sound chipmunk-y (Chrome 86+/FF 101+/Safari 17.2+).
    audio.preservesPitch = true;
    audio.load();
    this.audio = audio;
    this.signal = signal;

    return new Promise<PlaybackEndReason>((resolve, reject) => {
      this.resolveEnd = resolve;
      this.rejectPlay = reject;

      const signalHandler = () => {
        this.settleCurrent("aborted");
      };
      this.signalHandler = signalHandler;
      signal.addEventListener("abort", signalHandler);

      audio.onended = () => this.settleCurrent("ended");
      audio.onerror = () => this.settleCurrent("error");

      let playResult: unknown;
      try {
        playResult = audio.play();
      } catch (err) {
        this.failCurrent(err);
        return;
      }
      const playPromise = playResult as Promise<void> | undefined;
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err: unknown) => {
          this.failCurrent(err);
        });
      }
    });
  }

  /** Retain position, keep the element alive, resolve the pending promise "paused". */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this.settleCurrent("paused");
  }

  /** Abort playback + rewind, resolve the pending promise "aborted". */
  stop(): void {
    this.settleCurrent("aborted");
  }

  setRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  /** Persist the muted flag (applied to any future element) and the live element. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  /** Muted-autoplay path: unmute (e.g. on the first user gesture). */
  unmute(): void {
    this.setMuted(false);
  }

  /** Full teardown — abort + rewind + drop element (safe to call repeatedly). */
  dispose(): void {
    this.settleCurrent("aborted");
  }

  /**
   * Resolve the active playUrl promise with a reason and clean up listeners.
   * For "paused" the element is retained (position preserved); for every other
   * terminal reason it is paused, rewound, and dropped.
   */
  private settleCurrent(reason: PlaybackEndReason): void {
    const resolve = this.resolveEnd;
    this.detachSignal();
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      if (reason === "paused") {
        this.audio.pause();
      } else {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio = null;
      }
    }
    if (resolve) {
      this.resolveEnd = null;
      this.rejectPlay = null;
      resolve(reason);
    }
  }

  /** Reject the active playUrl promise (audio.play() failure — e.g. NotAllowedError). */
  private failCurrent(err: unknown): void {
    const reject = this.rejectPlay;
    if (!reject) return; // already settled via another path
    this.resolveEnd = null;
    this.rejectPlay = null;
    this.detachSignal();
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    reject(err);
  }

  private detachSignal(): void {
    if (this.signal && this.signalHandler) {
      this.signal.removeEventListener("abort", this.signalHandler);
    }
    this.signal = null;
    this.signalHandler = null;
  }
}
