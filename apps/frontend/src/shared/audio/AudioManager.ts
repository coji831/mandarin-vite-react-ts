/**
 * @file shared/audio/AudioManager.ts
 * @description Framework-agnostic audio orchestrator + app-wide singleton.
 *
 * Phase 2 (candidates-as-data): a PURE TRANSPORT ADAPTER. The manager plays
 * whatever `PlayableItem[]` it is given and holds NO resolver concept — fallback
 * policy is expressed as DATA (ordered candidates per item) supplied by the
 * consumer's `AudioBehavior` contract. Lives outside React (no hooks, no
 * zustand). Owns one playback backend (AudioEngine for URLs, BrowserTTS for
 * speech synthesis), the active behavior, a typed event emitter, an internal
 * non-React snapshot, and an abort token (`playId`).
 *
 * Guarantees:
 *  - One active playback at a time (a new `play()` aborts the current one —
 *    kills the two-audios-at-once bug).
 *  - Every load/play/seek bumps `playId`; async continuations check it and drop
 *    stale resolutions (rapid next/prev, unmount, route change).
 *  - The engine promise ALWAYS settles (hang-bug regression lives in
 *    AudioEngine.playUrl).
 *  - Autoplay guard: policy API preferred, `NotAllowedError` runtime fallback —
 *    both converge on `status:"blocked"` (never a TTS loop while blocked).
 *  - Candidate loop: url candidates → engine, tts candidates → BrowserTTS; URL
 *    media errors consult `behavior.onUrlFailed`; all-failed honors
 *    `item.onAllFailed` ("skip" default → advance; "stop" → halt).
 */

import { detectAutoplayPolicy } from "./autoplay";
import type { AutoplayPolicyGetter } from "./autoplay";
import { AudioEngine } from "./AudioEngine";
import { BrowserTTS } from "./BrowserTTS";
import { TypedEventEmitter } from "./events";
import type { AudioEvent, AudioEventMap, AudioEventType } from "./events";
import { SinglePlaybackStrategy } from "./strategies/SinglePlaybackStrategy";
import { SequencePlaybackStrategy } from "./strategies/SequencePlaybackStrategy";
import type { PlaybackStrategy } from "./strategies/PlaybackStrategy";
import type {
  AudioBehavior,
  AudioEngineLike,
  AudioSnapshot,
  BrowserTTSLike,
  PlayableItem,
  PlayableSource,
  PlaybackEndReason,
} from "./types";

export interface AudioManagerInit {
  /** Consumer-supplied playback behavior (candidates + strategy + fallback). */
  behavior?: AudioBehavior;
  /** Inject a URL-playback backend (defaults to a real AudioEngine). */
  engine?: AudioEngineLike;
  /** Inject a TTS backend (defaults to a real BrowserTTS). */
  tts?: BrowserTTSLike;
  /** Inject an autoplay-policy getter (defaults to feature-detected navigator). */
  autoplayPolicy?: AutoplayPolicyGetter;
  /**
   * When true, an `"allowed-muted"` policy plays the element muted (ambient
   * playback, unmute on gesture). Default false → `"allowed-muted"` maps to
   * `blocked` ("tap to play"), per the Architect's recommendation. May also be
   * carried on the behavior itself.
   */
  mutedAutoplay?: boolean;
}

const SINGLE_STRATEGY = new SinglePlaybackStrategy();
const SEQUENCE_STRATEGY = new SequencePlaybackStrategy();

const INITIAL_SNAPSHOT: AudioSnapshot = {
  status: "idle",
  currentIndex: null,
  rate: 1,
  error: null,
  hasCompleted: false,
};

function isNotAllowedError(err: unknown): boolean {
  return (err as { name?: string } | undefined)?.name === "NotAllowedError";
}

export class AudioManager extends TypedEventEmitter {
  private _engine: AudioEngineLike | null = null;
  private get engine(): AudioEngineLike {
    if (!this._engine) this._engine = new AudioEngine();
    return this._engine;
  }
  private _tts: BrowserTTSLike | null = null;
  private get tts(): BrowserTTSLike {
    if (!this._tts) this._tts = new BrowserTTS();
    return this._tts;
  }
  private behavior: AudioBehavior | undefined;
  private autoplayPolicy: AutoplayPolicyGetter = detectAutoplayPolicy;
  private mutedAutoplay = false;

