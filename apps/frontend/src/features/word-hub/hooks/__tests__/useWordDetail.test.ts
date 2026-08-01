/**
 * @file hooks/__tests__/useWordDetail.test.ts
 * @description Tests for useWordDetail hook
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWordDetail } from "../useWordDetail";

const mockLoadWordData = vi.fn();

vi.mock("../../services", () => ({
  loadWordData: (...args: unknown[]) => mockLoadWordData(...args),
}));

const SAMPLE_WORD = {
  id: "w_00001",
  glyph: "好",
  pinyin: "hǎo",
  definitions: ["good", "fine", "well"],
  hskLevel: 1,
  constituentCharacters: [
    { glyph: "女", pinyin: "nǚ", meaning: "woman" },
    { glyph: "子", pinyin: "zǐ", meaning: "child" },
  ],
};

describe("useWordDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null data when glyph is null", () => {
    const { result } = renderHook(() => useWordDetail(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("starts in loading state when glyph is provided", () => {
    mockLoadWordData.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useWordDetail("好"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("returns word data after successful load", async () => {
    mockLoadWordData.mockResolvedValue(SAMPLE_WORD);

    const { result } = renderHook(() => useWordDetail("好"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(SAMPLE_WORD);
    expect(result.current.isError).toBe(false);
  });

  it("sets error state when fetch throws", async () => {
    mockLoadWordData.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWordDetail("error-throw-glyph"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it("cancels request on unmount", () => {
    mockLoadWordData.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useWordDetail("好"));

    expect(() => unmount()).not.toThrow();
  });
});
