/**
 * @file hooks/__tests__/usePassages.test.ts
 * @description Tests for usePassages hook
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePassages } from "../usePassages";

const mockFetchPassages = vi.fn();

vi.mock("../../services/passageService", () => ({
  fetchPassages: (...args: unknown[]) => mockFetchPassages(...args),
}));

const SAMPLE_PASSAGES = [
  { id: "p1", title: "Passage 1", hskLevel: 2, knownWordRatio: 75, isBookmarked: false },
  { id: "p2", title: "Passage 2", hskLevel: 3, knownWordRatio: 60, isBookmarked: true },
];

describe("usePassages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state", () => {
    mockFetchPassages.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePassages());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.passages).toEqual([]);
    expect(result.current.hasError).toBe(false);
  });

  it("returns passages after successful load", async () => {
    mockFetchPassages.mockResolvedValue(SAMPLE_PASSAGES);

    const { result } = renderHook(() => usePassages());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.passages).toEqual(SAMPLE_PASSAGES);
    expect(result.current.hasError).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });

  it("returns empty state when no passages", async () => {
    mockFetchPassages.mockResolvedValue([]);

    const { result } = renderHook(() => usePassages());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.passages).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it("sets hasError on fetch failure", async () => {
    mockFetchPassages.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePassages());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasError).toBe(true);
    expect(result.current.passages).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
  });

  it("retries successfully after error", async () => {
    mockFetchPassages.mockRejectedValueOnce(new Error("Network error"));
    mockFetchPassages.mockResolvedValueOnce(SAMPLE_PASSAGES);

    const { result } = renderHook(() => usePassages());

    await waitFor(() => expect(result.current.hasError).toBe(true));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasError).toBe(false);
    expect(result.current.passages).toEqual(SAMPLE_PASSAGES);
  });

  it("cancels request on unmount", () => {
    mockFetchPassages.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => usePassages());

    expect(() => unmount()).not.toThrow();
  });
});
