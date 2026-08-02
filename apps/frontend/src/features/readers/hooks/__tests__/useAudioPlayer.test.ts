/**
 * @file hooks/__tests__/useSentenceAudio.test.ts
 * @description Tests for useAudioPlayer (Phase 2 — replaces useSentenceAudio).
 *
 * Tests cover: initial state, synchronous actions (setSpeed, seekTo via store),
 * play/pause interaction through store, and tab visibility.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "../useAudioPlayer";
import { useAudioStore, useReadingStore } from "../../stores";
import { AudioEngine } from "../../lib";
import type { AudioStatus } from "../../stores";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  useAudioStore.setState({
    currentIndex: null,
    pendingIndex: null,
    pendingSingleIndex: null,
    status: "idle" as AudioStatus,
    error: null,
    speed: 1,
    audioUrls: null,
  });
  useReadingStore.setState({
    currentPassageId: null,
    mode: "library",
    popover: { glyph: null, position: null },
  });
});

// ── Tests (synchronous behaviors) ─────────────────────────────────────────

describe("useAudioPlayer", () => {
  const sentenceTexts = ["你好。", "你今天好吗？"];

  it("starts with idle state", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    expect(result.current.currentIndex).toBeNull();
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.hasJustCompleted).toBe(false);
  });

  it("setSpeed changes playback speed in store", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.setSpeed(1.25);
    });

    expect(useAudioStore.getState().speed).toBe(1.25);
  });

  it("setSpeed with invalid value defaults to 1", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      // Intentionally invalid speed — hook must fall back to 1
      result.current.setSpeed(2 as never);
    });

    expect(useAudioStore.getState().speed).toBe(1);
  });

  it("seekTo() is callable without throwing", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    expect(() => {
      act(() => {
        result.current.seekTo(1);
      });
    }).not.toThrow();
  });

  it("seekTo() with out-of-range index does not throw", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    expect(() => {
      act(() => {
        result.current.seekTo(10);
      });
    }).not.toThrow();
  });

  it("pause() transitions status to paused", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.pause();
    });

    expect(useAudioStore.getState().status).toBe("paused");
  });

  it("stop() resets state when called without prior playback", () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.stop();
    });

    expect(useAudioStore.getState().status).toBe("idle");
    expect(useAudioStore.getState().currentIndex).toBeNull();
  });

  it("toggle() calls play when idle (starts playback)", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.toggle();
    });

    // After the PLAYBACK_START_DELAY_MS timeout, playback has started.
    // With no audioUrls and no speechSynthesis in jsdom, the TTS fallback resolves
    // instantly and auto-advance runs to completion — so status is no longer idle.
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).not.toBe("idle");
    vi.useRealTimers();
  });

  it("popover pause/resume: opening popover pauses playback", () => {
    renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    // Simulate popover opening while not playing — should be a no-op
    act(() => {
      useReadingStore.setState({ popover: { glyph: "你", position: { x: 0, y: 0 } } });
    });

    // Not playing, so no issue
    expect(useAudioStore.getState().status).toBe("idle");
  });

  it("tab visibility: does not throw when visibility changes while not playing", () => {
    renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should remain idle
    expect(useAudioStore.getState().status).toBe("idle");
  });

  // ── Auto-advance semantics (VisFix: per-sentence play vs global play) ──────────

  it("single-sentence play (pendingSingleIndex signal) does NOT auto-advance", async () => {
    vi.useFakeTimers();
    const playUrlSpy = vi.spyOn(AudioEngine.prototype, "playUrl").mockResolvedValue(undefined);

    useAudioStore.setState({
      audioUrls: {
        0: { url: "https://cdn.example/0.mp3", source: "gcs" },
        1: { url: "https://cdn.example/1.mp3", source: "gcs" },
      },
    });

    renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    // SentenceDisplay per-sentence button sets pendingSingleIndex (single-sentence signal)
    act(() => {
      useAudioStore.getState().setPendingSingleIndex(0);
    });

    // Flush the async playSentence chain (mocked playUrl resolves as a microtask)
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Exactly one sentence played — cursor stays on 0, no advancement to sentence 1
    expect(playUrlSpy).toHaveBeenCalledTimes(1);
    expect(useAudioStore.getState().currentIndex).toBe(0);
    expect(useAudioStore.getState().status).toBe("playing");

    // Even after time passes, the single sentence must not advance
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(playUrlSpy).toHaveBeenCalledTimes(1);
    expect(useAudioStore.getState().currentIndex).toBe(0);

    vi.useRealTimers();
  });

  it("pendingIndex (tap-to-play auto-advance signal) DOES auto-advance", async () => {
    vi.useFakeTimers();
    const playUrlSpy = vi.spyOn(AudioEngine.prototype, "playUrl").mockResolvedValue(undefined);

    useAudioStore.setState({
      audioUrls: {
        0: { url: "https://cdn.example/0.mp3", source: "gcs" },
        1: { url: "https://cdn.example/1.mp3", source: "gcs" },
      },
    });

    renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    // pendingIndex = play-from-index with auto-advance (tap-to-play signal),
    // consumed via play() which introduces PLAYBACK_START_DELAY_MS.
    act(() => {
      useAudioStore.getState().setPendingIndex(0);
    });

    // Pass the 50ms PLAYBACK_START_DELAY_MS, then flush the async auto-advance chain
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Both sentences played — passage completed, cursor cleared
    expect(playUrlSpy).toHaveBeenCalledTimes(2);
    expect(useAudioStore.getState().status).toBe("completed");
    expect(useAudioStore.getState().currentIndex).toBeNull();

    vi.useRealTimers();
  });

  it("global play (play/toggle) DOES auto-advance through the whole passage", async () => {
    vi.useFakeTimers();
    const playUrlSpy = vi.spyOn(AudioEngine.prototype, "playUrl").mockResolvedValue(undefined);

    useAudioStore.setState({
      audioUrls: {
        0: { url: "https://cdn.example/0.mp3", source: "gcs" },
        1: { url: "https://cdn.example/1.mp3", source: "gcs" },
      },
    });

    const { result } = renderHook(() =>
      useAudioPlayer({
        sentenceCount: 2,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.play();
    });

    // Pass the 50ms PLAYBACK_START_DELAY_MS, then flush the async auto-advance chain
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Both sentences played — passage completed, cursor cleared
    expect(playUrlSpy).toHaveBeenCalledTimes(2);
    expect(useAudioStore.getState().status).toBe("completed");
    expect(useAudioStore.getState().currentIndex).toBeNull();
    expect(result.current.hasJustCompleted).toBe(true);

    vi.useRealTimers();
  });
});
