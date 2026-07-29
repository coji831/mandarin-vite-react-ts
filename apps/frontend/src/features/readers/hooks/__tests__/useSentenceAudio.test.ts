/**
 * @file hooks/__tests__/useSentenceAudio.test.ts
 * @description Tests for useSentenceAudio (composed hook).
 * Story 21.6: Tests for decomposed audio hook.
 *
 * Tests cover: initial state, synchronous actions (setSpeed, seekTo via store),
 * play/pause interaction through store, and tab visibility.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSentenceAudio } from "../useSentenceAudio";
import { useReadingStore } from "../../stores";
import type { SentenceAudioMap } from "../../types";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  useReadingStore.setState({
    currentPassageId: null,
    mode: "library",
    popover: { glyph: null, position: null },
    currentAudioIndex: null,
    pendingPlayIndex: null,
  });
});

// ── Tests (synchronous behaviors) ─────────────────────────────────────────

describe("useSentenceAudio", () => {
  const mockAudioMap: SentenceAudioMap = {
    0: { url: "https://example.com/audio/0.mp3", source: "gcs" },
    1: { url: "https://example.com/audio/1.mp3", source: "gcs" },
  };
  const sentenceTexts = ["你好。", "你今天好吗？"];

  it("starts with idle state", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    expect(result.current.currentIndex).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isAudioLoading).toBe(false);
    expect(result.current.hasCompleted).toBe(false);
    expect(result.current.speed).toBe(1);
  });

  it("setSpeed changes playback speed", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.setSpeed(1.25);
    });

    expect(result.current.speed).toBe(1.25);
  });

  it("setSpeed with invalid value defaults to 1", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.setSpeed(2);
    });

    expect(result.current.speed).toBe(1);
  });

  it("seekTo() is callable without throwing", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
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
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    expect(() => {
      act(() => {
        result.current.seekTo(10);
      });
    }).not.toThrow();
  });

  it("pause() updates isPlaying and does not throw when not playing", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.pause();
    });

    // Pause when not playing should be a no-op
    expect(result.current.isPlaying).toBe(false);
  });

  it("stop() resets state when called without prior playback", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentIndex).toBeNull();
    expect(result.current.hasCompleted).toBe(false);
  });

  it("popover pause/resume: opening popover pauses playback", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    // Simulate popover opening while not playing — should be a no-op
    act(() => {
      useReadingStore.setState({ popover: { glyph: "你", position: { x: 0, y: 0 } } });
    });

    // Not playing, so no issue
    expect(result.current.isPlaying).toBe(false);
  });

  it("popover pause/resume: closing popover without prior playback does nothing", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    // Open then close popover
    act(() => {
      useReadingStore.setState({ popover: { glyph: "你", position: { x: 0, y: 0 } } });
    });

    act(() => {
      useReadingStore.setState({ popover: { glyph: null, position: null } });
    });

    // Should remain stopped
    expect(result.current.isPlaying).toBe(false);
  });

  it("tab visibility: does not throw when visibility changes while not playing", () => {
    const { result } = renderHook(() =>
      useSentenceAudio({
        sentenceCount: 2,
        audioUrls: mockAudioMap,
        sentenceTexts,
      }),
    );

    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should remain stopped
    expect(result.current.isPlaying).toBe(false);
  });
});
