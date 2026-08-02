/**
 * @file hooks/__tests__/usePassageAudio.test.ts
 * @description Tests for usePassageAudio hook.
 * Story 21.6: Tests for passage audio loading hook.
 *
 * Tests cover: loading → success, API error, empty passageId.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePassageAudio } from "../usePassageAudio";
import { fetchPassageAudio } from "../../services/passageService";
import type { SentenceAudioMap } from "../../types";

// Mock the passage service
vi.mock("../../services/passageService", () => ({
  fetchPassageAudio: vi.fn(),
}));

const mockAudioUrls: SentenceAudioMap = {
  0: { url: "https://example.com/audio/0.mp3", source: "gcs" },
  1: { url: "https://example.com/audio/1.mp3", source: "gcs" },
};

describe("usePassageAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with idle state when no passageId", () => {
    const { result } = renderHook(() => usePassageAudio(null));

    expect(result.current.audioUrls).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads audio URLs successfully for a given passageId", async () => {
    vi.mocked(fetchPassageAudio).mockResolvedValue({
      audioUrls: mockAudioUrls,
    });

    const { result } = renderHook(() => usePassageAudio("passage-1"));

    // Initial state — loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.audioUrls).toBeNull();

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.audioUrls).toEqual(mockAudioUrls);
    expect(result.current.error).toBeNull();
    expect(fetchPassageAudio).toHaveBeenCalledWith("passage-1");
  });

  it("handles API error", async () => {
    vi.mocked(fetchPassageAudio).mockRejectedValue(new Error("Failed to load audio"));

    const { result } = renderHook(() => usePassageAudio("passage-err"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.audioUrls).toBeNull();
    expect(result.current.error).toBe("Failed to load audio");
  });

  it("handles empty passageId gracefully", () => {
    const { result } = renderHook(() => usePassageAudio(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.audioUrls).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fetchPassageAudio).not.toHaveBeenCalled();
  });

  it("retry re-fetches audio on demand", async () => {
    vi.mocked(fetchPassageAudio).mockResolvedValueOnce({
      audioUrls: mockAudioUrls,
    });

    const { result } = renderHook(() => usePassageAudio("passage-retry"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set up a different response for retry
    const updatedUrls: SentenceAudioMap = {
      0: { url: "https://example.com/audio/0-new.mp3", source: "gcs" },
    };
    vi.mocked(fetchPassageAudio).mockResolvedValueOnce({
      audioUrls: updatedUrls,
    });

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.audioUrls).toEqual(updatedUrls);
    expect(fetchPassageAudio).toHaveBeenCalledTimes(2);
  });
});
