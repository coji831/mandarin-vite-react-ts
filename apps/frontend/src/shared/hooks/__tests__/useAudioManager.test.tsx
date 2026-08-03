/**
 * @file shared/hooks/__tests__/useAudioManager.test.tsx
 * @description Integration tests for the useAudioManager React bridge.
 *
 * Uses a fake manager (injected via the `manager` option) to verify: config
 * propagation, event → store mirroring (deduped — no re-render on progress),
 * NO `timeupdate` subscription, stable command callbacks, load-on-mount, and
 * unmount cleanup (unsubscribe + stop per policy).
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioBehavior, AudioManager, AudioSnapshot, PlayableItem } from "../../audio";
import { useAudioStore } from "../../store";
import { useAudioManager } from "../useAudioManager";

const INITIAL_SNAPSHOT: AudioSnapshot = {
  status: "idle",
  currentIndex: null,
  rate: 1,
  error: null,
  hasCompleted: false,
};

const SNAPSHOT_EVENT_TYPES = [
  "playing",
  "paused",
  "stopped",
  "indexchange",
  "completed",
  "ratechange",
  "error",
  "blocked",
  "skipped",
];

function createFakeManager(): AudioManager & {
  init: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  setRate: ReturnType<typeof vi.fn>;
  emit: (type: string, event: unknown) => void;
  setSnapshot: (snapshot: AudioSnapshot) => void;
} {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  let snapshot: AudioSnapshot = { ...INITIAL_SNAPSHOT };

  const manager = {
    init: vi.fn(),
    load: vi.fn(async () => undefined),
    on: vi.fn((type: string, cb: (event: unknown) => void) => {
      const set = listeners.get(type) ?? new Set<(event: unknown) => void>();
      set.add(cb);
      listeners.set(type, set);
      return () => {
        set.delete(cb);
      };
    }),
    emit: (type: string, event: unknown) => {
      const set = listeners.get(type);
      if (set) for (const cb of [...set]) cb(event);
    },
    getSnapshot: vi.fn(() => ({ ...snapshot })),
    setSnapshot: (next: AudioSnapshot) => {
      snapshot = { ...next };
    },
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    seek: vi.fn(),
    setRate: vi.fn(),
    restart: vi.fn(),
  };
  return manager as unknown as AudioManager & {
    init: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    setRate: ReturnType<typeof vi.fn>;
    emit: (type: string, event: unknown) => void;
    setSnapshot: (snapshot: AudioSnapshot) => void;
  };
}

describe("useAudioManager", () => {
  beforeEach(() => {
    useAudioStore.setState(useAudioStore.getInitialState());
  });

  it("reconfigures the shared manager with the behavior on mount", () => {
    const manager = createFakeManager();
    const behavior: AudioBehavior = {
      strategy: "sequence",
      sources: [{ id: "a", candidates: [{ kind: "tts", text: "你", lang: "zh-CN" }] }],
    };
    renderHook(() => useAudioManager({ manager, behavior }));
    expect(manager.init).toHaveBeenCalledWith({
      behavior,
      mutedAutoplay: undefined,
    });
  });

  it("subscribes to snapshot events only — never timeupdate", () => {
    const manager = createFakeManager();
    renderHook(() => useAudioManager({ manager }));
    const subscribed = manager.on.mock.calls.map((call) => call[0]);
    expect(subscribed.sort()).toEqual([...SNAPSHOT_EVENT_TYPES].sort());
    expect(subscribed).not.toContain("timeupdate");
  });

  it("mirrors manager events into the store snapshot and dedupes (no re-notify on progress)", () => {
    const manager = createFakeManager();
    const { result } = renderHook(() => useAudioManager({ manager }));

    let notifies = 0;
    const unsub = useAudioStore.subscribe(() => {
      notifies++;
    });

    // Snapshot change → store updates + one notify + hook re-renders.
    manager.setSnapshot({
      status: "playing",
      currentIndex: 0,
      rate: 1,
      error: null,
      hasCompleted: false,
    });
    act(() => manager.emit("playing", { type: "playing", index: 0 }));
    expect(useAudioStore.getState().status).toBe("playing");
    expect(useAudioStore.getState().currentIndex).toBe(0);
    expect(notifies).toBe(1);
    expect(result.current.status).toBe("playing");

    // Same snapshot re-emitted (e.g. a repeated indexchange) → no extra notify.
    act(() => manager.emit("indexchange", { type: "indexchange", index: 0 }));
    expect(notifies).toBe(1);

    unsub();
  });

  it("exposes stable command callbacks that forward to the manager", () => {
    const manager = createFakeManager();
    const { result, rerender } = renderHook(() => useAudioManager({ manager }));

    const firstPlay = result.current.play;
    rerender();
    expect(result.current.play).toBe(firstPlay);

    act(() => result.current.play(2, "sequence"));
    expect(manager.play).toHaveBeenCalledWith(2, "sequence");
    act(() => result.current.setRate(1.25));
    expect(manager.setRate).toHaveBeenCalledWith(1.25);
    act(() => result.current.stop());
    expect(manager.stop).toHaveBeenCalled();
  });

  it("loads explicit items on mount", async () => {
    const manager = createFakeManager();
    const items: PlayableItem[] = [
      { id: "a", candidates: [{ kind: "tts", text: "你", lang: "zh-CN" }] },
    ];
    renderHook(() => useAudioManager({ manager, items }));
    await vi.waitFor(() => expect(manager.load).toHaveBeenCalledWith(items));
  });

  it("resolves behavior.sources and loads the items on mount", async () => {
    const manager = createFakeManager();
    const items: PlayableItem[] = [
      { id: "a", candidates: [{ kind: "url", url: "https://a.mp3" }] },
    ];
    const behavior: AudioBehavior = { strategy: "sequence", sources: items };
    renderHook(() => useAudioManager({ manager, behavior }));
    await vi.waitFor(() => expect(manager.load).toHaveBeenCalledWith(items));
  });

  it("stops audio on unmount by default (route changes kill audio)", () => {
    const manager = createFakeManager();
    const { unmount } = renderHook(() => useAudioManager({ manager }));
    unmount();
    expect(manager.stop).toHaveBeenCalled();
  });

  it("does not stop on unmount when stopOnUnmount is false", () => {
    const manager = createFakeManager();
    const { unmount } = renderHook(() => useAudioManager({ manager, stopOnUnmount: false }));
    unmount();
    expect(manager.stop).not.toHaveBeenCalled();
  });

  it("stops mirroring events after unmount (unsubscribe)", () => {
    const manager = createFakeManager();
    const { unmount } = renderHook(() => useAudioManager({ manager }));
    manager.setSnapshot({
      status: "paused",
      currentIndex: 1,
      rate: 1,
      error: null,
      hasCompleted: false,
    });
    unmount();
    act(() => manager.emit("paused", { type: "paused", index: 1 }));
    expect(useAudioStore.getState().status).toBe("idle"); // not updated post-unmount
  });
});