  private items: PlayableItem[] = [];
  private snapshot: AudioSnapshot = { ...INITIAL_SNAPSHOT };
  private currentPlayId = 0;
  private abortController: AbortController | null = null;
  private modeOverride: "single" | "sequence" | null = null;

  /**
   * Configure the manager with a playback behavior. Idempotent: safely called
   * from every surface mount. The backend is lazy-created on first use; after
   * `dispose()` the next access recreates it.
   */
  init(options: AudioManagerInit = {}): void {
    if (options.behavior) {
      this.behavior = options.behavior;
      if (typeof options.behavior.mutedAutoplay === "boolean") {
        this.mutedAutoplay = options.behavior.mutedAutoplay;
      }
    }
    if (options.engine) this._engine = options.engine;
    if (options.tts) this._tts = options.tts;
    if (options.autoplayPolicy) this.autoplayPolicy = options.autoplayPolicy;
    if (typeof options.mutedAutoplay === "boolean") this.mutedAutoplay = options.mutedAutoplay;
  }

  /**
   * Load items and reset playback state (no autoplay). Bumps `playId`, aborting
   * any in-flight playback. Callers resolve `behavior.sources` first (see
   * `resolveBehaviorSources`) and pass the concrete items here.
   */
  async load(sources: PlayableItem[]): Promise<void> {
    this.items = sources ?? [];
    ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = null;
    this.modeOverride = null;
    this.engine?.stop();
    this.tts?.cancel();
    this.updateSnapshot({ status: "idle", currentIndex: null, error: null, hasCompleted: false });
    this.emitIndexChange();
  }

  /**
   * Start playback at `index` (default: current index or strategy initial).
   * `mode` overrides the behavior strategy for this playback session (e.g.
   * `play(3, "single")` for a per-sentence button vs `play(0, "sequence")` for ▶).
   */
  play(index?: number, mode?: "single" | "sequence"): void {
    if (mode) this.modeOverride = mode;
    const strategy = this.getStrategy();
    const target =
      index ?? this.snapshot.currentIndex ?? strategy.getInitialIndex(this.items.length);
    this.startPlayback(target);
  }

  pause(): void {
    if (this.snapshot.status !== "playing" && this.snapshot.status !== "loading") return;
    ++this.currentPlayId; // drop in-flight continuations (e.g. TTS await)
    this.engine.pause();
    this.tts.cancel();
    this.updateSnapshot({ status: "paused" });
    this.emit({ type: "paused", index: this.snapshot.currentIndex });
  }

  resume(): void {
    if (this.snapshot.status === "paused" && this.snapshot.currentIndex !== null) {
      this.startPlayback(this.snapshot.currentIndex);
    }
  }

  stop(): void {
    ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = null;
    this.engine.stop();
    this.tts.cancel();
    this.modeOverride = null;
    this.updateSnapshot({
      status: "stopped",
      currentIndex: null,
      error: null,
      hasCompleted: false,
    });
    this.emitIndexChange();
    this.emit({ type: "stopped" });
  }

  restart(): void {
    const start =
      this.snapshot.currentIndex ?? this.getStrategy().getInitialIndex(this.items.length);
    this.startPlayback(start);
  }

  next(): void {
    if (this.items.length === 0) return;
    const strategy = this.getStrategy();
    const current = this.snapshot.currentIndex ?? -1;
    const next = strategy.getNextIndex(current, this.items.length);
    if (next !== null) this.startPlayback(next);
  }

  prev(): void {
    if (this.items.length === 0) return;
    const strategy = this.getStrategy();
    const current = this.snapshot.currentIndex ?? this.items.length;
    const prev = strategy.getPrevIndex(current, this.items.length);
    if (prev !== null) this.startPlayback(prev);
  }

  /** Reposition the cursor without autoplaying (matches old readers `seekTo`). */
  seek(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = null;
    this.engine.stop();
    this.tts.cancel();
    this.modeOverride = null;
    this.updateSnapshot({
      status: "stopped",
      currentIndex: index,
      error: null,
      hasCompleted: false,
    });
    this.emitIndexChange();
    this.emit({ type: "stopped" });
  }

  setRate(rate: number): void {
    const valid = rate > 0 ? rate : 1;
    this.engine.setRate(valid);
    this.updateSnapshot({ rate: valid });
    this.emit({ type: "ratechange", rate: valid });
  }

