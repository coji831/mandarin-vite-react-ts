/**
 * @file shared/audio/strategies/PlaybackStrategy.ts
 * @description Strategy-pattern interface for playback navigation.
 *
 * Encapsulates "what happens when the current item finishes" — the only real
 * divergence between single-sentence playback and passage sequence playback.
 * Removes the need for `pendingIndex`/`pendingSingleIndex` store signals.
 */

export interface PlaybackStrategy {
  readonly kind: "single" | "sequence";
  getInitialIndex(total: number): number;
  /** Index to play after `current` finishes; null → complete/stop. */
  getNextIndex(current: number, total: number): number | null;
  /** Index to play for "previous"; null → no-op. */
  getPrevIndex(current: number, total: number): number | null;
  /** Whether playback should auto-advance to the next index when one exists. */
  shouldAutoAdvance(): boolean;
}
