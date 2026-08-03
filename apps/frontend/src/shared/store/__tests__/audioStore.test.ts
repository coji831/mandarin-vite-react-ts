/**
 * @file shared/store/__tests__/audioStore.test.ts
 * @description Unit tests for the presentational audio snapshot store.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useAudioStore } from "../audioStore";

const INITIAL = {
  status: "idle",
  currentIndex: null,
  rate: 1,
  error: null,
  hasCompleted: false,
} as const;

describe("audioStore", () => {
  beforeEach(() => {
    useAudioStore.setState(useAudioStore.getInitialState());
  });

  it("starts at the idle snapshot", () => {
    const s = useAudioStore.getState();
    expect(s.status).toBe("idle");
    expect(s.currentIndex).toBeNull();
    expect(s.rate).toBe(1);
    expect(s.error).toBeNull();
    expect(s.hasCompleted).toBe(false);
  });

  it("setSnapshot mirrors a manager snapshot (values only)", () => {
    useAudioStore.getState().setSnapshot({
      status: "playing",
      currentIndex: 2,
      rate: 1.25,
      error: null,
      hasCompleted: false,
    });
    const s = useAudioStore.getState();
    expect(s.status).toBe("playing");
    expect(s.currentIndex).toBe(2);
    expect(s.rate).toBe(1.25);
    expect(s.hasCompleted).toBe(false);
  });

  it("setSnapshot carries completion and error fields", () => {
    useAudioStore.getState().setSnapshot({
      status: "stopped",
      currentIndex: null,
      rate: 1,
      error: "boom",
      hasCompleted: true,
    });
    const s = useAudioStore.getState();
    expect(s.status).toBe("stopped");
    expect(s.hasCompleted).toBe(true);
    expect(s.error).toBe("boom");
  });

  it("reset returns to the idle snapshot", () => {
    useAudioStore.getState().setSnapshot({
      status: "error",
      currentIndex: 0,
      rate: 2,
      error: "x",
      hasCompleted: true,
    });
    useAudioStore.getState().reset();
    expect(useAudioStore.getState()).toMatchObject(INITIAL);
  });
});