  /** Full teardown: abort, dispose backend, clear listeners. Re-init recreates. */
  dispose(): void {
    ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = null;
    this._engine?.dispose();
    this._engine = null;
    this._tts?.cancel();
    this._tts = null;
    this.behavior = undefined;
    this.modeOverride = null;
    this.items = [];
    this.updateSnapshot({ ...INITIAL_SNAPSHOT });
    this.emit({ type: "stopped" });
    this.clear();
  }

  getSnapshot(): AudioSnapshot {
    return { ...this.snapshot };
  }

  /**
   * Dispatch to registered listeners AND the behavior's `onEvent` observer.
   */
  emit<K extends AudioEventType>(event: AudioEventMap[K]): void {
    super.emit(event);
    this.behavior?.onEvent?.(event as AudioEvent);
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private getStrategy(): PlaybackStrategy {
    if (this.modeOverride === "single") return SINGLE_STRATEGY;
    if (this.modeOverride === "sequence") return SEQUENCE_STRATEGY;
    return this.behavior?.strategy === "sequence" ? SEQUENCE_STRATEGY : SINGLE_STRATEGY;
  }

  private startPlayback(index: number): void {
    if (index < 0 || index >= this.items.length) {
      this.finishPlayback();
      return;
    }
    const playId = ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.updateSnapshot({ status: "loading", currentIndex: index, error: null });
    this.emitIndexChange();
    void this.playItem(index, playId);
  }

  private async playItem(index: number, playId: number): Promise<void> {
    const item = this.items[index];
    if (!item) {
      this.finishPlayback();
      return;
    }
    const candidates = item.candidates ?? [];
    if (candidates.length === 0) {
      // Empty candidates → silent skip + advance (never a spinner, never TTS).
      this.emit({ type: "skipped", index: this.snapshot.currentIndex ?? index });
      this.advanceOrComplete(playId);
      return;
    }
    await this.playCandidates(item, candidates, 0, playId);
  }

  /** Walk the ordered candidate list, honoring the fallback/onAllFailed policy. */
  private async playCandidates(
    item: PlayableItem,
    candidates: PlayableSource[],
    candidateIndex: number,
    playId: number,
  ): Promise<void> {
    if (playId !== this.currentPlayId) return;
    const candidate = candidates[candidateIndex];
    if (!candidate) {
      // Every candidate failed → per-item onAllFailed policy.
      const onAllFailed = item.onAllFailed ?? "skip";
      if (onAllFailed === "stop") {
        // Hard halt: no advance, no "completed" (not a natural sequence end).
        this.stop();
        return;
      }
      this.emit({ type: "skipped", index: this.snapshot.currentIndex ?? 0 });
      this.advanceOrComplete(playId);
      return;
    }

    if (candidate.kind === "tts") {
      await this.playTtsCandidate(item, candidate, playId);
    } else {
      await this.playUrlCandidate(item, candidates, candidateIndex, candidate, playId);
    }
  }

  private async playTtsCandidate(
    item: PlayableItem,
    candidate: Extract<PlayableSource, { kind: "tts" }>,
    playId: number,
  ): Promise<void> {
    if (!this.tts?.isAvailable()) {
      // TTS unavailable (e.g. Android WebView) → silent skip, sequence continues.
      this.emit({ type: "skipped", index: this.snapshot.currentIndex ?? 0 });
      this.advanceOrComplete(playId);
      return;
    }
    this.updateSnapshot({ status: "playing" });
    this.emit({ type: "playing", index: this.snapshot.currentIndex ?? 0 });
    await this.tts.speak(candidate.text, this.snapshot.rate, candidate.lang ?? "zh-CN");
    if (playId !== this.currentPlayId) return;
    this.advanceOrComplete(playId);
  }

  private async playUrlCandidate(
    item: PlayableItem,
    candidates: PlayableSource[],
    candidateIndex: number,
    candidate: Extract<PlayableSource, { kind: "url" }>,
    playId: number,
  ): Promise<void> {
    if (!this.prepareAutoplay()) {
      this.handleBlocked();
      return;
    }
    this.updateSnapshot({ status: "playing" });
    this.emit({ type: "playing", index: this.snapshot.currentIndex ?? 0 });

    let reason: PlaybackEndReason;
    try {
      reason = await this.engine.playUrl(
        candidate.url,
        this.snapshot.rate,
        this.abortController!.signal,
      );
    } catch (err) {
      if (playId !== this.currentPlayId) return;
      if (isNotAllowedError(err)) {
        this.handleBlocked();
        return;
      }
      // Unknown play() failure → treat as a URL media error → fallback policy.
      await this.handleUrlFailure(item, candidates, candidateIndex, playId);
      return;
    }
    if (playId !== this.currentPlayId) return;
    if (reason === "paused" || reason === "aborted") return;
    if (reason === "error") {
      await this.handleUrlFailure(item, candidates, candidateIndex, playId);
      return;
    }
    // reason === "ended"
    this.advanceOrComplete(playId);
  }

  private async handleUrlFailure(
    item: PlayableItem,
    candidates: PlayableSource[],
    candidateIndex: number,
    playId: number,
  ): Promise<void> {
    const decision = this.behavior?.onUrlFailed?.(item) ?? "fallback";
    if (decision === "retry") {
      // Same candidate again (the consumer's onUrlFailed evicted any caches).
      await this.playCandidates(item, candidates, candidateIndex, playId);
    } else if (decision === "fallback") {
      // Next candidate.
      await this.playCandidates(item, candidates, candidateIndex + 1, playId);
    } else {
      // "skip" → next item.
      this.emit({ type: "skipped", index: this.snapshot.currentIndex ?? 0 });
      this.advanceOrComplete(playId);
    }
  }

  private async advanceOrComplete(playId: number): Promise<void> {
    if (playId !== this.currentPlayId) return;
    const strategy = this.getStrategy();
    const current = this.snapshot.currentIndex ?? 0;
    const next = strategy.getNextIndex(current, this.items.length);
    if (next !== null && strategy.shouldAutoAdvance()) {
      this.startPlayback(next);
    } else {
      this.finishPlayback();
    }
  }

  private finishPlayback(): void {
    const isSequence = this.getStrategy().kind === "sequence";
    this.modeOverride = null;
    this.engine?.stop();
    this.tts?.cancel();
    this.updateSnapshot({
      status: "stopped",
      currentIndex: null,
      error: null,
      hasCompleted: isSequence,
    });
    this.emitIndexChange();
    if (isSequence) {
      this.emit({ type: "completed" });
    }
  }

  /**
   * Autoplay guard. Returns false when playback must not start (→ `blocked`).
   * The `NotAllowedError` catch on `play()` remains the runtime fallback.
   */
  private prepareAutoplay(): boolean {
    const policy = this.autoplayPolicy();
    if (policy === "disallowed") return false;
    if (policy === "allowed-muted") {
      if (this.mutedAutoplay) {
        this.engine?.setMuted(true);
        return true;
      }
      return false;
    }
    // "allowed" | "unknown" → attempt; runtime catch is the source of truth.
    this.engine?.setMuted(false);
    return true;
  }

  private handleBlocked(): void {
    ++this.currentPlayId;
    this.abortController?.abort();
    this.abortController = null;
    this.engine?.stop();
    this.tts?.cancel();
    this.modeOverride = null;
    this.updateSnapshot({ status: "blocked", error: null });
    this.emit({ type: "blocked" });
  }

  private updateSnapshot(patch: Partial<AudioSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
  }

  private emitIndexChange(): void {
    this.emit({ type: "indexchange", index: this.snapshot.currentIndex });
  }
}

let sharedManager: AudioManager | null = null;

/** App-wide singleton — guarantees at most one audible playback app-wide. */
export function getAudioManager(): AudioManager {
  if (!sharedManager) {
    sharedManager = new AudioManager();
    sharedManager.init();
  }
  return sharedManager;
}

/** Fresh manager for tests / Storybook. */
export function createAudioManager(options?: AudioManagerInit): AudioManager {
  const manager = new AudioManager();
  manager.init(options ?? {});
  return manager;
}

/**
 * Resolve a behavior's `sources` (eager array or lazy producer) to concrete
 * `PlayableItem[]`. Used by hooks/consumers before `manager.load(items)`.
 */
export async function resolveBehaviorSources(
  sources: AudioBehavior["sources"],
): Promise<PlayableItem[]> {
  return typeof sources === "function" ? sources() : sources;
}
