/**
 * @file shared/audio/__tests__/AudioManager.test.ts
 * @description Integration tests for AudioManager as a PURE TRANSPORT with a
 * fake engine + fake TTS + candidate-list items (Testing Trophy INTEGRATION tier).
 *
 * Phase 2 (candidates-as-data): the resolver concept is gone — the manager plays
 * whatever `PlayableItem[]` it is given. Covers: sequence auto-advance +
 * `completed`; single-mode no-advance; the candidate loop (url plays; url-fail →
 * `onUrlFailed` → next candidate; all-fail → `onAllFailed:"skip"` advances /
 * `"stop"` halts; empty candidates = silent skip + advance); never-hang (engine
 * promise always settles on pause/stop); autoplay `blocked` via BOTH the policy
 * API and the `NotAllowedError` runtime path; `allowed-muted` muted path;
 * `playId` stale-resolution drop; double-play serialization; TTS-unavailable →
 * `skipped` + continue; and basic transport (pause/resume/stop/setRate/seek).
 */

import { describe, expect, it, vi } from "vitest";
import { createAudioManager, resolveBehaviorSources } from "../AudioManager";
import type { AudioManager } from "../AudioManager";
import type { AudioBehavior, PlayableItem } from "../types";
import type { AudioEventMap } from "../events";
import { createFakeEngine, createFakeTts } from "./helpers";

