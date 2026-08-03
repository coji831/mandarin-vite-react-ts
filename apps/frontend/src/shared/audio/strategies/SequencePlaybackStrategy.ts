/**
 * @file shared/audio/strategies/SequencePlaybackStrategy.ts
 * @description Sequence strategy: auto-advances through a passage.
 *
 * `getNextIndex` = current+1 until total-1, then null (→ `completed` event).
 * `getPrevIndex` = max(0, current-1). Used by readers global play (▶) and
 * tap-to-play.
 */

import type { PlaybackStrategy } from "./PlaybackStrategy";

export class SequencePlaybackStrategy implements PlaybackStrategy {
  readonly kind = "sequence" as const;

  getInitialIndex(_total: number): number {
    return 0;
  }

  getNextIndex(current: number, total: number): number | null {
    if (total <= 0) return null;
    const next = current + 1;
    return next < total ? next : null;
  }

  getPrevIndex(current: number, total: number): number | null {
    if (total <= 0) return null;
    return Math.max(0, current - 1);
  }

  shouldAutoAdvance(): boolean {
    return true;
  }
}
