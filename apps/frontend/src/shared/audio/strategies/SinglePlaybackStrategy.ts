/**
 * @file shared/audio/strategies/SinglePlaybackStrategy.ts
 * @description Single-item strategy: never advances, no navigation.
 *
 * Used by per-word/per-turn playback (quiz AudioPlayer, hub readings, review
 * cards, radicals ExampleCharCell, foundations TonesTab/DetailPanel,
 * CharacterStrokePlayer, per-sentence 🔊 in readers).
 */

import type { PlaybackStrategy } from "./PlaybackStrategy";

export class SinglePlaybackStrategy implements PlaybackStrategy {
  readonly kind = "single" as const;

  getInitialIndex(_total: number): number {
    return 0;
  }

  getNextIndex(_current: number, _total: number): number | null {
    return null;
  }

  getPrevIndex(_current: number, _total: number): number | null {
    return null;
  }

  shouldAutoAdvance(): boolean {
    return false;
  }
}