const urlItems3: PlayableItem[] = [
  { id: "i0", candidates: [{ kind: "url", url: "https://audio/0.mp3" }] },
  { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
  { id: "i2", candidates: [{ kind: "url", url: "https://audio/2.mp3" }] },
];

function sequenceBehavior(
  items: PlayableItem[],
  overrides: Partial<AudioBehavior> = {},
): AudioBehavior {
  return { strategy: "sequence", sources: items, ...overrides };
}

function singleBehavior(
  items: PlayableItem[],
  overrides: Partial<AudioBehavior> = {},
): AudioBehavior {
  return { strategy: "single", sources: items, ...overrides };
}

function collect<T extends keyof AudioEventMap>(
  manager: AudioManager,
  type: T,
): AudioEventMap[T][] {
  const events: AudioEventMap[T][] = [];
  manager.on(type, (event) => events.push(event));
  return events;
}

describe("AudioManager", () => {
  it("auto-advances through a sequence and emits completed at the end", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });
    const completed = collect(manager, "completed");
    const indexes = collect(manager, "indexchange");

    await manager.load(urlItems3);
    manager.play(0);

    for (let i = 0; i < 3; i++) {
      await vi.waitFor(() => expect(engine.sessions).toHaveLength(i + 1));
      engine.resolveLastEnded();
    }

    await vi.waitFor(() => expect(completed).toHaveLength(1));
    expect(manager.getSnapshot()).toMatchObject({
      status: "stopped",
      currentIndex: null,
      hasCompleted: true,
    });
    // Cursor walked null (load) → 0 → 1 → 2 → null.
    expect(indexes.map((e) => e.index)).toEqual([null, 0, 1, 2, null]);
  });

  it("single mode does not auto-advance and does not mark completed", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: singleBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });
    const completed = collect(manager, "completed");

    await manager.load(urlItems3);
    manager.play(0, "single");

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.resolveLastEnded();

    await vi.waitFor(() => expect(manager.getSnapshot().status).toBe("stopped"));
    expect(engine.sessions).toHaveLength(1); // no advance
    expect(manager.getSnapshot().hasCompleted).toBe(false);
    expect(completed).toHaveLength(0);
  });

  it("drops stale resolutions on rapid nav (playId) and only latest is audible", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));

    // Rapid second play → first session is aborted (serialized).
    manager.play(1);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    expect(engine.sessions[0].settled).toBe(true);
    expect(engine.sessions[1].settled).toBe(false);
    expect(manager.getSnapshot().currentIndex).toBe(1);

    // Resolve the (now current) session → auto-advance proceeds from index 1.
    engine.resolveLastEnded();
    await vi.waitFor(() => expect(manager.getSnapshot().currentIndex).toBe(2));
  });

  it("double-play serialization: a new play() kills the previous engine playback", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    manager.play(2);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    // Exactly one unsettled session → only one audible playback.
    expect(engine.sessions.filter((s) => !s.settled)).toHaveLength(1);
    expect(manager.getSnapshot().currentIndex).toBe(2);
  });

  it("candidate loop: URL plays to completion and advances", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const onUrlFailed = vi.fn(() => "fallback" as const);
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3, { onUrlFailed }),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    expect(engine.sessions[0].url).toBe("https://audio/0.mp3");
    engine.resolveLastEnded();
    await vi.waitFor(() => expect(manager.getSnapshot().currentIndex).toBe(1));
    expect(onUrlFailed).not.toHaveBeenCalled();
  });

  it("candidate loop: URL failure → onUrlFailed('fallback') → next (TTS) candidate → continues", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      {
        id: "i0",
        candidates: [
          { kind: "url", url: "https://audio/0.mp3" },
          { kind: "tts", text: "你好", lang: "zh-CN" },
        ],
      },
      { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
    ];
    const onUrlFailed = vi.fn(() => "fallback" as const);
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(items, { onUrlFailed }),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.settleLast("error"); // media-level failure (404/codec)
    await vi.waitFor(() => expect(onUrlFailed).toHaveBeenCalledWith(items[0]));
    // "fallback" → next candidate is TTS.
    await vi.waitFor(() => expect(tts.speaks).toHaveLength(1));
    expect(tts.speaks[0].text).toBe("你好");
    expect(tts.speaks[0].lang).toBe("zh-CN");

    tts.resolveLast(); // TTS finishes → sequence continues to item 1
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    expect(engine.sessions[1].url).toBe("https://audio/1.mp3");
    expect(manager.getSnapshot().currentIndex).toBe(1);
  });

  it("candidate loop: onUrlFailed('retry') replays the same candidate", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      {
        id: "i0",
        candidates: [
          { kind: "url", url: "https://audio/0.mp3" },
          { kind: "tts", text: "你好", lang: "zh-CN" },
        ],
      },
    ];
    const onUrlFailed = vi.fn(() => "retry" as const);
    const manager = createAudioManager({
      engine,
      tts,
      behavior: singleBehavior(items, { onUrlFailed }),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.settleLast("error");
    // "retry" → same candidate (url 0) plays again.
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    expect(engine.sessions[1].url).toBe("https://audio/0.mp3");
    expect(tts.speak).not.toHaveBeenCalled();
  });

  it("candidate loop: all candidates failed → onAllFailed default 'skip' advances", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      { id: "i0", candidates: [{ kind: "url", url: "https://audio/0.mp3" }] },
      { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
    ];
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(items, { onUrlFailed: () => "fallback" }),
      autoplayPolicy: () => "allowed",
    });
    const skipped = collect(manager, "skipped");

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.settleLast("error"); // only candidate fails → all failed → skip → advance
    await vi.waitFor(() => expect(skipped).toHaveLength(1));
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    expect(engine.sessions[1].url).toBe("https://audio/1.mp3");
    expect(manager.getSnapshot().currentIndex).toBe(1);
  });

  it("candidate loop: all candidates failed → onAllFailed 'stop' halts", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      {
        id: "i0",
        candidates: [{ kind: "url", url: "https://audio/0.mp3" }],
        onAllFailed: "stop",
      },
      { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
    ];
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(items, { onUrlFailed: () => "fallback" }),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.settleLast("error"); // only candidate fails → all failed → "stop" → halt
    await vi.waitFor(() => expect(manager.getSnapshot().status).toBe("stopped"));
    expect(manager.getSnapshot().currentIndex).toBeNull();
    expect(engine.sessions).toHaveLength(1); // no advance to item 1
    expect(manager.getSnapshot().hasCompleted).toBe(false);
  });

  it("empty candidates = silent skip + advance (never a spinner, never TTS)", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      { id: "i0", candidates: [] },
      { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
    ];
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(items),
      autoplayPolicy: () => "allowed",
    });
    const skipped = collect(manager, "skipped");

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(skipped).toHaveLength(1));
    expect(tts.speak).not.toHaveBeenCalled();
    expect(engine.playUrl).not.toHaveBeenCalledWith(
      "https://audio/0.mp3",
      expect.anything(),
      expect.anything(),
    );
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    expect(engine.sessions[0].url).toBe("https://audio/1.mp3");
    expect(manager.getSnapshot().currentIndex).toBe(1);
  });

  it("never-hang: pause resolves the pending engine promise and resume replays", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));

    manager.pause();
    expect(manager.getSnapshot().status).toBe("paused");
    expect(engine.sessions[0].settled).toBe(true); // pending promise settled (paused)
    expect(engine.sessions[0].signal.aborted).toBe(false); // engine kept alive

    manager.resume();
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(2));
    expect(manager.getSnapshot().currentIndex).toBe(0);
    expect(manager.getSnapshot().status).toBe("playing");
  });

  it("never-hang: stop settles the pending engine promise with 'aborted'", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    expect(engine.sessions[0].settled).toBe(false);

    manager.stop();
    expect(engine.sessions[0].settled).toBe(true); // never hangs
    expect(engine.sessions[0].signal.aborted).toBe(true);
  });

  it("maps a disallowed policy to blocked (no engine play, no TTS loop)", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "disallowed",
    });
    const blocked = collect(manager, "blocked");

    await manager.load(urlItems3);
    manager.play(0);

    await vi.waitFor(() => expect(blocked).toHaveLength(1));
    expect(manager.getSnapshot().status).toBe("blocked");
    expect(engine.playUrl).not.toHaveBeenCalled();
    expect(tts.speak).not.toHaveBeenCalled();
  });

  it("maps a runtime NotAllowedError from play() to blocked (policy absent)", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const notAllowed = new DOMException("autoplay", "NotAllowedError");
    engine.playUrl.mockRejectedValueOnce(notAllowed);
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "unknown", // no policy signal → runtime fallback
    });
    const blocked = collect(manager, "blocked");

    await manager.load(urlItems3);
    manager.play(0);

    await vi.waitFor(() => expect(blocked).toHaveLength(1));
    expect(manager.getSnapshot().status).toBe("blocked");
    expect(tts.speak).not.toHaveBeenCalled(); // no TTS fallback while blocked
  });

  it("allowed-muted + mutedAutoplay plays muted and can be unmuted", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: singleBehavior(urlItems3, { mutedAutoplay: true }),
      autoplayPolicy: () => "allowed-muted",
    });

    await manager.load(urlItems3);
    manager.play(0);

    await vi.waitFor(() => expect(engine.setMuted).toHaveBeenCalledWith(true));
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    engine.unmute.mockClear();
    engine.resolveLastEnded();
    await vi.waitFor(() => expect(manager.getSnapshot().status).toBe("stopped"));
  });

  it("allowed-muted without mutedAutoplay maps to blocked (tap to play)", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed-muted",
    });
    const blocked = collect(manager, "blocked");

    await manager.load(urlItems3);
    manager.play(0);

    await vi.waitFor(() => expect(blocked).toHaveLength(1));
    expect(engine.playUrl).not.toHaveBeenCalled();
  });

  it("TTS-unavailable → silent skip (skipped) and the sequence continues to a URL item", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts({ available: false });
    const items: PlayableItem[] = [
      { id: "i0", candidates: [{ kind: "tts", text: "你好", lang: "zh-CN" }] },
      { id: "i1", candidates: [{ kind: "url", url: "https://audio/1.mp3" }] },
    ];
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(items),
      autoplayPolicy: () => "allowed",
    });
    const skipped = collect(manager, "skipped");

    await manager.load(items);
    manager.play(0);

    // Item 0 is TTS but unavailable → skipped, never a spinner.
    await vi.waitFor(() => expect(skipped).toHaveLength(1));
    // Sequence continues → item 1 is a URL → engine plays it.
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));
    expect(engine.sessions[0].url).toBe("https://audio/1.mp3");
    expect(manager.getSnapshot().currentIndex).toBe(1);
  });

  it("a TTS candidate speaks with the right text/lang and advances", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const items: PlayableItem[] = [
      { id: "i0", candidates: [{ kind: "tts", text: "你好", lang: "zh-CN" }] },
    ];
    const manager = createAudioManager({
      engine,
      tts,
      behavior: singleBehavior(items),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(items);
    manager.play(0);

    await vi.waitFor(() => expect(tts.speaks).toHaveLength(1));
    expect(tts.speaks[0].text).toBe("你好");
    expect(tts.speaks[0].lang).toBe("zh-CN");
    expect(manager.getSnapshot().status).toBe("playing");

    tts.resolveLast();
    await vi.waitFor(() => expect(manager.getSnapshot().status).toBe("stopped"));
    expect(engine.playUrl).not.toHaveBeenCalled();
  });

  it("stop aborts playback, resets cursor, and emits stopped", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });
    const stopped = collect(manager, "stopped");

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));

    manager.stop();
    expect(manager.getSnapshot()).toMatchObject({ status: "stopped", currentIndex: null });
    expect(engine.stop).toHaveBeenCalled();
    expect(tts.cancel).toHaveBeenCalled();
    expect(stopped).toHaveLength(1);
  });

  it("setRate updates the engine and emits ratechange", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({ engine, tts, behavior: singleBehavior(urlItems3) });
    const ratechanges = collect(manager, "ratechange");

    manager.setRate(1.25);
    expect(engine.setRate).toHaveBeenCalledWith(1.25);
    expect(manager.getSnapshot().rate).toBe(1.25);
    expect(ratechanges.map((e) => e.rate)).toEqual([1.25]);

    manager.setRate(-2); // invalid → clamped to 1
    expect(manager.getSnapshot().rate).toBe(1);
  });

  it("seek repositions the cursor without autoplaying", async () => {
    const engine = createFakeEngine();
    const tts = createFakeTts();
    const manager = createAudioManager({
      engine,
      tts,
      behavior: sequenceBehavior(urlItems3),
      autoplayPolicy: () => "allowed",
    });

    await manager.load(urlItems3);
    manager.play(0);
    await vi.waitFor(() => expect(engine.sessions).toHaveLength(1));

    manager.seek(2);
    expect(manager.getSnapshot()).toMatchObject({ status: "stopped", currentIndex: 2 });
    expect(engine.stop).toHaveBeenCalled();
  });

  it("resolveBehaviorSources resolves a lazy producer into items", async () => {
    const behavior: AudioBehavior = {
      strategy: "sequence",
      sources: async () => urlItems3,
    };
    await expect(resolveBehaviorSources(behavior.sources)).resolves.toEqual(urlItems3);
    const eager: AudioBehavior = { strategy: "single", sources: urlItems3 };
    await expect(resolveBehaviorSources(eager.sources)).resolves.toEqual(urlItems3);
  });
});
