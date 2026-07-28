/**
 * @file hooks/__tests__/usePassageDetail.test.ts
 * @description Tests for usePassageDetail hook
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePassageDetail } from "../usePassageDetail";

const mockFetchPassageDetail = vi.fn();

vi.mock("../../services/passageService", () => ({
  fetchPassageDetail: (...args: unknown[]) => mockFetchPassageDetail(...args),
}));

const SAMPLE_RESPONSE = {
  id: "p1",
  title: "Passage 1",
  hskLevel: 2,
  sentences: [
    {
      index: 0,
      text: "你好。",
      pinyin: "nǐ hǎo.",
      words: [
        { glyph: "你", wordId: null, hskLevel: 1, pinyin: "nǐ", isKnown: true },
        { glyph: "好", wordId: null, hskLevel: 1, pinyin: "hǎo", isKnown: true },
        { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
      ],
    },
  ],
};

const EXPECTED_TRANSFORMED = {
  id: "p1",
  title: "Passage 1",
  hskLevel: 2,
  sentences: [
    {
      index: 0,
      text: "你好。",
      pinyin: "nǐ hǎo.",
      words: [
        { glyph: "你", isKnown: true, hskLevel: 1, pinyin: "nǐ" },
        { glyph: "好", isKnown: true, hskLevel: 1, pinyin: "hǎo" },
        { glyph: "。", isKnown: true, hskLevel: undefined, pinyin: undefined },
      ],
    },
  ],
};

describe("usePassageDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state when id is provided", () => {
    mockFetchPassageDetail.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePassageDetail("p1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.passage).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it("starts with null passage when id is null", () => {
    const { result } = renderHook(() => usePassageDetail(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.passage).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it("returns transformed passage after successful load", async () => {
    mockFetchPassageDetail.mockResolvedValue(SAMPLE_RESPONSE);

    const { result } = renderHook(() => usePassageDetail("p1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.passage).toEqual(EXPECTED_TRANSFORMED);
    expect(result.current.hasError).toBe(false);
  });

  it("sets hasError on fetch failure", async () => {
    mockFetchPassageDetail.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePassageDetail("p1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasError).toBe(true);
    expect(result.current.passage).toBeNull();
  });

  it("retries successfully after error", async () => {
    mockFetchPassageDetail.mockRejectedValueOnce(new Error("Network error"));
    mockFetchPassageDetail.mockResolvedValueOnce(SAMPLE_RESPONSE);

    const { result } = renderHook(() => usePassageDetail("p1"));

    await waitFor(() => expect(result.current.hasError).toBe(true));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasError).toBe(false);
    expect(result.current.passage).toEqual(EXPECTED_TRANSFORMED);
  });

  it("cancels request on unmount", () => {
    mockFetchPassageDetail.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => usePassageDetail("p1"));

    expect(() => unmount()).not.toThrow();
  });
});
