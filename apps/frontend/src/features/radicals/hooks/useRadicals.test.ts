/**
 * @file hooks/useRadicals.test.ts
 * @description Unit tests for useRadicals hook
 * Story 19.1: Radicals Browser Structure
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRadicals } from "./useRadicals";
import { radicalsService } from "../services/radicalsService";
import type { RadicalData } from "../types";

const mockRadicals: RadicalData[] = [
  {
    id: "rad_0001",
    glyph: "一",
    alternate_glyphs: [],
    name_pinyin: "yī",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    metadata: {},
  },
  {
    id: "rad_0002",
    glyph: "丨",
    alternate_glyphs: [],
    name_pinyin: "gǔn",
    meaning: "line",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 2,
    metadata: {},
  },
  {
    id: "rad_0008",
    glyph: "氵",
    alternate_glyphs: ["⺡", "氺"],
    name_pinyin: "sāndiǎnshuǐ",
    meaning: "water radical",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 8,
    metadata: {},
  },
  {
    id: "rad_0038",
    glyph: "女",
    alternate_glyphs: [],
    name_pinyin: "nǚ",
    meaning: "woman",
    stroke_count: 3,
    is_recommended: false,
    kangxi_index: 38,
    metadata: {},
  },
];

describe("useRadicals", () => {
  beforeEach(() => {
    radicalsService.clearCache();
    vi.clearAllMocks();
  });

  it("starts in loading state with no radicals", () => {
    // Don't resolve the promise so we can assert loading state
    vi.spyOn(radicalsService, "loadAllRadicals").mockReturnValue(
      new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => useRadicals());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.radicals).toEqual([]);
    expect(result.current.filteredRadicals).toEqual([]);
  });

  it("returns radicals after successful load", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.radicals).toEqual(mockRadicals);
    expect(result.current.filteredRadicals).toEqual(mockRadicals);
  });

  it("sets error state when load fails", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.radicals).toEqual([]);
  });

  it("sets generic error message when load fails with non-Error", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockRejectedValue("string error");

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to load radicals");
  });

  it("filters radicals when setFilter is called with search", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter({ search: "water" });
    });

    expect(result.current.filter.search).toBe("water");
    expect(result.current.filteredRadicals).toHaveLength(1);
    expect(result.current.filteredRadicals[0].id).toBe("rad_0008");
  });

  it("filters radicals by stroke count", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter({ strokeCount: 3 });
    });

    expect(result.current.filteredRadicals).toHaveLength(2);
  });

  it("filters radicals by showTop20Only", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter({ showTop20Only: true });
    });

    // Only 3 of the 4 mock radicals are recommended
    expect(result.current.filteredRadicals).toHaveLength(3);
    expect(result.current.filteredRadicals.every((r) => r.is_recommended)).toBe(true);
  });

  it("sorts radicals by sortBy", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter({ sortBy: "meaning" });
    });

    // Meaning order: line, one, water radical, woman
    expect(result.current.filteredRadicals[0].meaning).toBe("line");
    expect(result.current.filteredRadicals[3].meaning).toBe("woman");
  });

  it("resets filter to defaults when resetFilter is called", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setFilter({ search: "water", strokeCount: 3 });
    });

    expect(result.current.filter.search).toBe("water");

    act(() => {
      result.current.resetFilter();
    });

    expect(result.current.filter).toEqual({
      search: "",
      strokeCount: null,
      showTop20Only: false,
      sortBy: "kangxi_index",
    });
    // After reset, all radicals should be shown again
    expect(result.current.filteredRadicals).toHaveLength(4);
  });

  it("refetch reloads radicals data", async () => {
    const loadSpy = vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(loadSpy).toHaveBeenCalledTimes(1);

    // Call refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(loadSpy).toHaveBeenCalledTimes(2);
  });

  it("preserves radicals data and sets filteredRadicals correctly after filter reset", async () => {
    vi.spyOn(radicalsService, "loadAllRadicals").mockResolvedValue(mockRadicals);

    const { result } = renderHook(() => useRadicals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Apply filter
    act(() => {
      result.current.setFilter({ search: "water" });
    });

    expect(result.current.filteredRadicals).toHaveLength(1);

    // Reset filter
    act(() => {
      result.current.resetFilter();
    });

    // All radicals should be visible again
    expect(result.current.radicals).toHaveLength(4);
    expect(result.current.filteredRadicals).toHaveLength(4);
  });
});
