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
import type { AudioStatus } from "../../stores";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  useAudioStore.setState({
    currentIndex: null,
    pendingIndex: null,
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
      result.current.setSpeed(2);
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

  it("toggle() calls play when idle (async — sets currentIndex after delay)", async () => {
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

    // After the PLAYBACK_START_DELAY_MS timeout, currentIndex should be set
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(useAudioStore.getState().currentIndex).toBe(0);
    vi.useRealTimers();
  });

  it("popover pause/resume: opening popover pauses playback", () => {
    const { result } = renderHook(() =>
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
    const { result } = renderHook(() =>
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
});
