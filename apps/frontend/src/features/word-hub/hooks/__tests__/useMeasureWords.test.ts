/**
 * @file hooks/__tests__/useMeasureWords.test.ts
 * @description Tests for useMeasureWords hook
 * Story 21.8: Measure Word Foundation — frontend display
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeasureWords } from "../useMeasureWords";

const mockLoadMeasureWords = vi.fn();

vi.mock("../../services", () => ({
  loadMeasureWords: (...args: unknown[]) => mockLoadMeasureWords(...args),
}));

const SAMPLE_RESULT = {
  wordId: "w_00001",
  simplified: "鱼",
  measureWords: [
    {
      id: "mw_001",
      simplified: "条",
      pinyin: "tiáo",
      meaning: "long, thin objects; fish",
      category: "measure",
      usageNote: "For long, thin things like fish and roads.",
      isDefault: true,
      exampleSentence: "一条鱼",
    },
  ],
};

describe("useMeasureWords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns idle state when wordId is null", () => {
    const { result } = renderHook(() => useMeasureWords(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.refetch).toBeTypeOf("function");
  });

  it("starts in loading state when wordId is provided", () => {
    mockLoadMeasureWords.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMeasureWords("w_00001"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("returns measure words after successful load", async () => {
    mockLoadMeasureWords.mockResolvedValue(SAMPLE_RESULT);

    const { result } = renderHook(() => useMeasureWords("w_00001"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(SAMPLE_RESULT);
    expect(result.current.isError).toBe(false);
    expect(mockLoadMeasureWords).toHaveBeenCalledWith("w_00001");
  });

  it("sets error state when fetch throws", async () => {
    mockLoadMeasureWords.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMeasureWords("w_00001"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it("refetch re-runs the fetch and recovers from error", async () => {
    mockLoadMeasureWords
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(SAMPLE_RESULT);

    const { result } = renderHook(() => useMeasureWords("w_00001"));

    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.data).toEqual(SAMPLE_RESULT));

    expect(result.current.isError).toBe(false);
    expect(mockLoadMeasureWords).toHaveBeenCalledTimes(2);
  });

  it("cancels request on unmount", () => {
    mockLoadMeasureWords.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useMeasureWords("w_00001"));

    expect(() => unmount()).not.toThrow();
  });
});
