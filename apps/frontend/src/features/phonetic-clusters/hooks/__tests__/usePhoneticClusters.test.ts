/**
 * @file hooks/__tests__/usePhoneticClusters.test.ts
 * @description Unit tests for usePhoneticClusters hook
 * Story 21.6: Phonetic Clusters
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePhoneticClusters } from "../usePhoneticClusters";
import { phoneticClustersService } from "../../services/phoneticClustersService";
import type { PhoneticClusterDetail } from "../../types";

const mockClusters: PhoneticClusterDetail[] = [
  {
    id: "pc_0001",
    phoneticPattern: "青",
    pinyin: "qīng",
    description: "Characters containing 青 as phonetic component",
    pronunciationNote: "All characters share qing- onset but differ in tone",
    memberCount: 4,
    hskLevels: [1, 2],
    members: [
      { glyph: "请", pinyin: "qǐng", meaning: "please", hskLevel: 1 },
      { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2 },
      { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 2 },
      { glyph: "晴", pinyin: "qíng", meaning: "clear (weather)", hskLevel: 2 },
    ],
  },
  {
    id: "pc_0002",
    phoneticPattern: "包",
    pinyin: "bāo",
    description: "Characters containing 包 as phonetic component",
    pronunciationNote: null,
    memberCount: 5,
    hskLevels: [2, 3],
    members: [
      { glyph: "包", pinyin: "bāo", meaning: "to wrap", hskLevel: 3 },
      { glyph: "跑", pinyin: "pǎo", meaning: "to run", hskLevel: 2 },
      { glyph: "炮", pinyin: "pào", meaning: "cannon", hskLevel: null },
      { glyph: "抱", pinyin: "bào", meaning: "to hug", hskLevel: 2 },
      { glyph: "饱", pinyin: "bǎo", meaning: "full (stomach)", hskLevel: 2 },
    ],
  },
  {
    id: "pc_0003",
    phoneticPattern: "方",
    pinyin: "fāng",
    description: "Characters containing 方 as phonetic component",
    pronunciationNote: null,
    memberCount: 3,
    hskLevels: [2, 3, 4],
    members: [
      { glyph: "放", pinyin: "fàng", meaning: "to put", hskLevel: 2 },
      { glyph: "房", pinyin: "fáng", meaning: "house", hskLevel: 2 },
      { glyph: "防", pinyin: "fáng", meaning: "to prevent", hskLevel: 4 },
    ],
  },
];

describe("usePhoneticClusters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state", () => {
    // Don't resolve the promise so we can assert loading state
    vi.spyOn(phoneticClustersService, "getAll").mockReturnValue(
      new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => usePhoneticClusters());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.clusters).toEqual([]);
  });

  it("fetches all clusters on mount", async () => {
    const getAllSpy = vi.spyOn(phoneticClustersService, "getAll").mockResolvedValue(mockClusters);

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getAllSpy).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.clusters).toEqual(mockClusters);
  });

  it("returns clusters on success", async () => {
    vi.spyOn(phoneticClustersService, "getAll").mockResolvedValue(mockClusters);

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.clusters).toHaveLength(3);
    expect(result.current.clusters[0].phoneticPattern).toBe("青");
    expect(result.current.clusters[1].phoneticPattern).toBe("包");
  });

  it("sets error state on fetch failure", async () => {
    vi.spyOn(phoneticClustersService, "getAll").mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to fetch");
    expect(result.current.clusters).toEqual([]);
  });

  it("sets generic error message when fetch fails with non-Error", async () => {
    vi.spyOn(phoneticClustersService, "getAll").mockRejectedValue("string error");

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to load phonetic clusters");
  });

  it("retry re-fetches clusters", async () => {
    const getAllSpy = vi.spyOn(phoneticClustersService, "getAll").mockResolvedValue(mockClusters);

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getAllSpy).toHaveBeenCalledTimes(1);

    // Reset mock to verify retry calls it again
    getAllSpy.mockClear();
    getAllSpy.mockResolvedValue(mockClusters);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(getAllSpy).toHaveBeenCalledTimes(1));
  });

  it("applies client-side HSK filter", async () => {
    vi.spyOn(phoneticClustersService, "getAll").mockResolvedValue(mockClusters);

    const { result } = renderHook(() => usePhoneticClusters());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Initially no filter — all clusters returned
    expect(result.current.clusters).toHaveLength(3);

    // Set filter to HSK 1
    act(() => {
      result.current.setHskFilter(1);
    });

    // Only clusters with HSK level 1 in their hskLevels array
    expect(result.current.clusters).toHaveLength(1);
    expect(result.current.clusters[0].id).toBe("pc_0001");

    // Set filter to HSK 2
    act(() => {
      result.current.setHskFilter(2);
    });

    // Clusters with HSK level 2
    expect(result.current.clusters).toHaveLength(3);

    // Clear filter
    act(() => {
      result.current.setHskFilter(null);
    });

    expect(result.current.clusters).toHaveLength(3);
  });
});
