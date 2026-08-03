/**
 * @file shared/audio/__tests__/strategies.test.ts
 * @description Unit tests for the pure playback strategies (boundary cases).
 */

import { describe, expect, it } from "vitest";
import { SequencePlaybackStrategy } from "../strategies/SequencePlaybackStrategy";
import { SinglePlaybackStrategy } from "../strategies/SinglePlaybackStrategy";

describe("SinglePlaybackStrategy", () => {
  const strategy = new SinglePlaybackStrategy();

  it("never advances", () => {
    expect(strategy.kind).toBe("single");
    expect(strategy.getNextIndex(0, 5)).toBeNull();
    expect(strategy.shouldAutoAdvance()).toBe(false);
  });

  it("never navigates previous", () => {
    expect(strategy.getPrevIndex(3, 5)).toBeNull();
    expect(strategy.getPrevIndex(0, 5)).toBeNull();
  });

  it("starts at index 0", () => {
    expect(strategy.getInitialIndex(5)).toBe(0);
  });
});

describe("SequencePlaybackStrategy", () => {
  const strategy = new SequencePlaybackStrategy();

  it("auto-advances within bounds", () => {
    expect(strategy.kind).toBe("sequence");
    expect(strategy.getNextIndex(0, 5)).toBe(1);
    expect(strategy.getNextIndex(2, 5)).toBe(3);
    expect(strategy.shouldAutoAdvance()).toBe(true);
  });

  it("returns null at the end (→ completed)", () => {
    expect(strategy.getNextIndex(4, 5)).toBeNull();
    expect(strategy.getNextIndex(5, 5)).toBeNull();
  });

  it("clamps previous at 0", () => {
    expect(strategy.getPrevIndex(3, 5)).toBe(2);
    expect(strategy.getPrevIndex(1, 5)).toBe(0);
    expect(strategy.getPrevIndex(0, 5)).toBe(0);
  });

  it("handles empty playlists", () => {
    expect(strategy.getNextIndex(0, 0)).toBeNull();
    expect(strategy.getPrevIndex(0, 0)).toBeNull();
    expect(strategy.getInitialIndex(0)).toBe(0);
  });
});
